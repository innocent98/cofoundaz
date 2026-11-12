import { test, expect } from "@playwright/test";

test.describe("Onboarding Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Inject a dummy auth token to simulate logged-in state
    await page.addInitScript(() => {
      window.localStorage.setItem("cf_token", "dummy-test-token");
    });
  });

  test("completes a full 6-step onboarding wizard", async ({ page }) => {
    // 1. Mock GET /onboarding/state (initial load, Step 1)
    await page.route("**/api/v1/onboarding/state", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ step: 1 }),
        });
      } else if (route.request().method() === "PATCH") {
        const patchData = JSON.parse(route.request().postData() || "{}");
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ...patchData }),
        });
      }
    });

    // Mock other endpoints
    await page.route("**/api/v1/onboarding/logo", async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ logo_url: "https://example.com/logo.png" }) });
    });
    
    await page.route("**/api/v1/onboarding/invites", async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    await page.route("**/api/v1/onboarding/complete", async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    // Navigate to Onboarding
    await page.goto("/onboarding");

    // STEP 1: Founder Profile
    await expect(page.getByRole("heading", { name: "Tell us about yourself" })).toBeVisible();
    await page.getByLabel("Full Name").fill("Test Founder");
    await page.getByRole("button", { name: "Continue" }).click();

    // STEP 2: Startup Core
    await expect(page.getByRole("heading", { name: "Your Startup Details" })).toBeVisible();
    await page.getByLabel("Startup Name").fill("Playwright Innovations");
    await page.getByRole("button", { name: "Continue" }).click();

    // STEP 3: Model & Stage
    await expect(page.getByRole("heading", { name: "Business Model & Stage" })).toBeVisible();
    await page.getByRole("button", { name: "B2B (Business to Business)" }).click();
    await page.getByRole("button", { name: "Idea / Concept" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // STEP 4: Goals
    await expect(page.getByRole("heading", { name: "Select Your Key Goals" })).toBeVisible();
    await page.getByText("Find co-founders or key hires").click();
    await page.getByRole("button", { name: "Continue" }).click();

    // STEP 5: Logo Upload
    await expect(page.getByRole("heading", { name: "Upload Startup Logo" })).toBeVisible();
    // Skip file upload interaction for test stability, just click next
    await page.getByRole("button", { name: "Continue" }).click();

    // STEP 6: Team Invites
    await expect(page.getByRole("heading", { name: "Invite Your Team" })).toBeVisible();
    await page.getByRole("button", { name: "Complete Setup" }).click();

    // Assert redirect to dashboard
    await page.waitForURL("**/dashboard");
    expect(page.url()).toContain("/dashboard");
  });
});