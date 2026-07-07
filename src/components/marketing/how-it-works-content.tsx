import {
  UserPlus,
  ClipboardList,
  Heart,
  MessageCircle,
  Shield,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: UserPlus,
    title: "Register & Pay",
    description:
      `Create your account, complete your details, and pay the one-time $15 registration fee.`,
  },
  {
    icon: ClipboardList,
    title: "Complete the Questionnaire",
    description:
      "Answer our comprehensive questionnaire covering religion, education, lifestyle, and partner preferences.",
  },
  {
    icon: Heart,
    title: "Discover Matches",
    description:
      "Our compatibility algorithm finds your best matches above 70%. View scores and like the profiles that interest you.",
  },
  {
    icon: MessageCircle,
    title: "Connect & Chat",
    description:
      "When you both like each other, it's a match! Message your matches directly on the platform.",
  },
  {
    icon: Shield,
    title: "Meet with Confidence",
    description:
      "Take your time getting to know each other through our secure platform, with family involvement when you're ready.",
  },
];

export function HowItWorksContent() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {steps.map((step, i) => (
        <Card key={step.title} className="overflow-hidden">
          <CardContent className="p-6 flex gap-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
              <step.icon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-medium text-emerald-600 mb-1">
                Step {i + 1}
              </div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
