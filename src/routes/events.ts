import { Router } from "express";
import { EventBus } from "../events/eventBus";

interface EventsDeps {
  eventBus: EventBus;
}

export function createEventsRouter({ eventBus }: EventsDeps): Router {
  const router = Router();

  router.get("/events", (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const events = eventBus.getRecentEvents(limit);
    res.json({ ok: true, data: events });
  });

  return router;
}
