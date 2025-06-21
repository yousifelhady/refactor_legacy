import express from "express";
import { getMembership, createMembership } from "../controllers/membership";

const router = express.Router();

router.get("/", getMembership);

router.post("/", createMembership);

export default router;
