import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AUTH_METHOD_NAMES } from "../auth/types";
import { PROFILE_METHOD_NAMES } from "../profile/types";
import { PREFERENCES_METHOD_NAMES } from "../preferences/types";
import { QUESTIONNAIRE_METHOD_NAMES } from "../questionnaire/types";
import { PHOTOS_METHOD_NAMES } from "../photos/types";
import { MATCHING_METHOD_NAMES } from "../matching/types";
import { CHAT_METHOD_NAMES } from "../chat/types";
import { NOTIFICATIONS_METHOD_NAMES } from "../notifications/types";
import { PAYMENTS_METHOD_NAMES, EVC_METHOD_NAMES } from "../payments/types";
import { SUPPORT_METHOD_NAMES } from "../support/types";
import { MODERATION_METHOD_NAMES } from "../moderation/types";
import { apiAuth } from "../auth/api";
import { convexAuth } from "../auth/convex";
import { apiProfile } from "../profile/api";
import { convexProfile } from "../profile/convex";
import { apiPreferences } from "../preferences/api";
import { convexPreferences } from "../preferences/convex";
import { apiQuestionnaire } from "../questionnaire/api";
import { convexQuestionnaire } from "../questionnaire/convex";
import { apiPhotos } from "../photos/api";
import { convexPhotos } from "../photos/convex";
import { apiMatching } from "../matching/api";
import { convexMatching } from "../matching/convex";
import { apiChat } from "../chat/api";
import { convexChat } from "../chat/convex";
import { apiNotifications } from "../notifications/api";
import { convexNotifications } from "../notifications/convex";
import { apiPayments } from "../payments/api";
import { convexPayments } from "../payments/convex";
import { apiSupport } from "../support/api";
import { convexSupport } from "../support/convex";
import { apiModeration } from "../moderation/api";
import { convexModeration } from "../moderation/convex";
import { apiAdmin } from "../admin/api";
import { convexAdmin } from "../admin/convex";
import { ADMIN_TOP_METHOD_NAMES } from "../admin/types";

function assertSameMethods(
  names: readonly string[],
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  label: string
) {
  for (const name of names) {
    assert.equal(typeof a[name], "function", `${label} api missing ${name}`);
    assert.equal(typeof b[name], "function", `${label} convex missing ${name}`);
  }
}

describe("adapter contract", () => {
  it("auth exposes same method names", () => {
    assertSameMethods(AUTH_METHOD_NAMES, apiAuth as never, convexAuth as never, "auth");
  });
  it("profile exposes same method names", () => {
    assertSameMethods(PROFILE_METHOD_NAMES, apiProfile as never, convexProfile as never, "profile");
  });
  it("preferences exposes same method names", () => {
    assertSameMethods(
      PREFERENCES_METHOD_NAMES,
      apiPreferences as never,
      convexPreferences as never,
      "preferences"
    );
  });
  it("questionnaire exposes same method names", () => {
    assertSameMethods(
      QUESTIONNAIRE_METHOD_NAMES,
      apiQuestionnaire as never,
      convexQuestionnaire as never,
      "questionnaire"
    );
  });
  it("photos exposes same method names", () => {
    assertSameMethods(PHOTOS_METHOD_NAMES, apiPhotos as never, convexPhotos as never, "photos");
  });
  it("matching exposes same method names", () => {
    assertSameMethods(
      MATCHING_METHOD_NAMES,
      apiMatching as never,
      convexMatching as never,
      "matching"
    );
  });
  it("chat exposes same method names", () => {
    assertSameMethods(CHAT_METHOD_NAMES, apiChat as never, convexChat as never, "chat");
  });
  it("notifications exposes same method names", () => {
    assertSameMethods(
      NOTIFICATIONS_METHOD_NAMES,
      apiNotifications as never,
      convexNotifications as never,
      "notifications"
    );
  });
  it("payments exposes same method names", () => {
    assertSameMethods(
      PAYMENTS_METHOD_NAMES,
      apiPayments as never,
      convexPayments as never,
      "payments"
    );
    for (const name of EVC_METHOD_NAMES) {
      assert.equal(typeof apiPayments.evc[name], "function");
      assert.equal(typeof convexPayments.evc[name], "function");
    }
  });
  it("support exposes same method names", () => {
    assertSameMethods(SUPPORT_METHOD_NAMES, apiSupport as never, convexSupport as never, "support");
    assert.equal(typeof apiSupport.admin.list, "function");
    assert.equal(typeof convexSupport.admin.list, "function");
  });
  it("moderation exposes same method names", () => {
    assertSameMethods(
      MODERATION_METHOD_NAMES,
      apiModeration as never,
      convexModeration as never,
      "moderation"
    );
  });
  it("admin exposes same top-level method names", () => {
    assertSameMethods(
      ADMIN_TOP_METHOD_NAMES,
      apiAdmin as never,
      convexAdmin as never,
      "admin"
    );
    assert.equal(typeof apiAdmin.users.list, "function");
    assert.equal(typeof convexAdmin.users.list, "function");
    assert.equal(typeof apiAdmin.staffInvites.accept, "function");
    assert.equal(typeof convexAdmin.staffInvites.accept, "function");
  });
});
