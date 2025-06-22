import { Request, Response } from "express";
import { getMembershipsWithPeriods } from "./membership.service";

export const get = (req: Request, res: Response) => {
  const membershipsWithPeriods = getMembershipsWithPeriods();
  res.status(200).json(membershipsWithPeriods);
}

export const create = (req: Request, res: Response) => {
  throw new Error('not implemented')
}
