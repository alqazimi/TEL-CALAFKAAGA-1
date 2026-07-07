"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  User,
  Shield,
  Lock,
  Landmark,
  Quote,
  UserPlus,
  Search,
  Heart,
  MessageCircleHeart,
  Star,
  Headphones,
  ClipboardList,
  Sparkles,
  ArrowRight,
  BadgeCheck,
} from "lucide-react";
import { AuthRegisterCta } from "@/components/auth/auth-register-cta";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FAQAccordion } from "@/components/marketing/faq-accordion";
import {
  MIN_COMPATIBILITY_SCORE,
  PERSONAL_SUPPORT_PRICE,
  REGISTRATION_PRICE,
  WHATSAPP_URL,
} from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

function QuoteCard({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <div className={cn("glass rounded-2xl p-6 sm:p-8 shadow-2xl", className)}>
      <Quote className="h-9 w-9 text-primary mb-4" />
      <p className="text-base sm:text-lg text-foreground italic leading-relaxed">
        &ldquo;{t("landing.quote")}&rdquo;
      </p>
      <p className="mt-4 text-sm text-muted-foreground">— {t("landing.quoteAuthor")}</p>
    </div>
  );
}

function AppPreviewMock() {
  const { t } = useTranslation();

  const previews = [
    {
      title: t("landing.previewProfile"),
      icon: ClipboardList,
      content: (
        <div className="space-y-2">
          <div className="h-2 w-full rounded-full bg-primary/20" />
          <div className="h-2 w-4/5 rounded-full bg-muted" />
          <div className="h-2 w-3/5 rounded-full bg-muted" />
          <div className="mt-3 h-8 w-full rounded-lg bg-primary/10" />
        </div>
      ),
    },
    {
      title: t("landing.previewMatches"),
      icon: Heart,
      content: (
        <div className="space-y-3">
          {["84%", "78%", "72%"].map((score) => (
            <div key={score} className="flex items-center gap-3 rounded-xl bg-muted/60 p-2">
              <div className="h-9 w-9 rounded-full bg-primary/15" />
              <div className="flex-1 space-y-1">
                <div className="h-2 w-20 rounded-full bg-muted" />
                <div className="h-2 w-14 rounded-full bg-muted/70" />
              </div>
              <span className="text-xs font-bold text-primary">{score}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: t("landing.previewChat"),
      icon: MessageCircleHeart,
      content: (
        <div className="space-y-2">
          <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-primary/15 px-3 py-2 text-xs">
            Assalamu alaikum
          </div>
          <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-xs">
            Wa alaikum assalam
          </div>
          <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-primary/15 px-3 py-2 text-xs">
            How are you?
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {previews.map((preview) => (
        <Card key={preview.title} className="overflow-hidden border-border/80 shadow-md">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <preview.icon className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold leading-snug">{preview.title}</p>
            </div>
            {preview.content}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function LandingPage() {
  const { t } = useTranslation();

  const heroFeatures = [
    { icon: User, label: t("landing.heroFeature1") },
    { icon: Shield, label: t("landing.heroFeature2") },
    { icon: Lock, label: t("landing.heroFeature3") },
    { icon: Landmark, label: t("landing.heroFeature4") },
  ];

  const whyPayReasons = [
    { num: 1, icon: User, title: t("landing.whyPay1Title"), desc: t("landing.whyPay1Desc") },
    { num: 2, icon: User, title: t("landing.whyPay2Title"), desc: t("landing.whyPay2Desc") },
    { num: 3, icon: Headphones, title: t("landing.whyPay3Title"), desc: t("landing.whyPay3Desc") },
    { num: 4, icon: Lock, title: t("landing.whyPay4Title"), desc: t("landing.whyPay4Desc") },
  ];

  const steps = [
    { icon: UserPlus, title: t("landing.step1Title"), desc: t("landing.step1Desc") },
    { icon: ClipboardList, title: t("landing.step2Title"), desc: t("landing.step2Desc") },
    { icon: Search, title: t("landing.step3Title"), desc: t("landing.step3Desc") },
    { icon: MessageCircleHeart, title: t("landing.step4Title"), desc: t("landing.step4Desc") },
  ];

  const stats = [
    { value: t("landing.stat1Value"), label: t("landing.stat1"), icon: Heart },
    { value: t("landing.stat2Value"), label: t("landing.stat2"), icon: Landmark },
    { value: t("landing.stat3Value"), label: t("landing.stat3"), icon: Shield },
    { value: t("landing.stat4Value"), label: t("landing.stat4"), icon: Headphones },
  ];

  const stories = [
    {
      names: "Ayaan & Farhan",
      quote: t("landing.story1Quote"),
      initials: "AF",
      location: t("landing.story1Location"),
    },
    {
      names: "Halima & Yusuf",
      quote: t("landing.story2Quote"),
      initials: "HY",
      location: t("landing.story2Location"),
    },
    {
      names: "Sahra & Ahmed",
      quote: t("landing.story3Quote"),
      initials: "SA",
      location: t("landing.story3Location"),
    },
  ];

  const trustItems = [
    { icon: Lock, label: t("landing.trust1") },
    { icon: Landmark, label: t("landing.trust2") },
    { icon: Shield, label: t("landing.trust3") },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[600px] flex items-center bg-gradient-to-br from-[#4a0d1f] via-[#8a1230] to-primary/50 dark:from-[#2a0512] dark:via-[#4a0d1f] dark:to-primary/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#4a0d1f]/90 via-[#4a0d1f]/70 to-[#4a0d1f]/40 dark:from-black/90 dark:via-black/75 dark:to-black/50" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="initial"
              animate="animate"
              variants={{ animate: { transition: { staggerChildren: 0.1 } } }}
            >
              <motion.span
                variants={fadeUp}
                className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground mb-6"
              >
                {t("landing.badge")}
              </motion.span>

              <motion.h1
                variants={fadeUp}
                className="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]"
              >
                {t("landing.heroTitle")}{" "}
                <span className="text-primary">{t("landing.heroHighlight")}</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-6 text-lg text-white/85 max-w-xl leading-relaxed"
              >
                {t("landing.heroDesc")}
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-8 flex flex-col sm:flex-row gap-3"
              >
                <AuthRegisterCta
                  registerLabel={t("landing.heroCta", { price: REGISTRATION_PRICE })}
                  className="text-base px-8"
                  size="lg"
                />
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  <Link href="/how-it-works">{t("landing.seeHowItWorks")}</Link>
                </Button>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4"
              >
                {heroFeatures.map((f) => (
                  <div key={f.label} className="flex flex-col items-center text-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium text-white/90">{f.label}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="hidden lg:block"
            >
              <QuoteCard className="max-w-md ml-auto" />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-10 lg:hidden"
          >
            <QuoteCard />
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative -mt-16 z-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl bg-card border border-border shadow-xl p-8 lg:p-12 space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-display text-2xl sm:text-3xl font-semibold">
                {t("landing.pricingTitle")}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {t("landing.pricingSubtitle", { premium: PERSONAL_SUPPORT_PRICE })}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-md">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold">{t("landing.basicPlan")}</h3>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-primary">
                        ${REGISTRATION_PRICE}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {t("common.oneTime")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t("landing.basicPlanDesc")}
                    </p>
                  </div>
                  <AuthRegisterCta
                    registerLabel={t("auth.joinNowPrice", { price: REGISTRATION_PRICE })}
                    className="w-full"
                    variant="outline"
                  />
                </CardContent>
              </Card>

              <Card className="ring-2 ring-primary shadow-xl shadow-primary/10">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-semibold">{t("landing.premiumPlan")}</h3>
                      <Badge>{t("landing.recommended")}</Badge>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-primary">
                        ${PERSONAL_SUPPORT_PRICE}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {t("common.oneTime")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t("landing.premiumPlanDesc")}
                    </p>
                  </div>
                  <AuthRegisterCta
                    registerLabel={t("auth.joinNowPrice", { price: PERSONAL_SUPPORT_PRICE })}
                    className="w-full"
                  />
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-10 items-start pt-4 border-t border-border">
              <div>
                <h3 className="font-display text-xl font-semibold mb-6">
                  {t("landing.whyPay")}
                </h3>
                <div className="space-y-5">
                  {whyPayReasons.map((reason) => (
                    <div key={reason.num} className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {reason.num}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <reason.icon className="h-4 w-4 text-primary" />
                          <h4 className="font-semibold">{reason.title}</h4>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{reason.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#128C7E]/30 bg-gradient-to-br from-[#128C7E]/10 to-whatsapp/10 p-6">
                <h3 className="font-semibold text-lg">{t("landing.personalSupportTitle")}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {t("landing.personalSupportDesc")}
                </p>
                <Button asChild className="mt-4 bg-whatsapp hover:bg-whatsapp/90 text-white">
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                    {t("landing.chatWhatsApp")}
                  </a>
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground pt-2">
              <Lock className="h-4 w-4" />
              <span>{t("common.securePayments")}</span>
              <span className="text-xs font-semibold tracking-wide">VISA</span>
              <span className="text-xs font-semibold tracking-wide">MC</span>
            </div>
          </div>
        </div>
      </section>

      {/* App Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="landing-section-title font-display text-3xl font-semibold">
              {t("landing.previewTitle")}
            </h2>
            <p className="mt-3 text-muted-foreground">{t("landing.previewSubtitle")}</p>
          </div>
          <AppPreviewMock />
        </div>
      </section>

      {/* Compatibility */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/40">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary mb-6">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="landing-section-title font-display text-3xl font-semibold">
            {t("landing.matchingTitle")}
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {t("landing.matchingDesc", { score: MIN_COMPATIBILITY_SCORE })}
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="landing-section-title font-display text-3xl font-semibold">
            {t("landing.howWorks")}
          </h2>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative flex flex-col items-center text-center"
              >
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-primary/30" />
                )}
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-card text-primary shadow-md">
                  <step.icon className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-brand-dark dark:bg-card">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="mx-auto h-8 w-8 text-gold mb-3" />
                <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                <div className="mt-1 text-sm text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section id="success-stories" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="landing-section-title font-display text-3xl font-semibold">
            {t("landing.successStories")}
          </h2>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {stories.map((story) => (
              <motion.div
                key={story.names}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-border bg-card p-6 shadow-md text-left"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                      {story.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                      ))}
                    </div>
                    <p className="mt-1 text-sm font-semibold">{story.names}</p>
                    <p className="text-xs text-muted-foreground">{story.location}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {t("landing.verifiedMember")}
                </div>
                <p className="mt-3 text-sm text-muted-foreground italic leading-relaxed">
                  &ldquo;{story.quote}&rdquo;
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/40">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="landing-section-title font-display text-3xl font-semibold">
              {t("landing.faqTitle")}
            </h2>
            <p className="mt-3 text-muted-foreground">{t("landing.faqSubtitle")}</p>
          </div>
          <FAQAccordion
            limit={4}
            viewAllHref="/faq"
            viewAllLabel={t("landing.viewAllFaq")}
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-[#4a0d1f] via-[#8a1230] to-primary p-8 sm:p-12 text-center text-white shadow-xl">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold">
            {t("landing.finalCtaTitle")}
          </h2>
          <p className="mt-3 text-white/85 max-w-xl mx-auto">{t("landing.finalCtaDesc")}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <AuthRegisterCta
              registerLabel={t("landing.heroCta", { price: REGISTRATION_PRICE })}
              className="bg-white text-primary hover:bg-white/90"
            />
            <Button
              asChild
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/pricing">
                {t("nav.pricing")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-muted/40">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {trustItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-center gap-3 rounded-xl bg-card border border-border p-4"
              >
                <item.icon className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
