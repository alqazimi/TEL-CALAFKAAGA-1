export const APP_NAME = "Hel Calafkaaga";
/** Full brand / business name — used for Google site name & Organization schema. */
export const SITE_BRAND_NAME = "Hel Calafkaaga";
export const PRODUCTION_SITE_URL = "https://helcalafkaaga.com";
export const APP_TAGLINE = "Find Your Perfect Match";
export const APP_DESCRIPTION =
  "We connect serious men and women for marriage based on Islamic values, trust, and respect.";
export const BRAND_PINK = "#E91E63";
export const BRAND_NAVY = "#0B132B";
export const WHATSAPP_GREEN = "#25D366";
export const WHATSAPP_NUMBER = "254793692710";
export const WHATSAPP_DISPLAY = "+254 793 692710";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
export const SUPPORT_EMAIL = "hello@helcalafkaaga.com";
export const REGISTRATION_PRICE = 10;
export const PERSONAL_SUPPORT_PRICE = 20;
export const PREMIUM_UPGRADE_PRICE = PERSONAL_SUPPORT_PRICE - REGISTRATION_PRICE;
export const MAX_PROFILE_PHOTOS = 5;
/** @deprecated Use PERSONAL_SUPPORT_PRICE */
export const WHATSAPP_CALL_PRICE = PERSONAL_SUPPORT_PRICE;
export const MIN_COMPATIBILITY_SCORE = 70;

export const GENDERS = ["male", "female"] as const;
export type Gender = (typeof GENDERS)[number];

export const HEIGHTS = [
  150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 200,
] as const;

export const WEIGHTS = [
  45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100,
] as const;

export const AGE_OPTIONS = Array.from({ length: 43 }, (_, i) => String(18 + i));
export const HEIGHT_OPTIONS = [...HEIGHTS.map((h) => String(h)), "200+"];
export const WEIGHT_OPTIONS = [...WEIGHTS.map((w) => String(w)), "100+"];

export const RELIGIOUS_LEVELS = [
  "Very Practicing",
  "Practicing",
  "Moderate",
  "Less Practicing",
] as const;

export const PRAYER_FREQUENCY = [
  "Always",
  "Most of the time",
  "Sometimes",
  "Rarely",
] as const;

export const SPOUSE_PRAYER_IMPORTANCE = [
  "Very important",
  "Preferred",
  "No preference",
] as const;

export const CHILDREN_COUNT = ["1", "2", "3", "4", "5+"] as const;

export const EDUCATION_LEVELS = [
  "High School",
  "Diploma",
  "Bachelor",
  "Master",
  "PhD",
  "Other",
] as const;

export const OCCUPATIONS = [
  "Full Time",
  "Part Time",
  "Business Owner",
  "Student",
  "Unemployed",
  "Retired",
] as const;

export const MARITAL_STATUS = [
  "Never married",
  "Divorced",
  "Widowed",
] as const;

export const YES_NO_DEPENDS = ["Yes", "No", "Depends"] as const;
export const YES_NO_MAYBE = ["Yes", "No", "Maybe"] as const;
export const YES_NO = ["Yes", "No"] as const;

export const FREQUENCY = ["Never", "Sometimes", "Yes"] as const;
export const EXERCISE = ["Daily", "Weekly", "Rarely", "Never"] as const;

export const MARRIAGE_TIMELINE = [
  "Within 3 months",
  "Within 6 months",
  "Within 1 year",
  "No timeline",
] as const;

export const LOVE_LANGUAGES = [
  "Words of Affirmation",
  "Acts of Service",
  "Receiving Gifts",
  "Quality Time",
] as const;

export const WANT_CHILDREN = [
  "Yes",
  "No",
  "Maybe",
  "Already have and open to more",
] as const;

export const FAMILY_INVOLVEMENT = ["Yes", "No", "Somewhat"] as const;

export const LIVING_SITUATION = [
  "Same city",
  "Same country",
  "Open to abroad",
  "With family",
  "Own home",
] as const;

export const BEARD_PREFERENCE = [
  "No preference",
  "Beard preferred",
  "Beard required",
  "No beard preferred",
] as const;

export const HIJAB_LEVEL_PREFERENCE = [
  "No preference",
  "Hijab preferred",
  "Niqab preferred",
  "Hijab or niqab preferred",
] as const;

export const POLYGYNY_OPENNESS = ["Yes", "No", "Maybe"] as const;

export const LANGUAGES_SPOKEN = [
  "Somali",
  "English",
  "Arabic",
  "Swahili",
  "French",
  "Dutch",
  "Swedish",
  "Norwegian",
  "German",
  "Other",
] as const;

/** Countries where citizenship/visa status is usually not relevant. */
export const CITIZENSHIP_NOT_REQUIRED_COUNTRIES = [
  "Somalia",
  "Djibouti",
  "Ethiopia",
  "Kenya",
] as const;

