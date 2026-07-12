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
import type * as evcPayments from "../evcPayments.js";
import type * as geolocation from "../geolocation.js";
import type * as http from "../http.js";
import type * as lib_access from "../lib/access.js";
import type * as lib_adminAuth from "../lib/adminAuth.js";
import type * as lib_auditLog from "../lib/auditLog.js";
import type * as lib_authEmail from "../lib/authEmail.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_countries from "../lib/countries.js";
import type * as lib_createProfile from "../lib/createProfile.js";
import type * as lib_deleteUser from "../lib/deleteUser.js";
import type * as lib_emailTemplate from "../lib/emailTemplate.js";
import type * as lib_genderLock from "../lib/genderLock.js";
import type * as lib_grantPaidAccess from "../lib/grantPaidAccess.js";
import type * as lib_locationMatch from "../lib/locationMatch.js";
import type * as lib_matchPresentation from "../lib/matchPresentation.js";
import type * as lib_moderation from "../lib/moderation.js";
import type * as lib_phone from "../lib/phone.js";
import type * as lib_premium from "../lib/premium.js";
import type * as lib_profileCompleteness from "../lib/profileCompleteness.js";
import type * as lib_profileEnrichment from "../lib/profileEnrichment.js";
import type * as lib_questionnaire from "../lib/questionnaire.js";
import type * as lib_queueMemberEmail from "../lib/queueMemberEmail.js";
import type * as lib_resendOtp from "../lib/resendOtp.js";
import type * as lib_reviewStatus from "../lib/reviewStatus.js";
import type * as lib_roles from "../lib/roles.js";
import type * as lib_sendNotification from "../lib/sendNotification.js";
import type * as lib_stripe from "../lib/stripe.js";
import type * as lib_trial from "../lib/trial.js";
import type * as lib_uniquePassword from "../lib/uniquePassword.js";
import type * as lib_uploadValidation from "../lib/uploadValidation.js";
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
import type * as rateLimit from "../rateLimit.js";
import type * as siteMetrics from "../siteMetrics.js";
import type * as staffInviteEmail from "../staffInviteEmail.js";
import type * as staffInvites from "../staffInvites.js";
import type * as stripeActions from "../stripeActions.js";
import type * as stripeWebhook from "../stripeWebhook.js";
import type * as stripeWebhookNode from "../stripeWebhookNode.js";
import type * as supportContacts from "../supportContacts.js";
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
  evcPayments: typeof evcPayments;
  geolocation: typeof geolocation;
  http: typeof http;
  "lib/access": typeof lib_access;
  "lib/adminAuth": typeof lib_adminAuth;
  "lib/auditLog": typeof lib_auditLog;
  "lib/authEmail": typeof lib_authEmail;
  "lib/constants": typeof lib_constants;
  "lib/countries": typeof lib_countries;
  "lib/createProfile": typeof lib_createProfile;
  "lib/deleteUser": typeof lib_deleteUser;
  "lib/emailTemplate": typeof lib_emailTemplate;
  "lib/genderLock": typeof lib_genderLock;
  "lib/grantPaidAccess": typeof lib_grantPaidAccess;
  "lib/locationMatch": typeof lib_locationMatch;
  "lib/matchPresentation": typeof lib_matchPresentation;
  "lib/moderation": typeof lib_moderation;
  "lib/phone": typeof lib_phone;
  "lib/premium": typeof lib_premium;
  "lib/profileCompleteness": typeof lib_profileCompleteness;
  "lib/profileEnrichment": typeof lib_profileEnrichment;
  "lib/questionnaire": typeof lib_questionnaire;
  "lib/queueMemberEmail": typeof lib_queueMemberEmail;
  "lib/resendOtp": typeof lib_resendOtp;
  "lib/reviewStatus": typeof lib_reviewStatus;
  "lib/roles": typeof lib_roles;
  "lib/sendNotification": typeof lib_sendNotification;
  "lib/stripe": typeof lib_stripe;
  "lib/trial": typeof lib_trial;
  "lib/uniquePassword": typeof lib_uniquePassword;
  "lib/uploadValidation": typeof lib_uploadValidation;
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
  rateLimit: typeof rateLimit;
  siteMetrics: typeof siteMetrics;
  staffInviteEmail: typeof staffInviteEmail;
  staffInvites: typeof staffInvites;
  stripeActions: typeof stripeActions;
  stripeWebhook: typeof stripeWebhook;
  stripeWebhookNode: typeof stripeWebhookNode;
  supportContacts: typeof supportContacts;
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
