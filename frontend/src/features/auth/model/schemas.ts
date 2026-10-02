import { errorMessages } from "@shared/lib/errors";
import { z } from "@shared/lib/zod";

export const MIN_PASSWORD_LENGTH = 8;

const email = z.email({ error: errorMessages.email });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: errorMessages.required }),
});

/** Сервер: то, что уходит в Medusa при регистрации. */
export const registerSchema = z.object({
  email,
  password: z.string().min(MIN_PASSWORD_LENGTH, { error: errorMessages.passwordTooShort(MIN_PASSWORD_LENGTH) }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
});

/** Клиент: форма регистрации — то же + подтверждение пароля. */
export const signupFormSchema = registerSchema
  .pick({ email: true, password: true })
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    error: errorMessages.passwordsMismatch,
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type SignupFormInput = z.infer<typeof signupFormSchema>;
