import type { FastifyInstance } from "fastify";
import type { InvitationMailer } from "../email/invitation-mailer";
import { z } from "zod";

const DemoInputSchema = z.object({
  fullName: z.string().min(2),
  workEmail: z.string().email(),
  phone: z.string().min(8).max(18),
  countryCode: z.string(),
  city: z.string().min(2),
  company: z.string().min(2),
  category: z.string(),
  message: z.string().optional().default(""),
});

export async function registerDemoRoutes(
  app: FastifyInstance,
  dependencies: { mailer: InvitationMailer },
) {
  app.post("/api/demo", async (request, reply) => {
    const parsed = DemoInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0]?.message ?? "Invalid form data" });
    }

    try {
      await dependencies.mailer.sendDemoRequest(parsed.data);
      return reply.status(200).send({ success: true, message: "Demo request email sent successfully" });
    } catch (err: any) {
      app.log.error(err);
      return reply.status(500).send({ error: err.message ?? "Failed to send email" });
    }
  });
}
