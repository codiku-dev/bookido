# `@repo/emails`

Shared transactional email templates for the monorepo.

This package contains React Email templates used by the app and API. It ships reusable components for auth-related flows, plus lightweight i18n helpers for English and French content.

## Exports

The package currently exports:

- `ConfirmSignup`
- `ResetPassword`
- `ConfirmSignupProps`
- `ResetPasswordProps`

Both templates accept the same shape:

```ts
type EmailProps = {
  name: string | null;
  url: string;
  locale: "en" | "fr";
};
```

## Available Templates

### `ConfirmSignup`

Sent after sign up to let a user verify their email address.

Props:

- `name`: Recipient display name. Falls back to `"there"` when null.
- `url`: Confirmation link.
- `locale`: Email language, either `en` or `fr`.

### `ResetPassword`

Sent when a user requests a password reset.

Props:

- `name`: Recipient display name. Falls back to `"there"` when null.
- `url`: Password reset link.
- `locale`: Email language, either `en` or `fr`.

## Development

From `packages/emails`:

```bash
bun run email:dev
```

Starts the React Email preview server so you can inspect templates locally.

```bash
bun run export
```

Exports static email output.

```bash
bun run build
```

Builds the package into `dist/` as ESM, CJS, and type declarations.

## Usage

Example usage from the API layer:

```tsx
import { ConfirmSignup } from "@repo/emails";
import { sendEmail } from "../../libs/email-libs";

await sendEmail({
  to: user.email,
  subject: "Confirm your email",
  component: (
    <ConfirmSignup
      name={user.name}
      url={confirmationUrl}
      locale="en"
    />
  ),
});
```

## Localization

Translations live in:

- `i18n/messages.ts`
- `i18n/t.ts`

Supported locales:

- `en`
- `fr`

If you add a new template or copy change, update both locale dictionaries.

## Notes

- Templates are built with `@react-email/components`.
- Rendering and SMTP delivery are handled outside this package by the API.
- This package is private and intended for internal workspace use.
