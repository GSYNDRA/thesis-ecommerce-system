import z from 'zod'
import { UserMessage } from '../constants/messages.constant.js'

export const registerSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: UserMessage.EMAIL_IS_REQUIRED
      })
      .email(UserMessage.EMAIL_IS_INVALID)
      .toLowerCase()
      .trim(),

    password: z
      .string({
        required_error: UserMessage.PASSWORD_IS_REQUIRED
      })
      .min(6, UserMessage.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50)
      .max(50, UserMessage.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50),

    firstName: z
      .string({
        required_error: UserMessage.FIRST_NAME_IS_REQUIRED
      })
      .min(2, UserMessage.FIRST_NAME_LENGTH_MUST_BE_FROM_6_TO_50)
      .max(50, UserMessage.FIRST_NAME_LENGTH_MUST_BE_FROM_6_TO_50)
      .trim(),

    lastName: z
      .string({
        required_error: UserMessage.LAST_NAME_IS_REQUIRED
      })
      .min(2, UserMessage.LAST_NAME_LENGTH_MUST_BE_FROM_6_TO_50)
      .max(50, UserMessage.LAST_NAME_LENGTH_MUST_BE_FROM_6_TO_50)
      .trim(),

    // Optional fields
    phoneNumber: z
      .string()
      .regex(/^[0-9+\-\s()]+$/, UserMessage.PHONE_NUMBER_INVALID)
      .optional(),

    dateOfBirth: z
      .string()
      .transform((str) => new Date(str))
      .refine(
        (date) => !isNaN(date.getTime()) && date < new Date(),
        UserMessage.DATE_OF_BIRTH_INVALID
      )
      .optional(),

    gender: z
      .enum(['male', 'female', 'other'])
      .optional()
      .default('other')
  })
})

export const verifyEmailSchema = z.object({
  query: z.object({
    token: z
      .string({
        required_error: "Verification token is required"
      })
      .trim()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: UserMessage.EMAIL_IS_REQUIRED })
      .email(UserMessage.EMAIL_IS_INVALID)
      .toLowerCase()
      .trim(),
    password: z
      .string({ required_error: UserMessage.PASSWORD_IS_REQUIRED })
      .min(6, UserMessage.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50)
      .max(50, UserMessage.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string({ required_error: "Refresh token is required" })
      .trim()
      .refine((val) => val.split(".").length === 3, "Invalid token format"),
  }),
});


export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z
      .string({ required_error: "Refresh token is required" })
      .trim()
      .refine((val) => val.split(".").length === 3, "Invalid token format"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: UserMessage.EMAIL_IS_REQUIRED })
      .email(UserMessage.EMAIL_IS_INVALID)
      .toLowerCase()
      .trim(),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: UserMessage.EMAIL_IS_REQUIRED })
      .email(UserMessage.EMAIL_IS_INVALID)
      .toLowerCase()
      .trim(),
    otp: z
      .string({ required_error: "OTP is required" })
      .trim()
      .length(6, "OTP must be 6 digits")
      .regex(/^\d{6}$/, "OTP must be numeric"),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    new_password: z
      .string({ required_error: "New password is required" })
      .min(8, "Password must be at least 8 characters")
      .max(64, "Password too long"),
  }),
});

export const resendOtpSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: UserMessage.EMAIL_IS_REQUIRED })
      .email(UserMessage.EMAIL_IS_INVALID)
      .toLowerCase()
      .trim(),
  }),
});