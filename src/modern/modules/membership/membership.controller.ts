import { Request, Response } from "express";
import { createMembershipWithPeriods, getMembershipsWithPeriods } from "./membership.service";

export const get = (req: Request, res: Response) => {
  const membershipsWithPeriods = getMembershipsWithPeriods();
  res.status(200).json(membershipsWithPeriods);
}

export const create = (req: Request, res: Response) => {
  const membershipWithPeriods = createMembershipWithPeriods(req.body);
  res.status(201).json({
		membership: membershipWithPeriods.membership,
		membershipPeriods: membershipWithPeriods.periods,
	});
}
