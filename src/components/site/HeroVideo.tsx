import { useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import heroPoster from "@/assets/hero-south-indian.jpg";
import heroFilm from "@/assets/hero-south-indian.mp4.asset.json";
import { hero } from "@/data/business";
import { CTAAnchor, CTALink } from "./CTAButton";
import { whatsAppLink } from "@/lib/whatsapp";

/**
 * Full-screen cinematic hero.
 * Drop the real film at /public/videos/hero-catering.mp4 (+ .webm).
 * Until then the poster image carries the section — no broken video UI.
 */
export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playVideo, setPlayVideo] = useState(false);
  const whatsapp = whatsAppLink({ service: "South Indian event catering" });

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData =
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData ??
      false;
    const smallScreen = window.matchMedia("(max-width: 640px)").matches;
    if (reduced || saveData || smallScreen) return;
    // Only attempt the video on capable devices, after first paint.
    const timer = window.setTimeout(() => setPlayVideo(true), 400);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-ink">
      <img
        src={heroPoster}
        alt="Wedding catering buffet with brass serving vessels lit by warm candlelight"
        width={1920}
        height={1088}
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {playVideo ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster={heroPoster}
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src={heroFilm.url} type="video/mp4" />
        </video>
      ) : null}

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_top,color-mix(in_oklab,var(--ink)_92%,transparent),color-mix(in_oklab,var(--ink)_45%,transparent)_45%,color-mix(in_oklab,var(--ink)_70%,transparent))]"
      />

      <div className="relative mx-auto w-full max-w-[1600px] px-5 pt-32 pb-20 sm:px-8 sm:pb-24 lg:px-12">
        <div className="max-w-3xl">
          <img 
            src="/assets/brindalogo.png" 
            alt="Brinda Catering" 
            className="h-32 md:h-48 lg:h-64 w-auto object-contain mb-8 drop-shadow-xl" 
          />
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <CTALink to={hero.primaryCta.to} variant="gold">
              {hero.primaryCta.label}
            </CTALink>
          </div>
        </div>
      </div>
    </section>
  );
}
