"use server";

import { z } from "zod";
import { hash } from "bcryptjs";
import { signUpSchema } from "../validations";
import { db } from "@/db/drizzle";
import { users, userTypeEnum } from "@/db/schema";
import { eq } from "drizzle-orm";
import { UserType } from "@/constants/userTypes";
import { signIn } from "@/auth";

export type AuthCredentials = z.infer<typeof signUpSchema>;

export const signInWithCredentials = async (
  params: Pick<AuthCredentials, "email" | "password">
) => {
  const { email, password } = params;

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.log(error, "Signin error");
    return { success: false, error: "Signin error" };
  }
};

export async function signUp(params: AuthCredentials) {
  try {
    // Validate the input data
    const validatedData = signUpSchema.parse(params);

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email));

    if (existingUser.length > 0) {
      return {
        success: false,
        error: "Пользователь с таким email уже существует",
      };
    }

    // Hash the password
    const hashedPassword = await hash(validatedData.password, 10);

    // Map frontend user types to database user types
    let dbUserType: (typeof userTypeEnum.enumValues)[number] = "PATIENT";
    if (validatedData.userType === UserType.NURSE) {
      dbUserType = "NURSE";
    } else if (
      validatedData.userType === UserType.DISTRICT_DOCTOR ||
      validatedData.userType === UserType.SPECIALIST_DOCTOR
    ) {
      dbUserType = "DOCTOR";
    }

    // Create the user
    await db
      .insert(users)
      .values({
        fullName: validatedData.fullName,
        email: validatedData.email,
        password: hashedPassword,
        city: validatedData.city,
        organization: validatedData.organization,
        userType: dbUserType,
        department: validatedData.department,
        subdivision: validatedData.subdivision,
        district: validatedData.district,
        specialization: validatedData.specialization,
        avatar: validatedData.avatar,
        iin: validatedData.iin,
        telephone: validatedData.telephone,
      })
      .returning();

    return {
      success: true,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation error",
      };
    }

    return {
      success: false,
      error: "Something went wrong",
    };
  }
}
