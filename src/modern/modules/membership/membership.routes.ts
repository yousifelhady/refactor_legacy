import express from "express";
import { get, create } from "./membership.controller";

const router = express.Router();

router.get("/", get);

router.post("/", create);

export default router;