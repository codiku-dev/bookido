import { expect, test } from "@playwright/test";

const storefrontPayload = {
  coach: {
    name: "Coach Demo",
    bio: "Strength and mobility coach.",
    imageUrl: null,
  },
  weekHours: {
    Monday: { enabled: true, startTime: "09:00", endTime: "18:00" },
    Tuesday: { enabled: true, startTime: "09:00", endTime: "18:00" },
    Wednesday: { enabled: true, startTime: "09:00", endTime: "18:00" },
    Thursday: { enabled: true, startTime: "09:00", endTime: "18:00" },
    Friday: { enabled: true, startTime: "09:00", endTime: "18:00" },
    Saturday: { enabled: false, startTime: "09:00", endTime: "18:00" },
    Sunday: { enabled: false, startTime: "09:00", endTime: "18:00" },
  },
  closedSlotKeys: [],
  minBookingNoticeHours: 0,
  services: [
    {
      id: "svc-1",
      name: "Initial assessment",
      description: "A complete first session with goals and evaluation.",
      imageUrl: null,
      address: "12 rue de la Paix, 75002 Paris",
      durationMinutes: 60,
      price: 80,
      isFree: false,
      requiresValidation: false,
    },
  ],
  bookingSegments: [],
};

test.describe("Public booking service details", () => {
  test("shows service details step before calendar", async ({ page }) => {
    await page.route("**/trpc/publicBooking.getStorefront**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ result: { data: storefrontPayload } }]),
      });
    });

    await page.goto("/demo-coach/booking?service=svc-1");

    await expect(page.getByRole("heading", { name: "Service details" })).toBeVisible();

    await page.getByRole("button", { name: "Choose an appointment time" }).click();
    await expect(page.getByRole("heading", { name: "Choose a time" })).toBeVisible();
  });

  test("hides slots that violate minimum booking notice", async ({ page }) => {
    await page.addInitScript(() => {
      const fixedNow = new Date("2026-04-20T08:00:00.000Z").valueOf();
      const RealDate = Date;
      class MockDate extends RealDate {
        constructor(...args: [] | [string | number | Date]) {
          if (args.length === 0) {
            super(fixedNow);
            return;
          }
          super(...args);
        }
        static now() {
          return fixedNow;
        }
      }
      Object.defineProperty(window, "Date", {
        configurable: true,
        writable: true,
        value: MockDate,
      });
    });

    await page.route("**/trpc/publicBooking.getStorefront**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            result: {
              data: {
                ...storefrontPayload,
                minBookingNoticeHours: 3,
              },
            },
          },
        ]),
      });
    });

    await page.goto("/demo-coach/booking?service=svc-1");
    await page.getByRole("button", { name: "Choose an appointment time" }).click();

    await expect(page.getByRole("button", { name: "09:00" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Choose a time" })).toBeVisible();
  });
});
