import { z } from "zod"

export const phoneSchema = z
  .string()
  .regex(/^03\d{2}-?\d{7}$/, "Phone must be in format 03XX-XXXXXXX or 03XXXXXXXXX")

export const cnicSchema = z
  .string()
  .regex(/^\d{5}-?\d{7}-?\d$/, "CNIC must be in format XXXXX-XXXXXXX-X")
  .optional()

export const signupSchema = z.object({
  phone: phoneSchema,
  name: z.string().min(2, "Name must be at least 2 characters"),
  roles: z.enum(["tenant", "landlord"]),
  cnic: cnicSchema,
  employmentProof: z.string().max(200).optional(),
  bankStatement: z.string().max(200).optional(),
})

export const loginSchema = z.object({
  phone: phoneSchema,
  otp: z.string().length(4, "OTP must be 4 digits"),
})

export const tenancySchema = z.object({
  landlordPhone: phoneSchema,
  monthlyRent: z.coerce.number().int().min(1000, "Rent must be at least Rs. 1,000"),
  deposit: z.coerce.number().int().min(0, "Deposit must be 0 or more"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  startDate: z.string().min(1, "Start date is required"),
})

export const paymentSchema = z.object({
  method: z.enum(["jazzcash", "easypaisa", "bank_transfer", "raast", "platform"]),
  referenceNumber: z.string().optional(),
  amount: z.coerce.number().int().min(1, "Amount must be greater than 0"),
  paidDate: z.string().min(1, "Payment date is required"),
  notes: z.string().max(500, "Notes must be 500 characters or less").optional(),
})

export const connectionSchema = z.object({
  landlordPhone: phoneSchema,
})

export const propertySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  rentAmount: z.coerce.number().int().min(1000, "Rent must be at least Rs. 1,000"),
  bedrooms: z.coerce.number().int().min(1).max(20),
  bathrooms: z.coerce.number().int().min(1).max(10),
  area: z.coerce.number().int().min(1).optional(),
})

export const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(2000),
  receiverId: z.string().min(1),
})

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(500).optional(),
  cnic: cnicSchema,
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type TenancyInput = z.infer<typeof tenancySchema>
export type PaymentInput = z.infer<typeof paymentSchema>
export type ConnectionInput = z.infer<typeof connectionSchema>
export type PropertyInput = z.infer<typeof propertySchema>
export type MessageInput = z.infer<typeof messageSchema>
export type ProfileInput = z.infer<typeof profileSchema>
