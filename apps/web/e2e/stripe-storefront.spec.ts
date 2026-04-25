import { expect, test } from "@playwright/test";

test.describe("Stripe storefront", () => {
  test("loads connected account products", async ({ page }) => {
    await page.route("**/stripe/connect/acct_test_store/products", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          products: [
            {
              id: "prod_test_1",
              name: "Consulting Session",
              description: "60 minutes",
              unitAmount: 5000,
              currency: "eur",
            },
          ],
        }),
      });
    });

    await page.goto("/store/acct_test_store");

    await page.getByRole("button", { name: "Load products" }).click();

    await expect(page.getByText("Consulting Session")).toBeVisible();
    await expect(page.getByText("50.00 EUR")).toBeVisible();
  });
});
