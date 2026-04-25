import { expect, test } from "@playwright/test";

test.describe("Profile Stripe Connect", () => {
  test("shows activate payments action when onboarding is incomplete", async ({ page }) => {
    await page.route("**/api/auth/get-session**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "usr_test_1",
            email: "coach@example.com",
            name: "Coach Test",
            bio: "Bio",
          },
        }),
      });
    });

    await page.route("**/trpc/profile.getPublicBookingPresence**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            result: {
              data: {
                publicBookingSlug: "coach-test",
                image: null,
                defaultAddress: "10 rue de Paris",
                publicBookingMinNoticeHours: 24,
              },
            },
          },
        ]),
      });
    });

    await page.route("**/trpc/profile.getStripeConnectStatus**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            result: {
              data: {
                stripeAccountId: null,
                stripeOnboardingComplete: false,
                stripeChargesEnabled: false,
                stripePayoutsEnabled: false,
              },
            },
          },
        ]),
      });
    });

    await page.route("**/trpc/profile.getPlatformBillingHistory**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            result: {
              data: {
                billingCustomerLinked: false,
                rows: [],
              },
            },
          },
        ]),
      });
    });

    await page.goto("/admin/profile");

    await expect(page.getByRole("button", { name: "Activate payments" })).toBeVisible();
  });
});
