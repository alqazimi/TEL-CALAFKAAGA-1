"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useConvexAuth } from "convex/react";
import {
  Heart,
  Shield,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  Star,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const features = [
  {
    icon: Shield,
    title: "Halal & Private",
    description:
      "Built for Muslims seeking marriage with respect, privacy, and Islamic values at the core.",
  },
  {
    icon: Sparkles,
    title: "Smart Matching",
    description:
      "Our AI-powered algorithm analyzes compatibility across religion, lifestyle, and personality.",
  },
  {
    icon: Users,
    title: "Verified Profiles",
    description:
      "Every profile is reviewed to ensure authenticity and a safe community experience.",
  },
  {
    icon: MessageCircle,
    title: "Meaningful Connections",
    description:
      "Connect with matches who share your values, goals, and vision for marriage.",
  },
];

const steps = [
  { step: "01", title: "Create Profile", desc: "Sign up and complete your detailed questionnaire." },
  { step: "02", title: "Get Matched", desc: "Our algorithm finds compatible partners above 70%." },
  { step: "03", title: "Connect", desc: "Like profiles and chat when you both match." },
];

const stats = [
  { value: "10K+", label: "Active Users" },
  { value: "2.5K+", label: "Successful Matches" },
  { value: "94%", label: "Satisfaction Rate" },
  { value: "50+", label: "Countries" },
];

export default function HomePage() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative gradient-hero">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial="initial"
            animate="animate"
            variants={{ animate: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div variants={fadeUp} className="mb-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                <Star className="h-4 w-4" />
                Trusted by thousands of Muslims worldwide
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
            >
              Find your{" "}
              <span className="text-emerald-500">halal</span> life partner
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-6 text-lg text-gray-600 dark:text-gray-400 sm:text-xl"
            >
              {APP_TAGLINE}
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              {!isLoading && isAuthenticated ? (
                <Button size="lg" asChild className="w-full sm:w-auto text-base px-8">
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-5 w-5" />
                    Go to Dashboard
                  </Link>
                </Button>
              ) : (
                <Button size="lg" asChild className="w-full sm:w-auto text-base px-8">
                  <Link href="/register">
                    Start Your Journey
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto text-base px-8">
                <Link href="/how-it-works">How it Works</Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-20 grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="glass rounded-2xl p-6 text-center"
              >
                <div className="text-3xl font-bold text-emerald-600">{stat.value}</div>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why choose {APP_NAME}?
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              A modern platform designed with your values in mind.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 mb-4">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works preview */}
      <section className="py-24 bg-gray-50/50 dark:bg-gray-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Three simple steps
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center"
              >
                <div className="text-5xl font-bold text-emerald-100 dark:text-emerald-900 mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-8 py-16 sm:px-16 text-center">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZ2LTRoLTJ2NGg0djR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
            <Heart className="mx-auto h-12 w-12 text-white/80 mb-6" />
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to find your match?
            </h2>
            <p className="mt-4 text-lg text-emerald-100 max-w-xl mx-auto">
              Join thousands of Muslims who found their life partner through {APP_NAME}.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              {!isLoading && isAuthenticated ? (
                <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto">
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-5 w-5" />
                    Go to Dashboard
                  </Link>
                </Button>
              ) : (
                <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto">
                  <Link href="/register">Create Free Account</Link>
                </Button>
              )}
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-emerald-100 text-sm">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Free to browse
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Private & secure
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}