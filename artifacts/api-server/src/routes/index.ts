import { Router, type IRouter } from "express";
import healthRouter from "./health";
import lmsRouter from "./lms";

const router: IRouter = Router();

router.use(healthRouter);
router.use(lmsRouter);

export default router;
