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
    "booking.paid.whereHeading": "Address",
    "booking.paid.whenHeading": "When",
    "booking.paid.openMapLink": "Open in Google Maps",
    "booking.paid.sessionItemLabel": "Session {number}",
    "booking.paid.scheduleHeading": "Scheduled times",
    "booking.paid.receiptHeading": "Payment receipt",
    "booking.paid.scheduleFallback": "Your schedule will be confirmed by email shortly.",
    "booking.paid.footer":
      "If you did not make this payment, contact support immediately.",
    "booking.paid.cancelHint":
      "Something came up? To cancel or reschedule, contact {coachName} directly — reply to this email if your mail app allows it.",
    "booking.paid.cancelWithTokenTitle": "Cancel this booking",
    "booking.paid.cancelWithTokenUnpaidHint": "You can cancel your booking below.",
    "booking.paid.cancelWithTokenRefundAlways":
      "Online refund: according to your professional’s policy.",
    "booking.paid.cancelWithTokenRefundHours":
      "Online refund: only if you cancel at least {hours} hours in advance.",
    "booking.paid.cancelWithTokenCta": "Cancel my booking",
    "booking.paymentRequired.preview": "Only your payment is missing",
    "booking.paymentRequired.heading": "Only your payment is missing",
    "booking.paymentRequired.greeting": "Hi {name},",
    "booking.paymentRequired.intro":
      "Your professional has confirmed your booking for {service}. Complete the payment now to finalize your reservation.",
    "booking.paymentRequired.cta": "Pay now",
    "booking.paymentRequired.fallback": "If the button does not work, copy and paste this link into your browser:",
    "booking.paymentRequired.footer":
      "If you did not make this request, you can ignore this email.",
    "booking.proNew.preview": "New client booking",
    "booking.proNew.heading": "New booking",
    "booking.proNew.lead": "A client just booked with you.",
    "booking.proNew.greeting": "Hi {coachName},",
    "booking.proNew.clientHeading": "Client",
    "booking.proNew.clientEmailLabel": "Email",
    "booking.proNew.clientPhoneLabel": "Phone",
    "booking.proNew.serviceHeading": "Service",
    "booking.proNew.durationLabel": "Duration",
    "booking.proNew.statusLabel": "Status",
    "booking.proNew.scheduleHeading": "Scheduled times",
    "booking.proNew.paymentHeading": "Payment",
    "booking.proNew.paymentFree": "This booking is free.",
    "booking.proNew.paymentPaid": "Paid: {amount}",
    "booking.proNew.paymentMethod": "Method: {method}",
    "booking.proNew.paymentPending":
      "Payment not collected yet. Listed price: {price}. The client will pay according to your workflow.",
    "booking.proNew.cta": "Open in Bookido",
    "booking.proNew.footer":
      "You can turn these emails off anytime in Profile → Preferences.",
    "booking.reminder.preview": "Reminder — your appointment is coming up",
    "booking.reminder.heading": "Appointment reminder",
    "booking.reminder.greeting": "Hi {name},",
    "booking.reminder.intro": "This is a friendly reminder about your upcoming appointment.",
    "booking.reminder.proHeading": "Your professional",
    "booking.reminder.whenHeading": "When",
    "booking.reminder.durationLabel": "Duration: {minutes} minutes",
    "booking.reminder.whereHeading": "Address",
    "booking.reminder.openMapLink": "Open in Google Maps",
    "booking.reminder.footer":
      "Questions or need to reschedule? Contact {coachName} directly — you can reply to this email if your mail app allows it.",
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
      "Ou copiez-collez ce lien dans votre navigateur :",
    "auth.signup.footer":
      "Si tu n’as pas demandé cet e-mail, tu peux l’ignorer en toute sécurité.",
    "auth.reset.preview": "Réinitialise ton mot de passe",
    "auth.reset.heading": "Réinitialise ton mot de passe",
    "auth.reset.body.greeting": "Salut {name},",
    "auth.reset.body.text":
      "Nous avons reçu une demande de réinitialisation. Utilise le bouton ci-dessous pour choisir un nouveau mot de passe.",
    "auth.reset.cta": "Réinitialiser le mot de passe",
    "auth.reset.copy.label":
      "Ou copiez-collez ce lien dans votre navigateur :",
    "auth.reset.footer":
      "Si tu n’as pas demandé cette réinitialisation, ignore simplement cet e-mail.",
    "booking.paid.preview": "Votre réservation est confirmée",
    "booking.paid.heading": "Réservation confirmée",
    "booking.paid.greeting": "Bonjour {name},",
    "booking.paid.intro":
      "Votre réservation est confirmée et payée. Voici le récapitulatif de votre réservation.",
    "booking.paid.serviceLabel": "Prestation",
    "booking.paid.durationLabel": "Durée",
    "booking.paid.sessionsLabel": "Séances",
    "booking.paid.amountLabel": "Montant payé",
    "booking.paid.coachLabel": "Professionnel",
    "booking.paid.addressLabel": "Adresse",
    "booking.paid.proHeading": "Votre professionnel",
    "booking.paid.summaryHeading": "Récapitulatif de réservation",
    "booking.paid.whereHeading": "Adresse",
    "booking.paid.whenHeading": "Quand",
    "booking.paid.openMapLink": "Ouvrir dans Google Maps",
    "booking.paid.sessionItemLabel": "Séance {number}",
    "booking.paid.scheduleHeading": "Horaires planifiés",
    "booking.paid.receiptHeading": "Reçu de paiement",
    "booking.paid.scheduleFallback": "Vos horaires seront confirmés par e-mail sous peu.",
    "booking.paid.footer":
      "Si vous n'êtes pas à l'origine de ce paiement, contactez le support.",
    "booking.paid.cancelHint":
      "Un imprévu ? Pour annuler ou reporter votre rendez-vous, contactez directement {coachName} — répondez à cet e-mail si votre messagerie le permet.",
    "booking.paid.cancelWithTokenTitle": "Annuler cette réservation",
    "booking.paid.cancelWithTokenUnpaidHint": "Vous pouvez annuler votre réservation ci-dessous.",
    "booking.paid.cancelWithTokenRefundAlways":
      "Remboursement (paiement en ligne) : selon les conditions de votre professionnel.",
    "booking.paid.cancelWithTokenRefundHours":
      "Remboursement (paiement en ligne) : uniquement si vous annulez au moins {hours} h à l’avance.",
    "booking.paid.cancelWithTokenCta": "Annuler ma réservation",
    "booking.paymentRequired.preview": "Il ne manque que votre paiement",
    "booking.paymentRequired.heading": "Il ne manque que votre paiement",
    "booking.paymentRequired.greeting": "Bonjour {name},",
    "booking.paymentRequired.intro":
      "Votre professionnel a confirmé votre réservation pour {service}. Finalisez maintenant le paiement pour valider la réservation.",
    "booking.paymentRequired.cta": "Payer maintenant",
    "booking.paymentRequired.fallback":
      "Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :",
    "booking.paymentRequired.footer":
      "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.",
    "booking.proNew.preview": "Nouvelle réservation client",
    "booking.proNew.heading": "Nouvelle réservation",
    "booking.proNew.lead": "Un client vient de réserver avec toi.",
    "booking.proNew.greeting": "Bonjour {coachName},",
    "booking.proNew.clientHeading": "Client",
    "booking.proNew.clientEmailLabel": "E-mail",
    "booking.proNew.clientPhoneLabel": "Téléphone",
    "booking.proNew.serviceHeading": "Prestation",
    "booking.proNew.durationLabel": "Durée",
    "booking.proNew.statusLabel": "Statut",
    "booking.proNew.scheduleHeading": "Horaires",
    "booking.proNew.paymentHeading": "Paiement",
    "booking.proNew.paymentFree": "Cette réservation est gratuite.",
    "booking.proNew.paymentPaid": "Payé : {amount}",
    "booking.proNew.paymentMethod": "Moyen : {method}",
    "booking.proNew.paymentPending":
      "Paiement non encaissé pour l'instant. Tarif affiché : {price}. Le client paiera selon ton process.",
    "booking.proNew.cta": "Ouvrir dans Bookido",
    "booking.proNew.footer":
      "Tu peux désactiver ces e-mails dans Profil → Préférences.",
    "booking.reminder.preview": "Rappel — votre rendez-vous approche",
    "booking.reminder.heading": "Rappel de rendez-vous",
    "booking.reminder.greeting": "Bonjour {name},",
    "booking.reminder.intro": "Petit rappel concernant votre prochain rendez-vous.",
    "booking.reminder.proHeading": "Votre professionnel",
    "booking.reminder.whenHeading": "Quand",
    "booking.reminder.durationLabel": "Durée : {minutes} minutes",
    "booking.reminder.whereHeading": "Adresse",
    "booking.reminder.openMapLink": "Ouvrir dans Google Maps",
    "booking.reminder.footer":
      "Une question ou besoin de reporter ? Contactez {coachName} directement — vous pouvez répondre à cet e-mail si votre messagerie le permet.",
  },
};

