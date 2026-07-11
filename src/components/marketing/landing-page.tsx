"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
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
  MIN_COMPATIBILITY_SCORE,
  PERSONAL_SUPPORT_PRICE,
  REGISTRATION_PRICE,
  SITE_BRAND_NAME,
  WHATSAPP_URL,
} from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/context";

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
};

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
    t("landing.basicPlanDesc"),
    t("landing.step3Title"),
    t("landing.step4Title"),
  ];

  const premiumFeatures = [
    t("landing.premiumPlanDesc"),
    t("landing.whyPay3Title"),
    t("landing.personalSupportTitle"),
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero — brand, one headline, one sentence, CTAs, full-bleed image */}
      <section className="relative min-h-[100svh] flex items-end sm:items-center overflow-hidden bg-brand-dark">
        <Image
          src="/images/hero-couple.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[72%_center] sm:object-center"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/95 via-brand-dark/78 to-brand-dark/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-brand-dark/50" />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 sm:pb-24 sm:pt-32 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl"
          >
            <p className="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.05]">
              {SITE_BRAND_NAME}
            </p>

            <h1 className="mt-5 font-display text-2xl font-medium tracking-tight text-white/95 sm:text-3xl lg:text-[2.15rem] leading-snug">
              {t("landing.heroTitle")}
              <span className="text-gold"> {t("landing.heroHighlight")}</span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-white/80 max-w-md leading-relaxed">
              {t("landing.heroDesc")}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <AuthRegisterCta
                registerLabel={t("common.joinNow")}
                className="text-base px-8 shadow-lg shadow-primary/25"
                size="lg"
              />
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white backdrop-blur-sm"
              >
                <Link href="/how-it-works">{t("landing.seeHowItWorks")}</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values — one purpose */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 gradient-hero">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeIn} className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
              {t("landing.badge")}
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              {t("landing.previewSubtitle")}
            </p>
          </motion.div>

          <div className="grid gap-10 sm:grid-cols-3">
            {values.map((item, i) => (
              <motion.div
                key={item.title}
                {...fadeIn}
                transition={{ ...fadeIn.transition, delay: i * 0.08 }}
                className="text-center sm:text-left"
              >
                <div className="mx-auto sm:mx-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeIn} className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
              {t("landing.howWorks")}
            </h2>
          </motion.div>

          <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <motion.li
                key={step.title}
                {...fadeIn}
                transition={{ ...fadeIn.transition, delay: i * 0.07 }}
                className="relative"
              >
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
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* Compatibility — honest framing */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeIn} className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-gold">
            {t("landing.stat1")}
          </p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold tracking-tight">
            {t("landing.matchingTitle")}
          </h2>
          <p className="mt-5 text-muted-foreground leading-relaxed text-base sm:text-lg">
            {t("landing.matchingDesc", { score: MIN_COMPATIBILITY_SCORE })}
          </p>
        </motion.div>
      </section>

      {/* Pricing */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeIn} className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
              {t("landing.pricingTitle")}
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              {t("landing.pricingSubtitle", { premium: PERSONAL_SUPPORT_PRICE })}
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2">
            <motion.div
              {...fadeIn}
              className="rounded-3xl border border-border bg-card p-8 shadow-md"
            >
              <h3 className="text-xl font-semibold">{t("landing.basicPlan")}</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-5xl font-semibold text-primary">
                  ${REGISTRATION_PRICE}
                </span>
                <span className="text-sm text-muted-foreground">{t("common.oneTime")}</span>
              </div>
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
            </motion.div>

            <motion.div
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: 0.08 }}
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
            </motion.div>
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

      {/* FAQ */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <motion.div {...fadeIn} className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
              {t("landing.faqTitle")}
            </h2>
            <p className="mt-4 text-muted-foreground">{t("landing.faqSubtitle")}</p>
          </motion.div>
          <FAQAccordion
            limit={4}
            viewAllHref="/faq"
            viewAllLabel={t("landing.viewAllFaq")}
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          {...fadeIn}
          className="mx-auto max-w-4xl rounded-[2rem] bg-brand-dark px-8 py-12 sm:px-12 sm:py-16 text-center text-white relative overflow-hidden"
        >
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
        </motion.div>
      </section>
    </div>
  );
}
