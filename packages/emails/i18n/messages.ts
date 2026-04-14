export type EmailLocale = "en" | "fr";

export const messages: Record<EmailLocale, Record<string, string>> = {
  en: {
    "auth.signup.preview": "Confirm your email to activate your account",
    "auth.signup.heading": "Confirm your email ✨",
    "auth.signup.body.greeting": "Hi {name},",
    "auth.signup.body.text":
      "Tap the button below to verify your email address and activate your account.",
    "auth.signup.cta": "Verify email",
    "auth.signup.copy.label":
      "Or copy and paste this link into your browser:",
    "auth.signup.footer":
      "If you didn't request this email, you can safely ignore it.",
    "auth.reset.preview": "Reset your password",
    "auth.reset.heading": "Reset your password",
    "auth.reset.body.greeting": "Hi {name},",
    "auth.reset.body.text":
      "We received a request to reset your password. Use the button below to choose a new one.",
    "auth.reset.cta": "Reset password",
    "auth.reset.copy.label":
      "Or copy and paste this link into your browser:",
    "auth.reset.footer":
      "If you did not request a password reset, you can ignore this email.",
  },
  fr: {
    "auth.signup.preview":
      "Confirme ton e-mail pour activer ton compte",
    "auth.signup.heading": "Confirme ton e-mail ✨",
    "auth.signup.body.greeting": "Salut {name},",
    "auth.signup.body.text":
      "Clique sur le bouton ci-dessous pour vérifier ton adresse e-mail et activer ton compte.",
    "auth.signup.cta": "Valider mon e-mail",
    "auth.signup.copy.label":
      "Ou copie-colle ce lien dans ton navigateur :",
    "auth.signup.footer":
      "Si tu n’as pas demandé cet e-mail, tu peux l’ignorer en toute sécurité.",
    "auth.reset.preview": "Réinitialise ton mot de passe",
    "auth.reset.heading": "Réinitialise ton mot de passe",
    "auth.reset.body.greeting": "Salut {name},",
    "auth.reset.body.text":
      "Nous avons reçu une demande de réinitialisation. Utilise le bouton ci-dessous pour choisir un nouveau mot de passe.",
    "auth.reset.cta": "Réinitialiser le mot de passe",
    "auth.reset.copy.label":
      "Ou copie-colle ce lien dans ton navigateur :",
    "auth.reset.footer":
      "Si tu n’as pas demandé cette réinitialisation, ignore simplement cet e-mail.",
  },
};

