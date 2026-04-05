import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";

interface FieldConfig {
  key: "fullName" | "username" | "emailAddress" | "password";
  label: string;
  type?: "text" | "email" | "password";
  placeholder: string;
  required?: boolean;
  autoComplete?: string;
}

interface AuthFormPageProps {
  mode: "sign-in" | "sign-up";
  titleCode: string;
  fields: FieldConfig[];
  submitIdleLabel: string;
  submitLoadingLabel: string;
  successMessage: string;
  failureMessage: string;
}

type FormValues = {
  fullName: string;
  username: string;
  emailAddress: string;
  password: string;
};

const INITIAL_VALUES: FormValues = {
  fullName: "",
  username: "",
  emailAddress: "",
  password: "",
};

export function AuthFormPage({
  mode,
  titleCode,
  fields,
  submitIdleLabel,
  submitLoadingLabel,
  successMessage,
  failureMessage,
}: AuthFormPageProps) {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitAuth = mode === "sign-in" ? signIn : signUp;

  const handleChange = (key: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await submitAuth({
        fullName: values.fullName,
        username: values.username,
        emailAddress: values.emailAddress,
        password: values.password,
      });
      toast.success(successMessage);
      router.replace("/");
    } catch (error) {
      console.error(`Failed to ${mode}`, error);
      toast.error(failureMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-background-glow" />

      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-title-group">
            <h1 className="auth-brand-title">DataLens</h1>
            <p className="auth-code-label">{titleCode}</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {fields.map((field) => (
              <label key={field.key} className="auth-field-wrap">
                <span className="auth-field-label">{field.label}</span>
                <input
                  type={field.type ?? "text"}
                  required={field.required}
                  value={values[field.key]}
                  onChange={(event) => handleChange(field.key, event.target.value)}
                  className="auth-field-input"
                  placeholder={field.placeholder}
                  autoComplete={field.autoComplete}
                />
              </label>
            ))}

            <button type="submit" disabled={isSubmitting} className="auth-submit-button">
              {isSubmitting ? submitLoadingLabel : submitIdleLabel}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
