import { z } from "zod"

export const employeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  jobTitle: z.string().optional(),
  workEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  workPhone: z.string().optional(),
  departmentId: z.string().optional(),
  managerId: z.string().optional(),
  hireDate: z.string().optional(),
  wage: z.coerce.number().min(0, "Must be 0 or more"),
})
export type EmployeeInput = z.infer<typeof employeeSchema>

export const departmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
})
export type DepartmentInput = z.infer<typeof departmentSchema>
