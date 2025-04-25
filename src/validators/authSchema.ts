// src/validators/authSchema.ts (in your FRONTEND project)
import { z } from "zod";

export const registerSchema = z
  .object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address"), // Slightly clearer message
    mobile: z.string().min(10, "Valid mobile number is required"), // Clearer message
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match", // Clearer message
    path: ["confirmPassword"], // Apply error to confirmPassword field
  });

// You might need these later for login/otp forms
export const loginSchema = z.object({
  mobile: z.string().min(10),
  password: z.string().min(6),
});

export const otpVerifySchema = z.object({
  mobile: z.string().min(10),
  otp: z.string().length(4, "OTP must be 4 digits"),
});

// Export the input type if needed elsewhere in the frontend
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
