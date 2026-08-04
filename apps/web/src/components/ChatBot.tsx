import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { ChatTeardropText, PaperPlaneTilt, Trash, WhatsappLogo, X } from "@phosphor-icons/react";
import { apiFetch } from "../api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Message {
  role: "user" | "assistant";
  content: string;
}

const MAX_MESSAGE_LENGTH = 1000;
const STORAGE_KEY = "syncoraxp_chat_history";
const WHATSAPP_NUMBER = "917039164777";
const WHATSAPP_PRESET_MSG = encodeURIComponent("Hi SyncoraXP, I'm reaching out from your website for an inquiry.");

const INITIAL_BOT_MESSAGE: Message = {
  role: "assistant",
  content: "👋 Hi! I'm the SyncoraXP assistant. Ask me anything about our platform — webinars, virtual events, pricing, or getting started.",
};

// Helper to render **bold** markdown tags as real bold text
function renderFormattedContent(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore parse errors
    }
    return [INITIAL_BOT_MESSAGE];
  });
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync to localStorage whenever messages state updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore storage write errors
    }
  }, [messages]);

  // Clear chat history
  function handleClearChat() {
    setMessages([INITIAL_BOT_MESSAGE]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = draft.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];

    setMessages(nextMessages);
    setDraft("");
    setLoading(true);

    try {
      // Send only recent messages (sliding window of last 15) to keep prompt context clean & performant
      const history = nextMessages.slice(-15).map(({ role, content }) => ({ role, content }));
      const res = await apiFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      const data = (await res.json()) as { reply?: string; error?: string };
      const botReply = data.reply ?? data.error ?? "Something went wrong. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: botReply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm having trouble connecting right now. Please call or WhatsApp us at +91 7039164777, or reach out at support@syncoraxp.com.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void send();
  }

  // Send on Enter, new line on Shift+Enter
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <>
      {/* Floating WhatsApp Quick Action Button */}
      <a
        id="whatsapp-bubble"
        className="whatsapp-bubble"
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_PRESET_MSG}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp (+91 7039164777)"
        title="Chat with us on WhatsApp (+91 7039164777)"
      >
        <img src="/whatsapp-icon.svg" alt="WhatsApp" style={{ width: "52px", height: "52px", display: "block" }} />
      </a>

      {/* Floating AI Chatbot Bubble Button */}
      <button
        id="chatbot-bubble"
        className="chatbot-bubble"
        aria-label="Open SyncoraXP support chat"
        onClick={() => setOpen((v) => !v)}
      >
        <ChatTeardropText size={24} weight="fill" />
      </button>

      {/* Chat panel */}
      {open && (
        <div className="chatbot-panel" role="dialog" aria-label="SyncoraXP support chat">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-title">
              <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                <img
                  src="/SyncoraXP_Logo.png"
                  alt="SyncoraXP"
                  style={{
                    width: "30px",
                    height: "30px",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
                <span
                  className="chatbot-online-dot"
                  style={{
                    position: "absolute",
                    bottom: "-2px",
                    right: "-2px",
                    border: "1.5px solid #5264e8",
                  }}
                  aria-hidden="true"
                />
              </div>
              <span style={{ fontWeight: 700, fontSize: "14.5px" }}>SyncoraXP Assistant</span>
            </div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <button
                className="chatbot-close"
                title="Clear chat history"
                aria-label="Clear chat history"
                onClick={handleClearChat}
              >
                <Trash size={14} weight="bold" />
              </button>
              <button
                className="chatbot-close"
                aria-label="Close chat"
                onClick={() => setOpen(false)}
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chatbot-messages" role="log" aria-live="polite">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chatbot-msg ${msg.role === "user" ? "chatbot-msg--user" : "chatbot-msg--bot"}`}
              >
                {renderFormattedContent(msg.content)}
              </div>
            ))}
            {loading && (
              <div className="chatbot-typing" aria-label="Assistant is typing">
                <span /><span /><span />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form className="chatbot-form" onSubmit={handleSubmit}>
            <textarea
              id="chatbot-input"
              className="chatbot-input"
              placeholder="Ask about SyncoraXP…"
              value={draft}
              rows={1}
              maxLength={MAX_MESSAGE_LENGTH}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              aria-label="Chat message"
            />
            <button
              id="chatbot-send"
              type="submit"
              className="chatbot-send"
              disabled={loading || !draft.trim()}
              aria-label="Send message"
            >
              <PaperPlaneTilt size={16} weight="fill" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
