type Translate = (key: string) => string;

function rawMessage(error: unknown): string {
  if (typeof error === "string") {
    return error.trim();
  }
  if (error && typeof error === "object") {
    const o = error as { message?: string; code?: string };
    const m = typeof o.message === "string" ? o.message.trim() : "";
    if (m) {
      return m;
    }
    const c = typeof o.code === "string" ? o.code.trim() : "";
    return c;
  }
  return "";
}

/**
 * Maps Better Auth (and similar) sign-up API errors to next-intl keys under `signup.errors.*`.
 */
export function translateSignupAuthError(p: { error: unknown; t: Translate }): string {
  const raw = rawMessage(p.error);
  const lower = raw.toLowerCase();

  if (!lower) {
    return p.t("signup.errors.generic");
  }

  if (lower.includes("already exists") || lower.includes("another email") || lower.includes("user already")) {
    return p.t("signup.errors.userAlreadyExists");
  }

  if (lower.includes("invalid email") || lower.includes("email is invalid") || lower.includes("invalid e-mail")) {
    return p.t("signup.errors.invalidEmail");
  }

  if (
    lower.includes("password") &&
    (lower.includes("too short") || lower.includes("at least") || lower.includes("weak") || lower.includes("minimum"))
  ) {
    return p.t("signup.errors.passwordPolicy");
  }

  if (lower.includes("rate limit") || lower.includes("too many requests") || lower.includes("try again later")) {
    return p.t("signup.errors.rateLimited");
  }

  if (lower.includes("email") && (lower.includes("required") || lower.includes("missing"))) {
    return p.t("signup.errors.emailRequired");
  }

  return p.t("signup.errors.generic");
}
