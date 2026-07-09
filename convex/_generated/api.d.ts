/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ResendOTPPasswordReset from "../ResendOTPPasswordReset.js";
import type * as account from "../account.js";
import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as contact from "../contact.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as lib_access from "../lib/access.js";
import type * as lib_adminAuth from "../lib/adminAuth.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_createProfile from "../lib/createProfile.js";
import type * as lib_matchPresentation from "../lib/matchPresentation.js";
import type * as lib_moderation from "../lib/moderation.js";
import type * as lib_phone from "../lib/phone.js";
import type * as lib_premium from "../lib/premium.js";
import type * as lib_profileEnrichment from "../lib/profileEnrichment.js";
import type * as lib_questionnaire from "../lib/questionnaire.js";
import type * as lib_queueMemberEmail from "../lib/queueMemberEmail.js";
import type * as lib_resendOtp from "../lib/resendOtp.js";
import type * as lib_roles from "../lib/roles.js";
import type * as lib_sendNotification from "../lib/sendNotification.js";
import type * as lib_stripe from "../lib/stripe.js";
import type * as lib_trial from "../lib/trial.js";
import type * as matches from "../matches.js";
import type * as matching from "../matching.js";
import type * as matchingEngine from "../matchingEngine.js";
import type * as memberEmailReminders from "../memberEmailReminders.js";
import type * as memberEmails from "../memberEmails.js";
import type * as messages from "../messages.js";
import type * as migrations from "../migrations.js";
import type * as moderation from "../moderation.js";
import type * as notifications from "../notifications.js";
import type * as payments from "../payments.js";
import type * as profiles from "../profiles.js";
import type * as staffInviteEmail from "../staffInviteEmail.js";
import type * as staffInvites from "../staffInvites.js";
import type * as stripeActions from "../stripeActions.js";
import type * as stripeWebhook from "../stripeWebhook.js";
import type * as stripeWebhookNode from "../stripeWebhookNode.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ResendOTPPasswordReset: typeof ResendOTPPasswordReset;
  account: typeof account;
  admin: typeof admin;
  auth: typeof auth;
  contact: typeof contact;
  crons: typeof crons;
  http: typeof http;
  "lib/access": typeof lib_access;
  "lib/adminAuth": typeof lib_adminAuth;
  "lib/constants": typeof lib_constants;
  "lib/createProfile": typeof lib_createProfile;
  "lib/matchPresentation": typeof lib_matchPresentation;
  "lib/moderation": typeof lib_moderation;
  "lib/phone": typeof lib_phone;
  "lib/premium": typeof lib_premium;
  "lib/profileEnrichment": typeof lib_profileEnrichment;
  "lib/questionnaire": typeof lib_questionnaire;
  "lib/queueMemberEmail": typeof lib_queueMemberEmail;
  "lib/resendOtp": typeof lib_resendOtp;
  "lib/roles": typeof lib_roles;
  "lib/sendNotification": typeof lib_sendNotification;
  "lib/stripe": typeof lib_stripe;
  "lib/trial": typeof lib_trial;
  matches: typeof matches;
  matching: typeof matching;
  matchingEngine: typeof matchingEngine;
  memberEmailReminders: typeof memberEmailReminders;
  memberEmails: typeof memberEmails;
  messages: typeof messages;
  migrations: typeof migrations;
  moderation: typeof moderation;
  notifications: typeof notifications;
  payments: typeof payments;
  profiles: typeof profiles;
  staffInviteEmail: typeof staffInviteEmail;
  staffInvites: typeof staffInvites;
  stripeActions: typeof stripeActions;
  stripeWebhook: typeof stripeWebhook;
  stripeWebhookNode: typeof stripeWebhookNode;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
