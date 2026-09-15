/**
 * CENTRAL BUSINESS CONFIGURATION
 * ------------------------------------------------------------------
 * Replace every value marked as a PLACEHOLDER with the real business
 * information. Nothing here is invented — empty strings mean "not yet
 * supplied by the business" and the UI hides or labels those items.
 *
 * Values can also be supplied at build time through env variables
 * (see .env.example) so they can differ per deployment.
 */

const env = import.meta.env as Record<string, string | undefined>;

import heroSouthIndian from "@/assets/hero-south-indian.jpg";
import functionSouthIndian from "@/assets/function-south-indian.jpg";
import weddingSouthIndian from "@/assets/wedding-south-indian.jpg";
import dessertsImage from "@/assets/desserts.jpg";

export type BusinessInfo = {
  name: string;
  tagline: string;
  /** PLACEHOLDER — e.g. "+91 9XXXXXXXXX" */
  phone: string;
  /** PLACEHOLDER — digits only with country code, e.g. "919XXXXXXXXX" */
  whatsapp: string;
  /** PLACEHOLDER */
  email: string;
  /** PLACEHOLDER */
  addressLines: string[];
  /** PLACEHOLDER — Google Maps share/directions link */
  googleMapsUrl: string;
  /** PLACEHOLDER — Google Maps embed src URL */
  googleMapsEmbedUrl: string;
  /** PLACEHOLDER — e.g. "Mon–Sun, 9:00 AM – 8:00 PM" (leave empty if unknown) */
  businessHours: string;
  instagram: string;
  facebook: string;
  siteUrl: string;
};

export const business: BusinessInfo = {
  name: "Brinda Caterings",
  tagline: "Authentic flavours. Timeless traditions.",
  phone: env["VITE_BUSINESS_PHONE"] ?? "+91 99424 98402",
  whatsapp: env["VITE_WHATSAPP_NUMBER"] ?? "+91 90877 77047",
  email: env["VITE_BUSINESS_EMAIL"] ?? "brindacaterers@gmail.com",
  addressLines: (env["VITE_BUSINESS_ADDRESS"] ?? "No 9/82 Arani x road, Arani road | Near Muncipality water tank | Cheyyar - 604407")
    .split("|")
    .map((line) => line.trim())
    .filter(Boolean),
  googleMapsUrl: env["VITE_GOOGLE_MAPS_URL"] ?? "https://maps.app.goo.gl/9GqF1qVwZtGfL2uC8",
  googleMapsEmbedUrl: env["VITE_GOOGLE_MAPS_EMBED_URL"] ?? "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3892.7624703661827!2d79.53797190979454!3d12.66357318757257!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a52d7634ef07845%3A0x17940202e31aec01!2sBrinda%20Caterers!5e0!3m2!1sen!2sin!4v1788862457568!5m2!1sen!2sin",
  businessHours: env["VITE_BUSINESS_HOURS"] ?? "Open 24 Hours",
  instagram: env["VITE_INSTAGRAM_URL"] ?? "",
  facebook: env["VITE_FACEBOOK_URL"] ?? "",
  siteUrl: env["VITE_SITE_URL"] ?? "",
};

export const hero = {
  eyebrow: "Brinda Caterings",
  title: ["Authentic Flavours.", "Timeless Traditions."],
  subtitle:
    "Traditional South Indian catering crafted for weddings, celebrations, family functions and special occasions.",
  primaryCta: { label: "Book a Free Consultation", to: "/contact" as const },
};

export const cateringHighlights = [
  {
    title: "Weddings",
    image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/Highlightswedding.png?alt=media",
    description: "Traditional feasts scaled for your celebration.",
  },
  {
    title: "Family Celebrations",
    image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/Highlightsfamily.png?alt=media",
    description: "Intimate catering for milestones and gatherings.",
  },
  {
    title: "Corporate Events",
    image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/highlightscorporate.png?alt=media",
    description: "Professional service for meetings and functions.",
  },
  {
    title: "Special Occasions",
    image: "https://firebasestorage.googleapis.com/v0/b/brindhacaterings.firebasestorage.app/o/highlightscustom.png?alt=media",
    description: "Customised menus for unique occasions.",
  },
];

