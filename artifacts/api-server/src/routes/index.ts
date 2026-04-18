import { Router, type IRouter } from "express";
import healthRouter from "./health";
import placesRouter from "./places";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(placesRouter);
router.use(storageRouter);

export default router;
