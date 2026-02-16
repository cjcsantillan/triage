import { Router, type Request, type Response, type NextFunction } from "express";
import { triageTicket, BedrockInvocationError } from "../../lib/triageService.js";

const MAX_TICKET_LENGTH = 4000;

export const triageRouter = Router();

triageRouter.post("/api/triage", async (req: Request, res: Response, next: NextFunction) => {
  const ticket = req.body?.ticket;

  if (typeof ticket !== "string" || ticket.trim().length === 0) {
    res.status(400).json({ error: "Request body must include a non-empty 'ticket' string." });
    return;
  }
  if (ticket.length > MAX_TICKET_LENGTH) {
    res.status(400).json({ error: `Ticket text exceeds ${MAX_TICKET_LENGTH} characters.` });
    return;
  }

  try {
    const result = await triageTicket(ticket.trim());
    res.json(result);
  } catch (err) {
    next(err);
  }
});

triageRouter.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof BedrockInvocationError) {
    res.status(502).json({ error: "The triage model failed to produce a result. Please try again." });
    return;
  }
  next(err);
});
