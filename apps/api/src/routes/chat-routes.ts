import type { FastifyInstance } from "fastify";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Config injected from the root AppConfig
// ---------------------------------------------------------------------------
interface ChatRouteDependencies {
  openaiApiKey: string;
  chatModel: string;
  chatSystemPrompt: string;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_MESSAGES = 20;

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(MAX_MESSAGE_LENGTH),
});

const ChatInputSchema = z.object({
  messages: z.array(MessageSchema).min(1),
});

// ---------------------------------------------------------------------------
// In-memory rate limiter: max 20 requests per IP per minute
// No new package needed — a Map + periodic cleanup is sufficient for V1.
// ---------------------------------------------------------------------------
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 20;
const ipCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipCounts.get(ip);
  if (!entry || now >= entry.resetAt) {
    ipCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_MAX_REQUESTS) return false;
  entry.count++;
  return true;
}

// Prevent unbounded growth — purge stale IPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipCounts) {
    if (now >= entry.resetAt) ipCounts.delete(ip);
  }
}, 5 * 60_000);

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------
export async function registerChatRoutes(
  app: FastifyInstance,
  deps: ChatRouteDependencies,
) {
  app.post("/api/chat", async (request, reply) => {
    // Rate limit
    const ip = request.ip;
    if (!checkRateLimit(ip)) {
      return reply.status(429).send({
        error: "Too many requests. Please wait a moment before sending another message.",
      });
    }

    // Validate body
    const parsed = ChatInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: parsed.error.issues[0]?.message ?? "Invalid message format",
      });
    }

    // Keep only the most recent 15 messages to preserve token limit and performance
    const recentMessages = parsed.data.messages.slice(-15);

    // Build messages array for OpenAI
    // System prompt is injected server-side; client cannot override it.
    const openaiMessages = [
      { role: "system" as const, content: deps.chatSystemPrompt },
      ...recentMessages,
    ];

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${deps.openaiApiKey}`,
        },
        // stream: false — compatible with streaming in future (just change this flag
        // and pipe the response body through SSE or a ReadableStream).
        body: JSON.stringify({
          model: deps.chatModel,
          messages: openaiMessages,
          stream: false,
          max_tokens: 500,
          temperature: 0.4,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        app.log.error({ status: response.status, body: errText }, "OpenAI API error");
        throw new Error(`OpenAI responded with ${response.status}`);
      }

      const data = (await response.json()) as {
        choices: { message: { content: string } }[];
      };

      const reply_text = data.choices[0]?.message?.content?.trim() ?? "";
      return reply.send({ reply: reply_text });
    } catch (err) {
      app.log.error(err, "Chat proxy error");
      return reply.status(503).send({
        reply:
          "I'm having trouble connecting right now. Please call/WhatsApp us at +91 7039164777 or reach out at support@syncoraxp.com.",
      });
    }
  });
}
