export type EmailLocale = "en" | "fr";

export const messages: Record<EmailLocale, Record<string, string>> = {
  en: {
    "email.brand.tagline": "Book simply with a pro.",
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
    "booking.paid.preview": "Your booking is confirmed",
    "booking.paid.heading": "Booking confirmed",
    "booking.paid.greeting": "Hi {name},",
    "booking.paid.intro":
      "Your booking is confirmed and paid. Here is your booking summary.",
    "booking.paid.serviceLabel": "Service",
    "booking.paid.durationLabel": "Duration",
    "booking.paid.sessionsLabel": "Sessions",
    "booking.paid.amountLabel": "Amount paid",
    "booking.paid.coachLabel": "Professional",
    "booking.paid.addressLabel": "Address",
    "booking.paid.proHeading": "Your professional",
    "booking.paid.summaryHeading": "Booking summary",
    "booking.paid.whereHeading": "Where",
    "booking.paid.whenHeading": "When",
    "booking.paid.openMapLink": "Open in Google Maps",
    "booking.paid.sessionItemLabel": "Session {number}",
    "booking.paid.scheduleHeading": "Scheduled times",
    "booking.paid.scheduleFallback": "Your schedule will be confirmed by email shortly.",
    "booking.paid.footer":
      "If you did not make this payment, contact support immediately.",
    "booking.paymentRequired.preview": "Only your payment is missing",
    "booking.paymentRequired.heading": "Only your payment is missing",
    "booking.paymentRequired.greeting": "Hi {name},",
    "booking.paymentRequired.intro":
      "Your professional has confirmed your booking for {service}. Complete the payment now to finalize your reservation.",
    "booking.paymentRequired.cta": "Pay now",
    "booking.paymentRequired.fallback": "If the button does not work, copy and paste this link into your browser:",
    "booking.paymentRequired.footer":
      "If you did not make this request, you can ignore this email.",
  },
  fr: {
    "email.brand.tagline": "Bookez simplement avec un pro.",
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
    "booking.paid.preview": "Votre reservation est confirmee",
    "booking.paid.heading": "Reservation confirmee",
    "booking.paid.greeting": "Bonjour {name},",
    "booking.paid.intro":
      "Votre reservation est confirmee et payee. Voici le recapitulatif de votre reservation.",
    "booking.paid.serviceLabel": "Prestation",
    "booking.paid.durationLabel": "Duree",
    "booking.paid.sessionsLabel": "Seances",
    "booking.paid.amountLabel": "Montant paye",
    "booking.paid.coachLabel": "Professionnel",
    "booking.paid.addressLabel": "Adresse",
    "booking.paid.proHeading": "Votre professionnel",
    "booking.paid.summaryHeading": "Recapitulatif de reservation",
    "booking.paid.whereHeading": "Ou",
    "booking.paid.whenHeading": "Quand",
    "booking.paid.openMapLink": "Ouvrir dans Google Maps",
    "booking.paid.sessionItemLabel": "Seance {number}",
    "booking.paid.scheduleHeading": "Horaires planifies",
    "booking.paid.scheduleFallback": "Vos horaires seront confirms par e-mail sous peu.",
    "booking.paid.footer":
      "Si vous n'etes pas a l'origine de ce paiement, contactez le support.",
    "booking.paymentRequired.preview": "Il ne manque que votre paiement",
    "booking.paymentRequired.heading": "Il ne manque que votre paiement",
    "booking.paymentRequired.greeting": "Bonjour {name},",
    "booking.paymentRequired.intro":
      "Votre professionnel a confirme votre reservation pour {service}. Finalisez maintenant le paiement pour valider la reservation.",
    "booking.paymentRequired.cta": "Payer maintenant",
    "booking.paymentRequired.fallback":
      "Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :",
    "booking.paymentRequired.footer":
      "Si vous n'etes pas a l'origine de cette demande, vous pouvez ignorer cet e-mail.",
  },
};

