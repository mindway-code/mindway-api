import { z } from "zod";

export const createAssociationChildSchema = z.object({
  accessCode: z.string().trim().min(6).max(10),
});

export default { createAssociationChildSchema };