export const CITIZENSHIP_STATUS = [
  "Citizen of country I live in",
  "Permanent resident",
  "Temporary visa / student / work",
  "Seeking visa / sponsorship needed",
  "Prefer not to say",
] as const;

export const FINANCIAL_READINESS = [
  "Ready to support a family",
  "We should both work",
  "Still building financially",
  "Prefer not to say",
] as const;

export const MAX_DISTANCE = [
  "Same City",
  "Same Country",
  "Worldwide",
] as const;

export const QUALITIES = [
  "Religious",
  "Honest",
  "Kind",
  "Patient",
  "Funny",
  "Calm",
  "Romantic",
  "Loyal",
  "Hardworking",
  "Family Oriented",
  "Financially Responsible",
  "Educated",
  "Good Communication",
  "Respectful",
  "Supportive",
  "Confident",
  "Ambitious",
  "Generous",
] as const;

export const HOBBIES = [
  "Reading",
  "Cooking",
  "Travel",
  "Gym",
  "Football",
  "Technology",
  "Business",
  "Nature",
  "Gaming",
  "Photography",
  "Islamic Studies",
  "Volunteering",
  "Other",
] as const;

export { ALL_COUNTRIES as COUNTRIES } from "./countries";

export const CITIES: Record<string, string[]> = {
  "United States": ["New York", "Los Angeles", "Chicago", "Houston", "Dallas", "Miami", "Seattle", "Boston"],
  "United Kingdom": ["London", "Manchester", "Birmingham", "Leeds", "Glasgow", "Edinburgh"],
  "Canada": ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
  "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
  "Germany": ["Berlin", "Munich", "Frankfurt", "Hamburg", "Cologne"],
  "France": ["Paris", "Lyon", "Marseille", "Toulouse", "Nice"],
  "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"],
  "Saudi Arabia": ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam"],
  "Malaysia": ["Kuala Lumpur", "Penang", "Johor Bahru", "Ipoh"],
  "Turkey": ["Istanbul", "Ankara", "Izmir", "Bursa"],
  "Pakistan": ["Karachi", "Lahore", "Islamabad", "Rawalpindi"],
  "Egypt": ["Cairo", "Alexandria", "Giza"],
  "Morocco": ["Casablanca", "Rabat", "Marrakech", "Fes"],
};

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/#success-stories", label: "Success Stories" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

/** Single footer menu — all site links in one list (shared source of truth). */
export const FOOTER_MENU_LINKS = [
  ...NAV_LINKS,
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
] as const;

export type AppNavIcon =
  | "LayoutDashboard"
  | "User"
  | "ClipboardList"
  | "Heart"
  | "MessageCircle"
  | "Bell";

/** App navigation — Muzz-style: Home, Matches, Messages, Profile (4 tabs). */
export function getAppNavLinks(profileComplete = true) {
  return [
    { href: "/dashboard", label: "Dashboard", mobileLabel: "Home", icon: "LayoutDashboard" as AppNavIcon, tab: true },
    { href: "/matches", label: "Matches", icon: "Heart" as AppNavIcon, tab: true, locked: true },
    { href: "/chat", label: "Messages", icon: "MessageCircle" as AppNavIcon, tab: true, locked: true },
    {
      href: profileComplete ? "/profile" : "/questionnaire",
      label: profileComplete ? "Profile" : "Complete profile",
      mobileLabel: profileComplete ? "Profile" : "Complete",
      icon: (profileComplete ? "User" : "ClipboardList") as AppNavIcon,
      tab: true,
    },
    { href: "/notifications", label: "Notifications", icon: "Bell" as AppNavIcon, tab: false },
  ] as const;
}

export const APP_NAV_LINKS = getAppNavLinks(true);
export const APP_MOBILE_TABS = APP_NAV_LINKS.filter((l) => l.tab);

export const FAQ_ITEMS = [
  {
    question: "Is Hel Calafkaaga halal?",
    answer:
      "Yes. Hel Calafkaaga is designed for Muslims seeking marriage in a respectful, halal manner. We prioritize privacy, family values, and Islamic principles.",
  },
  {
    question: "How does matching work?",
    answer:
      "Our compatibility algorithm analyzes religion, age, location, education, lifestyle, and personality traits to find your best matches above 70% compatibility.",
  },
  {
    question: "How much does Hel Calafkaaga cost?",
    answer:
      "Standard registration is a one-time $10 fee. For $20, you also get personal support from trained experts. Both plans unlock full access to matches and messaging.",
  },
  {
    question: "How is my data protected?",
    answer:
      "We use industry-standard encryption and never share your personal data with third parties. Your privacy is our priority.",
  },
  {
    question: "Can I delete my account?",
    answer:
      "Yes, you can delete your account at any time from your profile settings. All your data will be permanently removed.",
  },
  {
    question: "What is personal support?",
    answer:
      "The $20 premium plan includes confidential one-on-one guidance from trained advisors. After payment, message us on WhatsApp to get started.",
  },
] as const;
