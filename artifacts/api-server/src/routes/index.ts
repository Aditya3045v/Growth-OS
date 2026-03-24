import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import habitsRouter from "./habits.js";
import tasksRouter from "./tasks.js";
import leadsRouter from "./leads.js";
import eventsRouter from "./events.js";
import notesRouter from "./notes.js";
import checkinsRouter from "./checkins.js";
import statsRouter from "./stats.js";
import settingsRouter from "./settings.js";
import notificationsRouter from "./notifications.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(habitsRouter);
router.use(tasksRouter);
router.use(leadsRouter);
router.use(eventsRouter);
router.use(notesRouter);
router.use(checkinsRouter);
router.use(statsRouter);
router.use(settingsRouter);
router.use(notificationsRouter);

export default router;
