import type { Request, Response } from "express";
import { sendError, sendSuccess } from "../../../../utils/response.js";
import { associateByAccessCodeService } from "./associationChildren.service.js";

export async function associateByAccessCodeController(req: Request, res: Response) {
  try {
    const requesterId = req.user!.id;
    const dto = req.body as import("./associationChildren.types.js").CreateAssociationChildDTO;

    const result = await associateByAccessCodeService({ requesterId, dto });
    const message = result.alreadyHadAccess ? "Child already accessible" : "Child associated";
    return sendSuccess(res, result, message);
  } catch (err) {
    return sendError(res, err);
  }
}

export default { associateByAccessCodeController };

