import { z } from "zod"

// Time Off
export const timeOffTypes = ["ANNUAL", "SICK", "UNPAID"] as const
export const timeOffSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  type: z.enum(timeOffTypes),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  days: z.coerce.number().positive("Must be greater than 0"),
  reason: z.string().optional(),
})
export type TimeOffInput = z.infer<typeof timeOffSchema>

// Attendance
export const attendanceSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  checkIn: z.string().min(1, "Check-in time is required"),
  checkOut: z.string().optional(),
})
export type AttendanceInput = z.infer<typeof attendanceSchema>

// Expense
export const expenseCategories = ["TRAVEL", "MEALS", "SUPPLIES", "OTHER"] as const
export const expenseSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(expenseCategories),
  amount: z.coerce.number().positive("Must be greater than 0"),
  date: z.string().optional(),
})
export type ExpenseInput = z.infer<typeof expenseSchema>

// Recruitment — job position
export const jobPositionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  departmentId: z.string().optional(),
  description: z.string().optional(),
})
export type JobPositionInput = z.infer<typeof jobPositionSchema>

// Recruitment — applicant
export const applicantStages = ["NEW", "INTERVIEW", "OFFER", "HIRED", "REFUSED"] as const
export const applicantPipeline = ["NEW", "INTERVIEW", "OFFER", "HIRED"] as const
export const applicantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  jobPositionId: z.string().optional(),
})
export type ApplicantInput = z.infer<typeof applicantSchema>

// Appraisal — rating is a select value ("none" | "1".."5") to keep the form simple.
export const appraisalSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  date: z.string().optional(),
  rating: z.string().optional(),
  feedback: z.string().optional(),
})
export type AppraisalInput = z.infer<typeof appraisalSchema>
