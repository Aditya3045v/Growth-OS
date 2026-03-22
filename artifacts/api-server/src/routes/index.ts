import { Router, type IRouter } from "express";
import healthRouter from "./health";
import habitsRouter from "./habits";
import tasksRouter from "./tasks";
import leadsRouter from "./leads";
import eventsRouter from "./events";
import notesRouter from "./notes";
import checkinsRouter from "./checkins";
import statsRouter from "./stats";
import settingsRouter from "./settings";
import notificationsRouter from "./notifications";

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
