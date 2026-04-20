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

/** Maps Better Auth sign-in errors to `login.errors.*` */
export function translateSigninAuthError(p: { error: unknown; t: Translate }): string {
  const raw = rawMessage(p.error);
  const lower = raw.toLowerCase();

  if (!lower) {
    return p.t("login.errors.generic");
  }

  if (
    lower.includes("invalid") &&
    (lower.includes("password") || lower.includes("credential") || lower.includes("email") || lower.includes("login"))
  ) {
    return p.t("login.errors.invalidCredentials");
  }

  if (lower.includes("email") && (lower.includes("verify") || lower.includes("verification") || lower.includes("confirm"))) {
    return p.t("login.errors.emailNotVerified");
  }

  if (lower.includes("rate limit") || lower.includes("too many")) {
    return p.t("login.errors.rateLimited");
  }

  if (lower.includes("banned") || lower.includes("disabled")) {
    return p.t("login.errors.accountBlocked");
  }

  return p.t("login.errors.generic");
}
