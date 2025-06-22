import { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod';
import { CreateMembershipRequestBodyError } from './modern/modules/membership/membership.errors';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map(issue => ({
      message: issue.message,
    }));
    return res.status(400).json({
      message: formattedErrors[0].message,
    });
  }
  if (err instanceof CreateMembershipRequestBodyError) {
    return res.status(400).json({
      message: err.message,
    });
  }
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
};
