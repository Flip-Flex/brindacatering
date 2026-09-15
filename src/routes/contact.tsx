import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { z } from "zod";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { MapSection } from "@/components/site/MapSection";
import { business } from "@/data/business";
import { mailLink, telLink, whatsAppLink } from "@/lib/whatsapp";
import functionImage from "@/assets/function-south-indian.jpg";

const searchSchema = z.object({
  service: z.string().max(60).optional(),
});

export const Route = createFileRoute("/contact")({
  component: Contact,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Contact Brinda Catering | Cheyyar Event Catering" },
      {
        name: "description",
        content:
          "Contact Brinda Catering for a catering quote. Share your event type, date, guest count and location and we'll respond with the next steps.",
      },
      {
        property: "og:title",
        content: "Contact Brinda Catering | Cheyyar Event Catering",
      },
      {
        property: "og:description",
        content:
          "Send a catering enquiry with your event details, or reach us by phone and WhatsApp.",
      },
      { property: "og:url", content: "/contact" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
});

function Contact() {
  const { service } = Route.useSearch();
  const wa = whatsAppLink({ service });
  const tel = telLink();
  const mail = mailLink();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "name": "Contact Brinda Catering",
            "description": "Contact us for authentic South Indian catering quotes.",
            "url": "https://brindacaterers.com/contact",
            "mainEntity": {
              "@type": "LocalBusiness",
              "name": business.name,
              "telephone": business.phone,
              "email": business.email,
              "address": {
                "@type": "PostalAddress",
                "streetAddress": business.addressLines.join(", "),
                "addressLocality": "Cheyyar",
                "addressRegion": "TN",
                "postalCode": "604407",
                "addressCountry": "IN"
              }
            }
          })
        }}
      />
      <PageHero
        eyebrow="Contact"
        title="Let's Plan Your Celebration"
        intro="Whether you're planning an intimate gathering or a grand wedding, our team is ready to shape the perfect menu for your event."
        image={functionImage}
        alt="South Indian catering team serving guests at a function"
      />

      <section className="bg-background">
        <div className="mx-auto max-w-[1600px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <Reveal>
            <div className="grid gap-14 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20 xl:gap-28">
              <div className="self-start lg:sticky lg:top-28">
                <p className="eyebrow text-primary">Start a conversation</p>
                <h2 className="mt-5 max-w-xl font-display text-4xl leading-[1.08] sm:text-5xl">
                  Thoughtful catering begins with the details.
                </h2>
                <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Tell us what you are celebrating, and our team will help shape a menu that feels generous,
                  personal, and perfectly suited to the occasion.
                </p>

                <div className="mt-9 flex flex-wrap gap-3">
                  {tel ? (
                    <a href={tel} className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                      <Phone className="h-4 w-4" aria-hidden="true" />
                      Call us
                    </a>
                  ) : null}
                  {wa ? (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-sm border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary">
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      WhatsApp
                    </a>
                  ) : null}
                  {mail ? (
                    <a href={mail} className="inline-flex items-center gap-2 rounded-sm border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary">
                      <Mail className="h-4 w-4" aria-hidden="true" />
                      Email us
                    </a>
                  ) : null}
                </div>

                <div className="mt-12 border-y border-border/70 py-7">
                  <div className="flex gap-4">
                    <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-foreground">A smoother first conversation</p>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        Event date, guest count, location, and menu preferences are the most useful place to begin.
                      </p>
                    </div>
                  </div>
                  <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-center gap-3"><Check className="h-4 w-4 text-primary" aria-hidden="true" />Menu and service guidance</li>
                    <li className="flex items-center gap-3"><Check className="h-4 w-4 text-primary" aria-hidden="true" />A quote tailored to your event</li>
                  </ul>
                </div>
              </div>

              <div>
                <div className="mb-9 border-b border-border/70 pb-7">
                  <p className="eyebrow text-primary">Event enquiry</p>
                  <h2 className="mt-4 font-display text-3xl sm:text-4xl">Tell us about your celebration</h2>
                  <p className="mt-3 max-w-2xl text-muted-foreground">
                    Share the initial details and we will follow up with the right menu, service approach, and next steps.
                  </p>
                </div>
                <EnquiryForm {...(service ? { defaultService: service } : {})} />
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="mt-20 border-t border-border/70 lg:mt-28">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4">
                <ContactDetail icon={<Phone className="h-5 w-5" />} title="Call or message">
                  {tel ? <a href={tel} className="transition-colors hover:text-primary">{business.phone}</a> : <Placeholder text="Phone number to be added" />}
                  {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-2 block text-sm text-muted-foreground transition-colors hover:text-primary">Message us on WhatsApp</a> : null}
                </ContactDetail>

                <ContactDetail icon={<Mail className="h-5 w-5" />} title="Email & socials">
                  {mail ? <a href={mail} className="break-all transition-colors hover:text-primary">{business.email}</a> : <Placeholder text="Email address to be added" />}
                  <div className="mt-4 flex items-center gap-4">
                    {business.instagram ? <a href={business.instagram} className="text-muted-foreground transition-colors hover:text-primary" aria-label="Instagram"><Instagram className="h-5 w-5" /></a> : null}
                    {business.facebook ? <a href={business.facebook} className="text-muted-foreground transition-colors hover:text-primary" aria-label="Facebook"><Facebook className="h-5 w-5" /></a> : null}
                  </div>
                </ContactDetail>

                <ContactDetail icon={<MapPin className="h-5 w-5" />} title="Address">
                  {business.addressLines.length ? <span className="block text-sm leading-relaxed text-muted-foreground">{business.addressLines.map((line) => <span key={line} className="block">{line}</span>)}</span> : <Placeholder text="Address to be added" />}
                </ContactDetail>

                <ContactDetail icon={<Clock className="h-5 w-5" />} title="Business hours">
                  {business.businessHours ? <span className="text-sm leading-relaxed text-muted-foreground">{business.businessHours}</span> : <Placeholder text="Business hours to be added" />}
                </ContactDetail>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {wa ? (
        <section className="bg-primary/5 py-24">
          <div className="mx-auto max-w-[1600px] px-5 text-center sm:px-8 lg:px-12">
            <Reveal>
              <p className="eyebrow text-primary">Quick response</p>
              <h2 className="font-display text-3xl sm:text-4xl">Prefer WhatsApp?</h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                We are highly responsive on chat. Send us a message directly from your phone to start planning your menu.
              </p>
              <a 
                href={wa} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-sm bg-primary px-8 py-4 text-sm font-medium tracking-[0.1em] text-primary-foreground uppercase transition-all hover:bg-primary/90"
              >
                Chat on WhatsApp
                <ArrowRight className="h-4 w-4" />
              </a>
            </Reveal>
          </div>
        </section>
      ) : null}

      <MapSection />
    </>
  );
}

function ContactDetail({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border/70 px-0 py-8 sm:border-r sm:px-7 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0">
      <div className="flex items-center gap-3 text-primary">
        {icon}
        <h3 className="eyebrow text-muted-foreground">{title}</h3>
      </div>
      <div className="mt-5 text-sm text-foreground">{children}</div>
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return <span className="text-sm text-muted-foreground">{text}</span>;
}
