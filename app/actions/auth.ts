"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, verifyPassword } from "@/lib/password";
import { endSession, startSession } from "@/lib/session";
import { safeNextPath } from "@/lib/url";
import { createUser, findUserByEmail } from "@/lib/users";

export type AuthFormState = { error?: string };

const signupSchema = z.object({
  firstName: z.string().trim().min(2, "Adınızı girin"),
  lastName: z.string().trim().min(2, "Soyadınızı girin"),
  email: z.email("Geçerli bir e-posta adresi girin"),
  phone: z
    .string()
    .trim()
    .min(10, "Geçerli bir telefon numarası girin")
    .max(20, "Telefon numarası çok uzun"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı"),
});

const loginSchema = z.object({
  email: z.email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(1, "Şifrenizi girin"),
});

export async function signupAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formu kontrol edin" };
  }

  const { firstName, lastName, email, phone, password } = parsed.data;
  if (findUserByEmail(email)) {
    return { error: "Bu e-posta ile kayıtlı bir hesap zaten var" };
  }

  const userId = createUser({
    firstName,
    lastName,
    email: email.toLowerCase(),
    phone,
    passwordHash: hashPassword(password),
  });
  await startSession(userId);
  redirect(safeNextPath(formData.get("next")));
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formu kontrol edin" };
  }

  const user = findUserByEmail(parsed.data.email);
  if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
    return { error: "E-posta veya şifre hatalı" };
  }

  await startSession(user.id);
  redirect(safeNextPath(formData.get("next")));
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect("/");
}
