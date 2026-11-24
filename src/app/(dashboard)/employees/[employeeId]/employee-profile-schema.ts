import { z } from "zod";
import { isEmployeeId } from "../employees-url";

export const employeeProfileSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100, "First name must be at most 100 characters"),
  last_name: z.string().trim().min(1, "Last name is required").max(100, "Last name must be at most 100 characters"),
  departmentId: z.string().refine(isEmployeeId, "Department is required"),
  positionId: z.string().refine(isEmployeeId, "Position is required"),
});

export type EmployeeProfileFields = z.infer<typeof employeeProfileSchema>;
