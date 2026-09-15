import { whatsAppLink } from "@/lib/whatsapp";
import { CTAAnchor, CTALink } from "./CTAButton";
import { Reveal } from "./Reveal";

type Props = {
  title?: string;
  description?: string;
  primaryCtaLabel?: string;
};

export function FinalCTA({
  title = "Planning Your Next Celebration?",
  description = "Tell us about your occasion and we'll help shape a South Indian menu and service plan around it.",
  primaryCtaLabel = "Book a Free Consultation",
}: Props = {}) {
  const wa = whatsAppLink();
  return (
    <section className="bg-ink text-primary-foreground">
      <div className="mx-auto max-w-[1600px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="eyebrow text-accent">Ready to start?</p>
          <h2 className="mt-6 font-display text-4xl md:text-5xl lg:text-7xl leading-[1.03]">
            {title}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-primary-foreground/50">
            {description}
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <CTALink to="/contact" variant="gold">
              {primaryCtaLabel}
            </CTALink>
            {wa ? (
              <CTAAnchor
                href={wa}
                target="_blank"
                variant="outline"
                className="text-primary-foreground"
              >
                WhatsApp Us
              </CTAAnchor>
            ) : null}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
