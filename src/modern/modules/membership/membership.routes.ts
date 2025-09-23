import express from "express";
import { get, create, terminate } from "./membership.controller";

const router = express.Router();

router.get("/", get);

router.post("/", create);

router.post("/terminate", terminate);

export default router;