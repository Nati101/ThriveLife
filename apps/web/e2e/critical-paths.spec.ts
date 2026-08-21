import { expect, test } from "@playwright/test";

test("privacy policy and terms are product surfaces with counsel pending", async ({
  page,
}) => {
  await page.goto("/privacy-policy");
  await expect(page.getByRole("heading", { name: "Privacy policy" })).toBeVisible();
  await expect(page.getByText("Pending counsel", { exact: false }).first()).toBeVisible();
  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "Terms of use" })).toBeVisible();
  await expect(page.getByText("Pending counsel", { exact: false }).first()).toBeVisible();
});

test("admin content API returns 403 for a member role", async ({ request }) => {
  const res = await request.get("/api/content", {
    headers: { cookie: "tl_dev_role=user" },
  });
  expect(res.status()).toBe(403);
  const body = (await res.json()) as { error?: string };
  expect(body.error).toBe("forbidden");
});

test("auth page shows email sign-in and keeps demo under More options", async ({
  page,
}) => {
  await page.goto("/auth");
  await expect(page.getByRole("heading", { name: /Welcome back|Create your account/i })).toBeVisible();
  await expect(page.getByLabel(/^Email$/i)).toBeVisible();
  await expect(page.getByLabel(/^Password$/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /^Sign in$/i })).toBeVisible();
  await page.getByText("More options").click();
  await expect(page.getByRole("button", { name: /Continue with demo/i })).toBeVisible();
});

test("content invite unlocks admin from More options", async ({ page }) => {
  await page.goto("/auth?access=content");
  await expect(page.getByText("Content contributor")).toBeVisible();
  await page.getByPlaceholder("Paste invite code").fill("joel-thrivelife-content");
  await page.getByRole("button", { name: /Unlock content tools/i }).click();
  await page.waitForURL(/\/admin/);
  await expect(page.getByText("Admin hub").first()).toBeVisible();
});

test("demo member can continue from More options", async ({ page }) => {
  await page.goto("/auth");
  await page.getByText("More options").click();
  await expect(page.getByRole("button", { name: /Load seeded demo profile/i })).toBeVisible();
  await page.getByRole("button", { name: /Continue with demo/i }).click();
  await page.waitForURL(/\/(dashboard|onboarding)/);
});

test("start Full Assessment, complete via API, see dashboard rings", async ({
  page,
  request,
}) => {
  await page.goto("/auth");
  await page.getByText("More options").click();
  await page.getByRole("button", { name: /Continue with demo/i }).click();
  await page.waitForURL(/\/(dashboard|onboarding)/);

  await page.goto("/assessments/full-assessment");
  await expect(page.getByText("Full Assessment").first()).toBeVisible();

  const start = page.getByRole("button", { name: /start|resume/i }).first();
  const locked = page.getByText("Full Assessment not available yet");
  await expect(start.or(locked)).toBeVisible();
  if (await locked.isVisible()) {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: /Five things that matter today/i }),
    ).toBeVisible();
    await expect(page.getByText("Most depleted")).toBeVisible();
    return;
  }

  await expect(start).toBeVisible();
  await start.click();
  await expect(page.getByRole("button", { name: "Complete" })).toBeVisible();

  const boot = await request.get("/api/assessments/instruments/full_assessment");
  expect(boot.ok()).toBeTruthy();
  const payload = (await boot.json()) as { items: Array<{ id: string }> };

  const sessionRes = await request.post("/api/assessments/sessions", {
    data: { instrumentId: "full_assessment", forceNew: true },
  });
  if (sessionRes.status() === 423) {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: /Five things that matter today/i }),
    ).toBeVisible();
    return;
  }
  expect(sessionRes.ok()).toBeTruthy();
  const sessionBody = (await sessionRes.json()) as { session: { id: string } };

  const saved = await request.put(
    `/api/assessments/sessions/${sessionBody.session.id}/responses`,
    {
      data: {
        responses: payload.items.map((item) => ({
          itemId: item.id,
          answer: 2,
          skipped: false,
        })),
      },
    },
  );
  expect(saved.ok()).toBeTruthy();

  const completed = await request.post(
    `/api/assessments/sessions/${sessionBody.session.id}/complete`,
    { data: {} },
  );
  expect(completed.ok()).toBeTruthy();

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /Five things that matter today/i })).toBeVisible();
  await expect(page.getByText("Most depleted")).toBeVisible();
});
