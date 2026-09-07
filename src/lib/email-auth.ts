import { z } from "zod";

export const EMAIL_CODE_LENGTH = 6;
export const EmailSignInSchema = z.object({ email: z.string().trim().toLowerCase().max(254).email() });
export const EmailVerifySchema = EmailSignInSchema.extend({ token: z.string().regex(/^\d{6}$/) });
export const OLD_LINK_NOTICE = "That sign-in link could not be used. Enter your email below to get a code you can use right here.";
