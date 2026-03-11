import type { Request, Response, NextFunction } from "express";
import { forbidden } from "../errors/httpError.js";

export function authTherapistmiddleware(req: Request, _res: Response, next: NextFunction) {
	const user = (req as any).user as { id?: string; role?: string } | undefined;
  if ( user != undefined  && (user.role === "admin" || user.role !== "therapist")) {
    return next();
  }
  else return next(forbidden());
}

export default authTherapistmiddleware;
