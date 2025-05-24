"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  DefaultValues,
  FieldValues,
  Path,
  SubmitHandler,
  useForm,
  UseFormReturn,
} from "react-hook-form";
import React from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { FIELD_NAMES, FIELD_TYPES } from "@/constants";
import { UserType, userTypeLabels } from "@/constants/userTypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props<T> extends FieldValues {
  schema: z.ZodType<T>;
  defaultValues: T & { userType?: UserType };
  onSubmit: (data: T) => Promise<{ success: boolean; error?: string }>;
  type: "SIGN_IN" | "SIGN_UP";
}

const AuthForm = <T extends FieldValues>({
  type,
  schema,
  defaultValues,
  onSubmit,
}: Props<T>) => {
  const router = useRouter();
  const isSignIn = type === "SIGN_IN";

  const [selectedUserType, setSelectedUserType] =
    React.useState<UserType | null>(defaultValues.userType || null);

  const form: UseFormReturn<T> = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<T>,
  });

  const handleSubmit: SubmitHandler<T> = async (data) => {
    const result = await onSubmit(data);

    if (result.success) {
      toast.success("Success", {
        description: isSignIn
          ? "You have successfully signed in"
          : "You have successfully signed up",
      });
      router.push("/dashboard");
    } else if (result.error) {
      toast.error(`Error ${isSignIn ? "signing in" : "signing up"}`);
    }
  };

  const shouldShowField = (fieldName: string): boolean => {
    if (!isSignIn) {
      if (selectedUserType === UserType.DISTRICT_DOCTOR) {
        return !["specialization"].includes(fieldName);
      }
      if (selectedUserType === UserType.SPECIALIST_DOCTOR) {
        return !["district"].includes(fieldName);
      }
      if (
        [UserType.NURSE, UserType.PATIENT].includes(
          selectedUserType as UserType
        )
      ) {
        return ![
          "department",
          "subdivision",
          "district",
          "specialization",
        ].includes(fieldName);
      }
    }
    return true;
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">
        {isSignIn ? "Sapa Telemed" : "Создайте учетную запись"}
      </h1>
      <br />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-6 w-full"
        >
          {!isSignIn && (
            <FormField
              control={form.control}
              name={"userType" as Path<T>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип пользователя</FormLabel>
                  <Select
                    onValueChange={(value: string) => {
                      field.onChange(value);
                      setSelectedUserType(value as UserType);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип пользователя">
                          {field.value
                            ? userTypeLabels[field.value as UserType]
                            : "Выберите тип пользователя"}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(userTypeLabels).map(([type, label]) => (
                        <SelectItem key={type} value={type}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {Object.keys(defaultValues)
            .filter((field) => field !== "userType")
            .map((field) =>
              shouldShowField(field) ? (
                <FormField
                  key={field}
                  control={form.control}
                  name={field as Path<T>}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="capitalize">
                        {FIELD_NAMES[field.name as keyof typeof FIELD_NAMES]}
                      </FormLabel>
                      <FormControl>
                        <Input
                          required
                          type={
                            FIELD_TYPES[field.name as keyof typeof FIELD_TYPES]
                          }
                          {...field}
                          className="form-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null
            )}

          <Button type="submit" className="form-btn">
            {isSignIn ? "Войти" : "Зарегестрироваться"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-base font-medium">
        <br />
        {isSignIn ? "Впервые в Sapa Telemed? " : "Уже есть учетная запись? "}
        <Link
          href={isSignIn ? "/sign-up" : "/sign-in"}
          className="font-bold text-primary"
        >
          {isSignIn ? "Создать аккаунт" : "Войти"}
        </Link>
      </p>
    </div>
  );
};

export default AuthForm;
