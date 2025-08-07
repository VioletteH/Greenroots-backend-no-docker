import { ErrorRequestHandler } from "express";

export class AppError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    Error.captureStackTrace(this, this.constructor); //Used to cleanly capture the stack trace (call stack).
  }
}

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    if (err instanceof AppError) {
        res.status(err.status).json({
            status: "error",
            message: err.message, 
        });
        return;
    }
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
    return;
}