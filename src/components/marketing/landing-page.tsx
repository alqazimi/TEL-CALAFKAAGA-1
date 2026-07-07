"use client";

import Link from "next/link";
import Image from "next/image";
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
  Check,
  Headphones,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { AuthRegisterCta } from "@/components/auth/auth-register-cta";
import { REGISTRATION_PRICE, WHATSAPP_CALL_PRICE } from "@/lib/constants";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const heroFeatures = [
  { icon: User, label: "Serious Members Only" },
  { icon: Shield, label: "Verified Profiles" },
  { icon: Lock, label: "Private & Secure" },
  { icon: Landmark, label: "Islamic Values" },
];

const whyPayReasons = [
  {
    num: 1,
    icon: User,
    title: "Genuine People",
    desc: "Waxaan hubinaa in qof kasta uu yahay qof dhab ah oo doonaya guur.",
  },
  {
    num: 2,
    icon: User,
    title: "Serious Members",
    desc: "Lacagta yar waxay ka saartaa dadka aan dhab ahayn.",
  },
  {
    num: 3,
    icon: Headphones,
    title: "Dedicated Support",
    desc: "Kooxdayadu waxay ku caawinaysaa safarkaaga guurka.",
  },
  {
    num: 4,
    icon: Lock,
    title: "Privacy First",
    desc: "Macluumaadkaaga waa qarsoodi oo ammaan ah.",
  },
];

const steps = [
  {
    icon: UserPlus,
    title: "Join & Register",
    desc: "Is diiwaangeli oo buuxi profile-kaaga.",
  },
  {
    icon: Search,
    title: "We Review",
    desc: "Waxaan hubinaa dhammaan macluumaadkaaga.",
  },
  {
    icon: Heart,
    title: "Get Matched",
    desc: "Waxaan kuu helnaa qofka ugu habboon.",
  },
  {
    icon: MessageCircleHeart,
    title: "Connect & Build",
    desc: "Bilow wada hadalka oo dhis xiriir.",
  },
];

const stats = [
  { value: "1,000+", label: "Serious Members", icon: User },
  { value: "100%", label: "Verified Profiles", icon: Shield },
  { value: "500+", label: "Successful Matches", icon: Heart },
  { value: "4.9/5", label: "Member Rating", icon: Star },
];

const stories = [
  {
    names: "Ayaan & Farhan",
    quote:
      "Alhamdulillah, waxaan ku helay lammaanaha noloshayda CALAF. Adeegga waa mid aad u wanaagsan.",
    image:
      "https://images.unsplash.com/photo-1522673603000-1dd8f1319273?w=200&h=200&fit=crop&crop=faces",
  },
  {
    names: "Halima & Yusuf",
    quote:
      "CALAF waxay naga caawisay inaan helno qof ku habboon diinta iyo dhaqankeena.",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&h=200&fit=crop&crop=faces",
  },
  {
    names: "Sahra & Ahmed",
    quote:
      "Adeeg xirfad leh oo ixtiraam leh. Waxaan ku talin lahaa qof kasta oo doonaya guur.",
    image:
      "https://images.unsplash.com/photo-1516589178581-6d7833a4d266?w=200&h=200&fit=crop&crop=faces",
  },
];

export function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[600px] flex items-center">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1516589178581-6d7833a4d266?w=1920&h=1080&fit=crop"
            alt="Couple looking at each other"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/70 to-navy/40 dark:from-black/90 dark:via-black/75 dark:to-black/50" />
        </div>

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
                Islamic Matchmaking Service
              </motion.span>

              <motion.h1
                variants={fadeUp}
                className="font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight"
              >
                Find Your Life Partner{" "}
                <span className="text-primary">With Trust & Respect</span>
              </motion.h1>

              <motion.p variants={fadeUp} className="mt-6 text-lg text-white/80 max-w-xl">
                We connect serious men and women for marriage based on Islamic values.
                Waxaan isku xirnaa rag iyo dumar dhab ah oo doonaya guur.
              </motion.p>

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
              <div className="glass rounded-2xl p-8 shadow-2xl max-w-md ml-auto">
                <Quote className="h-10 w-10 text-primary mb-4" />
                <p className="text-lg text-foreground italic leading-relaxed">
                  &ldquo;The right partner is not just about love, it&apos;s about building a
                  beautiful future together.&rdquo;
                </p>
                <p className="mt-4 text-sm text-muted-foreground">
                  — CALAF Member
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="relative -mt-16 z-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl bg-card border border-border shadow-xl p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-10 items-start">
              <div>
                <h2 className="text-2xl font-bold text-navy dark:text-white">
                  Start Your Journey Today
                </h2>
                <p className="mt-2 text-muted-foreground">One-time Registration Fee</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-primary">${REGISTRATION_PRICE}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  One Payment • Lifetime Access
                </p>
                <AuthRegisterCta
                  registerLabel={`Join Now – $${REGISTRATION_PRICE}`}
                  className="mt-6 w-full sm:w-auto text-base px-8"
                  size="lg"
                />
                <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>Secure Payments</span>
                  <span className="text-xs font-semibold tracking-wide">VISA</span>
                  <span className="text-xs font-semibold tracking-wide">MC</span>
                  <span className="text-xs font-semibold tracking-wide text-blue-600">PayPal</span>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-navy dark:text-white mb-6">
                  Why Pay ${REGISTRATION_PRICE}?
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
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Banner */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#128C7E] to-whatsapp p-8 lg:p-10">
            <div className="grid lg:grid-cols-[auto_1fr_auto] gap-6 items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
                <svg viewBox="0 0 24 24" className="h-10 w-10 fill-white" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">
                  Need Personal Advice?
                </h3>
                <p className="mt-1 text-white/90">
                  Talk to our relationship advisor on WhatsApp Call
                </p>
                <Link
                  href="/contact"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#128C7E] hover:bg-white/90 transition-colors"
                >
                  WhatsApp Call – ${WHATSAPP_CALL_PRICE}
                </Link>
              </div>

              <div className="hidden lg:block space-y-2 text-white/90 text-sm">
                {["1-on-1 Private Call", "Professional Guidance", "Confidential Support"].map(
                  (item) => (
                    <div key={item} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-white" />
                      {item}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/40">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="landing-section-title text-3xl font-bold font-serif">
            How CALAF Works
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
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-navy dark:bg-card">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="mx-auto h-8 w-8 text-gold mb-3" />
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="mt-1 text-sm text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section id="success-stories" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="landing-section-title text-3xl font-bold font-serif">
            Success Stories
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
                  <div className="relative h-16 w-16 overflow-hidden rounded-full">
                    <Image
                      src={story.image}
                      alt={story.names}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                      ))}
                    </div>
                    <p className="mt-1 text-sm font-semibold">{story.names}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground italic leading-relaxed">
                  &ldquo;{story.quote}&rdquo;
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-muted/40">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { icon: Lock, label: "Your Privacy is Our Priority" },
              { icon: Landmark, label: "Islamic Values & Respect" },
              { icon: Shield, label: "Safe & Secure Platform" },
            ].map((item) => (
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