export const foodHighlights = [
  {
    name: "Traditional Vegetarian Feast",
    image: heroSouthIndian,
  },
  {
    name: "Chicken & Mutton",
    image: functionSouthIndian,
  },
  {
    name: "Premium Seafood Curries",
    image: weddingSouthIndian,
  },
  {
    name: "Snacks & Sweets",
    image: dessertsImage,
  },
];

export const cateringExperience = [
  {
    step: "01",
    title: "Preparation",
    description: "Fresh ingredients prepared with traditional, time-honoured techniques.",
  },
  {
    step: "02",
    title: "Presentation",
    description: "Carefully considered setups that suit the tone of your event.",
  },
  {
    step: "03",
    title: "Serving",
    description: "Warm, professional hospitality for a seamless guest experience.",
  },
  {
    step: "04",
    title: "Celebration",
    description: "Calm execution so you can focus entirely on your guests.",
  },
];

export const celebrationMoments = [
  {
    title: "Wedding",
    image: "/src/assets/wedding-south-indian.jpg",
  },
  {
    title: "Reception",
    image: "/src/assets/function-south-indian.jpg",
  },
  {
    title: "Family Function",
    image: "/src/assets/hero-south-indian.jpg",
  },
  {
    title: "Corporate Event",
    image: "/src/assets/wedding-south-indian.jpg",
  },
];

export const aboutPageData = {
  ourStory: {
    intro: "Brinda Caterings was founded on a simple principle: to bring authentic South Indian hospitality to every celebration.",
    background: "What began as a humble kitchen fueled by a passion for traditional recipes has grown into a trusted name in catering. We started with a commitment to preserving the authentic flavours of our heritage, hand-pounding our own spices and refusing to compromise on the quality of our ingredients. Word of our dedication to taste and hygiene quickly spread, turning small family gatherings into our first grand wedding feasts.",
    journey: "Over the years, we have had the privilege of catering to countless weddings, corporate events, and intimate family milestones. While our scale has grown to serve thousands, our core philosophy remains completely unchanged. Every dish we serve is still a labour of love, crafted to evoke the warmth of a home-cooked meal and designed to make your most treasured moments unforgettable."
  },
  ourPhilosophy: [
    {
      title: "Taste",
      description: "Consistent, authentic flavours that honour traditional South Indian recipes."
    },
    {
      title: "Ingredients",
      description: "Sourcing high-quality, fresh ingredients for every dish we prepare."
    },
    {
      title: "Traditional Cooking",
      description: "Employing time-honoured techniques to preserve the integrity of the cuisine."
    },
    {
      title: "Fresh Preparation",
      description: "Cooking meals close to service time to ensure maximum freshness and quality."
    },
    {
      title: "Hygiene",
      description: "Maintaining strict cleanliness standards from kitchen preparation to final service."
    },
    {
      title: "Hospitality",
      description: "Serving every guest with the warmth, care, and attention they deserve."
    }
  ],
  ourExpertise: [
    {
      title: "Catering Experience",
      description: "Years of experience catering to events of all scales, from intimate gatherings to massive celebrations."
    },
    {
      title: "Event Handling",
      description: "Organised logistics and calm execution to ensure your event runs seamlessly."
    },
    {
      title: "Food Preparation",
      description: "Equipped to handle large-scale cooking while maintaining homemade quality and taste."
    },
    {
      title: "Service Standards",
      description: "Professional, punctual, and courteous serving staff dedicated to guest satisfaction."
    }
  ],
  ourValues: [
    "Authenticity",
    "Quality",
    "Care",
    "Hospitality",
    "Reliability"
  ],
  whatWeBelieve: "Great food is the heart of every memorable celebration."
};
