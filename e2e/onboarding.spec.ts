import { test, expect } from "@playwright/test";

// The wizard follows PRD 01.6 (D-AUTH-5/7): 1 you, 2 startup + logo, 3 industry/model/stage,
// 4 goals, 5 invite team, 6 Kickoff Assessment (Start assessment / Do it later).
test.describe("Onboarding Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("cf_token", "dummy-test-token");
    });
  });

  test("completes the 6-step onboarding wizard and lands on the dashboard on Do it later", async ({ page }) => {
    const raw = (step: number, completed = false) => ({
      data: { step, completed, pending_invite: false, founder_profile: {}, startup: {}, goals: [], invites: [] },
      meta: null,
    });
    let completed = false;

    await page.route("**/api/v1/onboarding/state", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(raw(1, completed)) });
      } else {
        const patch = JSON.parse(route.request().postData() || "{}");
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(raw(patch.step ?? 1)) });
      }
    });
    await page.route("**/api/v1/onboarding/logo", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { logo_url: "https://example.com/logo.png" } }) })
    );
    await page.route("**/api/v1/onboarding/complete", async (route) => {
      completed = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { completed: true } }) });
    });

    await page.goto("/onboarding");

    await expect(page.getByRole("heading", { name: "First, about you" })).toBeVisible();
    await page.getByLabel("Full Name").fill("Test Founder");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByRole("heading", { name: "Now, your startup" })).toBeVisible();
    await page.getByLabel("Startup Name").fill("Playwright Innovations");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByRole("heading", { name: "What are you building?" })).toBeVisible();
    await page.getByLabel("Primary Industry").selectOption("Fintech");
    await page.getByRole("button", { name: "B2B (Business to Business)" }).click();
    await page.getByRole("button", { name: /^Idea/ }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByRole("heading", { name: "What do you want to get done first?" })).toBeVisible();
    await page.getByRole("button", { name: "Validate my idea" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByRole("heading", { name: "Who is building this with you?" })).toBeVisible();
    await page.getByRole("button", { name: /Skip/ }).click();

    await expect(page.getByRole("heading", { name: "One last thing: your kickoff assessment" })).toBeVisible();
    await page.getByRole("button", { name: "Do it later" }).click();

    await page.waitForURL("**/dashboard");
    expect(page.url()).toContain("/dashboard");
  });
});
