"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Shield,
  Lock,
  Landmark,
  UserPlus,
  Search,
  MessageCircleHeart,
  Headphones,
  ClipboardList,
  ArrowRight,
  Check,
} from "lucide-react";
import { AuthRegisterCta } from "@/components/auth/auth-register-cta";
import { PlanChoiceNote } from "@/components/marketing/plan-choice-note";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FAQAccordion } from "@/components/marketing/faq-accordion";
import {
  formatMoney,
  MIN_COMPATIBILITY_SCORE,
  PERSONAL_SUPPORT_PRICE,
  PREMIUM_UPGRADE_PRICE,
  REGISTRATION_PRICE,
  SITE_BRAND_NAME,
  WOMEN_BASIC_PRICE,
  WHATSAPP_URL,
} from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

function Reveal({
  children,
  className,
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  return (
    <div
      className={cn("motion-safe:animate-reveal", className)}
      style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}

export function LandingPage() {
  const { t } = useTranslation();

  const steps = [
    { icon: UserPlus, title: t("landing.step1Title"), desc: t("landing.step1Desc") },
    { icon: ClipboardList, title: t("landing.step2Title"), desc: t("landing.step2Desc") },
    { icon: Search, title: t("landing.step3Title"), desc: t("landing.step3Desc") },
    { icon: MessageCircleHeart, title: t("landing.step4Title"), desc: t("landing.step4Desc") },
  ];

  const values = [
    { icon: Landmark, title: t("landing.heroFeature4"), desc: t("landing.whyPay1Desc") },
    { icon: Shield, title: t("landing.heroFeature2"), desc: t("landing.whyPay2Desc") },
    { icon: Lock, title: t("landing.heroFeature3"), desc: t("landing.whyPay4Desc") },
  ];

  const basicFeatures = [
    t("landing.basicFeature1"),
    t("landing.basicFeature2"),
    t("landing.basicFeature3"),
    t("landing.basicFeature4"),
    t("landing.basicFeature5"),
  ];

  const premiumFeatures = [
    t("landing.premiumFeature1"),
    t("landing.premiumFeature2"),
    t("landing.premiumFeature3"),
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero — full-bleed atmosphere; brand first; one CTA group */}
      <section className="relative flex min-h-[100svh] items-end overflow-hidden bg-[#120d0e] sm:items-center">
        <div className="absolute inset-0 motion-safe:animate-hero-zoom">
          <Image
            src="/images/hero-couple.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[72%_center] sm:object-[center_28%]"
            aria-hidden
          />
        </div>
        {/* Readable text plane — soft, not flat black */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/10 sm:via-black/40 sm:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--background)] to-transparent opacity-90" />

        <div className="relative mx-auto w-full max-w-7xl px-5 pb-20 pt-28 sm:px-6 sm:pb-28 sm:pt-32 lg:px-8">
          <div className="max-w-xl">
            <p className="motion-safe:animate-hero-rise font-display text-[2.75rem] font-semibold leading-[1.02] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {SITE_BRAND_NAME}
            </p>
            <div
              className="motion-safe:animate-hero-rise mt-4 h-px w-16 bg-gold/80"
              style={{ animationDelay: "90ms" }}
              aria-hidden
            />

            <h1
              className="motion-safe:animate-hero-rise mt-6 max-w-lg font-display text-[1.65rem] font-medium leading-snug tracking-tight text-white/95 sm:text-3xl lg:text-[2.1rem]"
              style={{ animationDelay: "140ms" }}
            >
              {t("landing.heroTitle")}{" "}
              <span className="text-white/80">{t("landing.heroHighlight")}</span>
            </h1>

            <p
              className="motion-safe:animate-hero-rise mt-5 max-w-md text-base leading-relaxed text-white/80 sm:text-lg"
              style={{ animationDelay: "220ms" }}
            >
              {t("landing.heroDesc")}
            </p>

            <div
              className="motion-safe:animate-hero-rise mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
              style={{ animationDelay: "300ms" }}
            >
              <AuthRegisterCta
                registerLabel={t("common.joinNow")}
                className="h-12 rounded-2xl px-8 text-base shadow-lg shadow-black/25"
                size="lg"
              />
              <Link
                href="/how-it-works"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-2 text-sm font-semibold text-white/90 transition-colors hover:text-white sm:px-4"
              >
                {t("landing.seeHowItWorks")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 gradient-hero">
        <div className="mx-auto max-w-5xl">
          <Reveal className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
              {t("landing.badge")}
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              {t("landing.previewSubtitle")}
            </p>
          </Reveal>

          <div className="grid gap-10 sm:grid-cols-3">
            {values.map((item, i) => (
              <Reveal key={item.title} delayMs={i * 80} className="text-center sm:text-left">
                <div className="mx-auto sm:mx-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="mx-auto max-w-6xl">
          <Reveal className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
              {t("landing.howWorks")}
            </h2>
          </Reveal>

          <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <li key={step.title} className="relative motion-safe:animate-reveal" style={{ animationDelay: `${i * 70}ms` }}>
                <span className="font-display text-4xl font-semibold text-primary/20">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="mt-3 flex h-11 w-11 items-center justify-center rounded-xl bg-card border border-border text-primary shadow-sm">
                  <step.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-gold">
            {t("landing.stat1")}
          </p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold tracking-tight">
            {t("landing.matchingTitle")}
          </h2>
          <p className="mt-5 text-muted-foreground leading-relaxed text-base sm:text-lg">
            {t("landing.matchingDesc", { score: MIN_COMPATIBILITY_SCORE })}
          </p>
        </Reveal>
      </section>

      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="mx-auto max-w-5xl">
          <Reveal className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
              {t("landing.pricingTitle")}
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              {t("landing.pricingSubtitle", {
                premium: PERSONAL_SUPPORT_PRICE,
                basic: REGISTRATION_PRICE,
                womenBasic: formatMoney(WOMEN_BASIC_PRICE),
                womenPremium: PREMIUM_UPGRADE_PRICE,
              })}
            </p>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-2">
            <Reveal className="rounded-3xl border border-border bg-card p-8 shadow-md">
              <h3 className="text-xl font-semibold">{t("landing.basicPlan")}</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-5xl font-semibold text-primary">
                  ${REGISTRATION_PRICE}
                </span>
                <span className="text-sm text-muted-foreground">{t("common.oneTime")}</span>
              </div>
              <p className="mt-2 text-xs font-medium text-primary">
                {t("landing.womenFreeNote", {
                  price: formatMoney(WOMEN_BASIC_PRICE),
                  premium: PREMIUM_UPGRADE_PRICE,
                })}
              </p>
              <ul className="mt-6 space-y-3">
                {basicFeatures.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <AuthRegisterCta
                registerLabel={t("common.joinNow")}
                plan="basic"
                className="w-full mt-8"
                variant="outline"
              />
            </Reveal>

            <Reveal
              delayMs={80}
              className="rounded-3xl border-2 border-primary bg-card p-8 shadow-xl shadow-primary/10 relative"
            >
              <Badge className="absolute -top-3 left-8 bg-gold text-gold-foreground border-0">
                {t("landing.recommended")}
              </Badge>
              <h3 className="text-xl font-semibold">{t("landing.premiumPlan")}</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-5xl font-semibold text-primary">
                  ${PERSONAL_SUPPORT_PRICE}
                </span>
                <span className="text-sm text-muted-foreground">{t("common.oneTime")}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {premiumFeatures.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <AuthRegisterCta
                registerLabel={t("common.joinNow")}
                plan="premium"
                className="w-full mt-8"
              />
            </Reveal>
          </div>

          <PlanChoiceNote className="max-w-2xl mx-auto mt-8" />

          <div className="mt-10 rounded-2xl border border-border bg-card/80 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-whatsapp/15 text-whatsapp">
              <Headphones className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{t("landing.personalSupportTitle")}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {t("landing.personalSupportDesc")}
              </p>
            </div>
            <Button asChild className="bg-whatsapp hover:bg-whatsapp/90 text-white shrink-0">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                {t("landing.chatWhatsApp")}
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Reveal className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
              {t("landing.faqTitle")}
            </h2>
            <p className="mt-4 text-muted-foreground">{t("landing.faqSubtitle")}</p>
          </Reveal>
          <FAQAccordion
            limit={4}
            viewAllHref="/faq"
            viewAllLabel={t("landing.viewAllFaq")}
          />
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-4xl rounded-[2rem] bg-brand-dark px-8 py-12 sm:px-12 sm:py-16 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,162,39,0.18),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.2),transparent_50%)]" />
          <div className="relative">
            <h2 className="font-display text-2xl sm:text-4xl font-semibold tracking-tight">
              {t("landing.finalCtaTitle")}
            </h2>
            <p className="mt-4 text-white/75 max-w-xl mx-auto leading-relaxed">
              {t("landing.finalCtaDesc")}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <AuthRegisterCta
                registerLabel={t("common.joinNow")}
                className="bg-gold text-gold-foreground hover:bg-gold/90 border-0"
              />
              <Button
                asChild
                variant="outline"
                className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/pricing">
                  {t("nav.pricing")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
