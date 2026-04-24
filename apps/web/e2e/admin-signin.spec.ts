import { expect, test } from "@playwright/test";

const adminEmail = process.env["E2E_ADMIN_EMAIL"] ?? "robin.lebhar@gmail.com";
const adminPassword = process.env["E2E_ADMIN_PASSWORD"] ?? "Password123!";

test.describe("Admin sign-in", () => {
  test("email/password sign-in reaches admin area", async ({ page }) => {
    const signInPath = "/admin/signin";

    await page.goto(signInPath);

    const heading = page.getByRole("heading", { name: "Bookido Admin" });
    await expect(heading).toBeVisible();

    const emailField = page.locator('input[autocomplete="email"]');
    const passwordField = page.locator('input[autocomplete="current-password"]');
    const submitButton = page.getByRole("button", { name: "Sign in to admin" });

    await emailField.fill(adminEmail);
    await passwordField.fill(adminPassword);
    await submitButton.click();

    await expect(page).not.toHaveURL(/\/admin\/signin/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/admin(\/|$)/);
  });
});
