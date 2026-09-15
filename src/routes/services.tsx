import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { CTAAnchor, CTALink } from "@/components/site/CTAButton";
import { FinalCTA } from "@/components/site/FinalCTA";
import { Service } from "@/data/services";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { whatsAppLink } from "@/lib/whatsapp";
import functionImage from "@/assets/function-south-indian.jpg";

export const Route = createFileRoute("/services")({
  component: Services,
  head: () => ({
    meta: [
      { title: "Catering Services — Brinda Caterings | Cheyyar" },
      {
        name: "description",
        content:
          "Authentic South Indian catering for weddings, family functions, celebrations, corporate events and custom occasions.",
      },
      {
        property: "og:title",
        content: "Catering Services — Brinda Caterings | Cheyyar",
      },
      {
        property: "og:description",
        content:
          "South Indian wedding, function, corporate and custom catering planned around your occasion.",
      },
      { property: "og:url", content: "/services" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
  }),
});

function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    const fetchServices = async () => {
      if (!db) return;
      try {
        const q = query(collection(db, 'services'), orderBy('order'));
        const snapshot = await getDocs(q);
        const dbServices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Service);
        setServices(dbServices);
      } catch (err) {
        console.error("Failed to load services", err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Catering for Every Occasion"
        intro="From intimate family gatherings to grand wedding celebrations, we tailor our food and service to perfectly match the scale and style of your event."
        image={functionImage}
        alt="South Indian function catering with banana-leaf service and brass vessels"
      />

      <div className="bg-background min-h-[50vh]">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">Loading services...</div>
        ) : (
          services.map((service, index) => {
            const wa = whatsAppLink({ service: service.title });
            return (
              <section
                key={service.id}
                id={service.slug}
                aria-labelledby={`${service.slug}-title`}
                className={index % 2 === 1 ? "bg-secondary/40 scroll-mt-24" : "scroll-mt-24"}
              >
                <div className="mx-auto max-w-[1600px] px-5 py-24 sm:px-8 lg:px-12">
                  <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                    <Reveal
                      className={`overflow-hidden rounded-sm bg-muted ${index % 2 === 1 ? "lg:order-2" : ""}`}
                    >
                      <img
                        src={
                          service.image.startsWith('/src/assets/') 
                            ? (import.meta.glob('/src/assets/*.{jpg,png,jpeg,webp}', { eager: true, import: 'default' }) as Record<string, string>)[service.image] || service.image
                            : service.image
                        } 
                        alt={service.alt || service.title}
                        loading="lazy"
                        decoding="async"
                        width={1280}
                        height={960}
                        className="aspect-[4/3] w-full object-cover"
                      />
                    </Reveal>
                    <Reveal delay={80}>
                      <p className="eyebrow text-primary">0{index + 1}</p>
                      <h2
                        id={`${service.slug}-title`}
                        className="mt-3 font-display text-4xl leading-tight sm:text-5xl"
                      >
                        {service.title}
                      </h2>
                      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                        {service.description}
                      </p>

                      <div className="mt-8 grid gap-8 sm:grid-cols-2">
                        <div>
                          <h3 className="eyebrow text-muted-foreground">Suitable for</h3>
                          <ul className="mt-4 flex flex-wrap gap-2">
                            {service.suitableFor?.map((item) => (
                              <li
                                key={item}
                                className="rounded-sm border border-border px-3 py-1.5 text-xs tracking-wide text-muted-foreground"
                              >
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h3 className="eyebrow text-muted-foreground">Key highlights</h3>
                          <ul className="mt-4 space-y-3">
                            {service.highlights?.map((item) => (
                              <li key={item} className="flex items-start gap-3 text-sm">
                                <Check
                                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                                  aria-hidden="true"
                                />
                                <span className="text-muted-foreground">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                        <CTALink to="/contact" search={{ service: service.title } as never}>
                          Enquire About This Service
                        </CTALink>
                        {wa ? (
                          <CTAAnchor
                            href={wa}
                            target="_blank"
                            variant="outline"
                            className="text-foreground"
                          >
                            Chat on WhatsApp
                          </CTAAnchor>
                        ) : null}
                      </div>
                    </Reveal>
                  </div>
                </div>
              </section>
            );
          })
        )}
      </div>

      <FinalCTA />
    </>
  );
}
