import { z } from "zod";

export const createCvSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255, "Name must be at most 255 characters"),
  education: z.string().trim().min(1, "Education is required").max(255, "Education must be at most 255 characters"),
  description: z.string().trim().min(1, "Description is required"),
});

export type CreateCvFields = z.infer<typeof createCvSchema>;
