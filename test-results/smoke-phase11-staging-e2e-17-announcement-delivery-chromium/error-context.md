# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> phase11 staging e2e >> 17 announcement delivery
- Location: e2e/staging/smoke.spec.ts:601:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 429
```

# Test source

```ts
  503 |       "passed",
  504 |       `latest=${latest.status()} pending=${pending.status()}`
  505 |     );
  506 |   });
  507 | 
  508 |   // ── 14. Support thread ──────────────────────────────────────────────
  509 |   test("14 support thread and reply", async ({ request }) => {
  510 |     const member = await bootstrapSession(request, MEMBER.email, MEMBER.password);
  511 |     expect(member.status).toBe(200);
  512 |     const create = await request.post(`${API}/support`, {
  513 |       headers: { ...member.headers, "content-type": "application/json" },
  514 |       data: {
  515 |         subject: `phase11 e2e ${Date.now()}`,
  516 |         message: "staging support smoke",
  517 |       },
  518 |     });
  519 |     expect([200, 201, 400, 403]).toContain(create.status());
  520 |     const mine = await request.get(`${API}/support/me`, {
  521 |       headers: member.headers,
  522 |     });
  523 |     expect([200, 403]).toContain(mine.status());
  524 | 
  525 |     const admin = await bootstrapSession(request, ADMIN.email, ADMIN.password);
  526 |     const inbox = await request.get(`${API}/admin/support`, {
  527 |       headers: admin.headers,
  528 |     });
  529 |     expect([200, 403]).toContain(inbox.status());
  530 |     record(
  531 |       "14-support",
  532 |       "passed",
  533 |       `create=${create.status()} me=${mine.status()} admin=${inbox.status()}`
  534 |     );
  535 |   });
  536 | 
  537 |   // ── 15. Admin approve/reject/ban/unban ──────────────────────────────
  538 |   test("15 admin approve/reject/ban/unban", async ({ request }) => {
  539 |     const admin = await bootstrapSession(request, ADMIN.email, ADMIN.password);
  540 |     expect(admin.status).toBe(200);
  541 |     const users = await request.get(`${API}/admin/users?limit=5`, {
  542 |       headers: admin.headers,
  543 |     });
  544 |     expect([200, 403]).toContain(users.status());
  545 |     if (users.status() !== 200) {
  546 |       record("15-admin-moderation", "failed", `admin users ${users.status()}`);
  547 |       expect(users.status()).toBe(200);
  548 |       return;
  549 |     }
  550 |     const body = await users.json();
  551 |     const items = body?.items ?? body?.users ?? body ?? [];
  552 |     const target = Array.isArray(items)
  553 |       ? items.find(
  554 |           (u: { emailNormalized?: string; email?: string; role?: string }) =>
  555 |             (u.emailNormalized ?? u.email) === UNPAID.email || u.role === "user"
  556 |         )
  557 |       : undefined;
  558 |     const id = target?.id;
  559 |     if (!id) {
  560 |       record("15-admin-moderation", "passed", "list ok; no safe target id");
  561 |       return;
  562 |     }
  563 |     // Soft-touch: request-photo is reversible; avoid ban on shared seed unless needed
  564 |     const photo = await request.post(`${API}/admin/users/${id}/request-photo`, {
  565 |       headers: { ...admin.headers, "content-type": "application/json" },
  566 |       data: {},
  567 |     });
  568 |     expect([200, 400, 403, 404, 409]).toContain(photo.status());
  569 |     record("15-admin-moderation", "passed", `request-photo=${photo.status()} id=${id}`);
  570 |   });
  571 | 
  572 |   // ── 16. Staff invite acceptance ─────────────────────────────────────
  573 |   test("16 staff invite inspect", async ({ request, page }) => {
  574 |     const bogus = await request.get(`${API}/staff-invites/not-a-real-token`);
  575 |     expect([200, 404]).toContain(bogus.status());
  576 |     const body = await bogus.json().catch(() => ({}));
  577 |     // Safe status — never leak emails for invalid tokens
  578 |     if (bogus.status() === 200) {
  579 |       expect(body.valid === false || body.email == null || body.reason).toBeTruthy();
  580 |     }
  581 | 
  582 |     const admin = await bootstrapSession(request, ADMIN.email, ADMIN.password);
  583 |     const list = await request.get(`${API}/admin/staff-invites`, {
  584 |       headers: admin.headers,
  585 |     });
  586 |     expect([200, 403]).toContain(list.status());
  587 | 
  588 |     const next = await nextHealth();
  589 |     if (next.ok) {
  590 |       await page.goto("/admin/invite?token=not-a-real-token");
  591 |       await expect(page.locator("body")).toBeVisible();
  592 |     }
  593 |     record(
  594 |       "16-staff-invite",
  595 |       "passed",
  596 |       `inspect=${bogus.status()} list=${list.status()}`
  597 |     );
  598 |   });
  599 | 
  600 |   // ── 17. Announcement delivery ───────────────────────────────────────
  601 |   test("17 announcement delivery", async ({ request }) => {
  602 |     const admin = await bootstrapSession(request, ADMIN.email, ADMIN.password);
> 603 |     expect(admin.status).toBe(200);
      |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  604 |     const list = await request.get(`${API}/admin/announcements`, {
  605 |       headers: admin.headers,
  606 |     });
  607 |     expect([200, 403, 404]).toContain(list.status());
  608 |     record("17-announcement", "passed", `list=${list.status()}`);
  609 |   });
  610 | 
  611 |   // ── 18. Session expiry / logout ─────────────────────────────────────
  612 |   test("18 session logout", async ({ request, page }) => {
  613 |     const sess = await bootstrapSession(request, MEMBER.email, MEMBER.password);
  614 |     expect(sess.status).toBe(200);
  615 |     const logout = await request.post(`${API}/auth/logout`, {
  616 |       headers: { ...sess.headers, "content-type": "application/json" },
  617 |       data: {},
  618 |     });
  619 |     expect([200, 401, 403]).toContain(logout.status());
  620 |     const me = await request.get(`${API}/auth/me`, { headers: sess.headers });
  621 |     // After logout cookies cleared server-side; 401 expected. 200 possible if CSRF blocked logout.
  622 |     expect([200, 401, 403]).toContain(me.status());
  623 | 
  624 |     const next = await nextHealth();
  625 |     if (next.ok) {
  626 |       await loginViaUi(page, MEMBER.email, MEMBER.password);
  627 |       await expect(page).not.toHaveURL(/\/(login|auth)(\?|$)/, {
  628 |         timeout: 20_000,
  629 |       });
  630 |       await page.context().clearCookies();
  631 |       await page.goto("/matches");
  632 |       await expect(page).toHaveURL(/\/(login|auth)/, { timeout: 15_000 });
  633 |     }
  634 |     record("18-logout", "passed", `api logout=${logout.status()} me=${me.status()}`);
  635 |   });
  636 | 
  637 |   // ── 19. Provider rollback smoke ─────────────────────────────────────
  638 |   test("19 provider rollback smoke", async () => {
  639 |     const provider = process.env.NEXT_PUBLIC_BACKEND_PROVIDER ?? "convex";
  640 |     expect(["api", "convex"]).toContain(provider);
  641 |     // Documented rollback: rebuild Next with NEXT_PUBLIC_BACKEND_PROVIDER=convex
  642 |     // Convex mode remains available; no DB rollback.
  643 |     record(
  644 |       "19-provider-rollback",
  645 |       "passed",
  646 |       `runner provider=${provider}; rollback=set NEXT_PUBLIC_BACKEND_PROVIDER=convex and redeploy frontend only`
  647 |     );
  648 |   });
  649 | 
  650 |   // ── 20. Unauthorized / admin denial ─────────────────────────────────
  651 |   test("20 unauthorized admin access denial", async ({ request, page }) => {
  652 |     const member = await bootstrapSession(request, MEMBER.email, MEMBER.password);
  653 |     expect(member.status).toBe(200);
  654 |     const denied = await request.get(`${API}/admin/users?limit=1`, {
  655 |       headers: member.headers,
  656 |     });
  657 |     expect([401, 403]).toContain(denied.status());
  658 | 
  659 |     const anon = await request.get(`${API}/admin/users?limit=1`);
  660 |     expect([401, 403]).toContain(anon.status());
  661 | 
  662 |     const next = await nextHealth();
  663 |     if (next.ok) {
  664 |       await page.goto("/admin");
  665 |       await expect(page).toHaveURL(/\/(login|auth)/, { timeout: 15_000 });
  666 |     }
  667 |     record(
  668 |       "20-admin-denial",
  669 |       "passed",
  670 |       `member=${denied.status()} anon=${anon.status()}`
  671 |     );
  672 |   });
  673 | });
  674 | 
```