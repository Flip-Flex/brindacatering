import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { FinalCTA } from "@/components/site/FinalCTA";
import { CinematicBreak } from "@/components/site/CinematicBreak";
import { aboutPageData } from "@/data/business";
import heroPoster from "@/assets/hero-south-indian.jpg";
import weddingImage from "@/assets/wedding-south-indian.jpg";
import functionImage from "@/assets/function-south-indian.jpg";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({
    meta: [
      { title: "About Brinda Caterings | Catering in Cheyyar" },
      {
        name: "description",
        content:
          "Learn about Brinda Caterings and our approach to authentic South Indian food, traditional hospitality and organised event service.",
      },
      { property: "og:title", content: "About Brinda Caterings | Catering in Cheyyar" },
      {
        property: "og:description",
        content:
          "Our catering experience, approach to quality and hygiene, and what to expect on your event day.",
      },
      { property: "og:url", content: "/about" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
});

function About() {
  return (
    <>
      {/* 01 — About Hero */}
      <PageHero
        eyebrow="Our Story"
        title="About Brinda Caterings"
        intro="Authentic South Indian catering with a focus on traditional flavours and seamless hospitality."
        image={heroPoster}
        alt="About Brinda Caterings"
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "name": "About Brinda Caterings",
            "description": aboutPageData.ourStory.intro,
            "url": "https://brindacaterers.com/about"
          })
        }}
      />

      {/* 02 — Our Story */}
      <section className="bg-background">
        <div className="mx-auto max-w-[1200px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <SectionHeading align="center" eyebrow="History" title="Our Story" />
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-5 flex justify-center md:justify-end">
              <Reveal>
                <img 
                  src="/assets/brindalogo.png" 
                  alt="Brinda Caterings Logo" 
                  className="view-transition-logo h-48 md:h-72 w-auto object-contain drop-shadow-xl" 
                />
              </Reveal>
            </div>
            
            <div className="md:col-span-7 space-y-8 text-justify text-lg leading-relaxed text-muted-foreground sm:text-xl pl-0 md:pl-8">
              <Reveal delay={100}>
                <p className="font-display text-2xl text-foreground text-left">
                  {aboutPageData.ourStory.intro}
                </p>
              </Reveal>
              <Reveal delay={200}>
                <p>{aboutPageData.ourStory.background}</p>
              </Reveal>
              <Reveal delay={300}>
                <p>{aboutPageData.ourStory.journey}</p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* 03 — Our Philosophy */}
      <section className="bg-secondary/20">
        <div className="mx-auto max-w-[1600px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <SectionHeading
            eyebrow="Core Principles"
            title="Our Philosophy"
            intro="The non-negotiables that define every dish we cook and every event we cater."
          />
          <ul className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {aboutPageData.ourPhilosophy.map((item, index) => (
              <Reveal 
                as="li" 
                key={item.title} 
                delay={index * 80}
                className="group relative overflow-hidden rounded-2xl bg-background p-8 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-xl border border-border/50"
              >
                <span className="absolute right-6 top-4 font-sans font-light text-7xl text-primary transition-colors duration-500 group-hover:text-accent select-none">
                  0{index + 1}
                </span>
                <div className="relative z-10">
                  <h3 className="font-display text-2xl text-foreground group-hover:text-primary transition-colors duration-500">{item.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* 04 — Our Expertise */}
      <section className="bg-background">
        <div className="mx-auto max-w-[1600px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24 items-center">
            <Reveal className="order-2 lg:order-1 overflow-hidden rounded-2xl shadow-lg border border-border/50">
              <img
                src={functionImage}
                alt="Expertise and service"
                className="aspect-[4/3] w-full object-cover"
              />
            </Reveal>
            <div className="order-1 lg:order-2">
              <SectionHeading eyebrow="Capabilities" title="Our Expertise" />
              <div className="mt-12 grid gap-10 sm:grid-cols-2">
                {aboutPageData.ourExpertise.map((item, index) => (
                  <Reveal key={item.title} delay={index * 100}>
                    <h3 className="font-display text-xl text-foreground">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 05 — Our Values */}
      <section className="bg-ink text-primary-foreground">
        <div className="mx-auto max-w-[1000px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32 text-center">
          <SectionHeading
            tone="inverse"
            align="center"
            eyebrow="What matters most"
            title="Our Values"
          />
          <ul className="mt-16 flex flex-wrap justify-center gap-4 sm:gap-6">
            {aboutPageData.ourValues.map((value, index) => (
              <Reveal as="li" key={value} delay={index * 100}>
                <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-6 py-3 text-lg font-medium text-accent transition-colors hover:bg-gold/20">
                  <Check className="h-5 w-5" />
                  {value}
                </span>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* 06 — What We Believe */}
      <CinematicBreak
        image={weddingImage}
        alt="Wedding feast"
        statement={aboutPageData.whatWeBelieve}
      />

      {/* 07 — About CTA */}
      <FinalCTA 
        title="Let's Create Something Memorable" 
        description="Get in touch to discuss your upcoming event. We'll handle the food, so you can focus on the celebration."
        primaryCtaLabel="Contact" 
      />
    </>
  );
}
