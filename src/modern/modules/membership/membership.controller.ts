import { Request, Response } from "express";
import { createMembership, getMembershipsWithPeriods } from "./membership.service";

export const get = (req: Request, res: Response) => {
  const membershipsWithPeriods = getMembershipsWithPeriods();
  res.status(200).json(membershipsWithPeriods);
}

export const create = (req: Request, res: Response) => {
  const membership = createMembership(req.body);
  res.status(201).json(membership);
}
