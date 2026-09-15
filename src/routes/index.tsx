import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, doc, onSnapshot } from "firebase/firestore";
import { HeroVideo } from "@/components/site/HeroVideo";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { CTALink } from "@/components/site/CTAButton";
import { CinematicBreak } from "@/components/site/CinematicBreak";
import { GalleryGrid } from "@/components/site/GalleryGrid";
import { FinalCTA } from "@/components/site/FinalCTA";
import { sortedGallery } from "@/data/gallery";
import { 
  aboutPageData, 
  cateringHighlights as initialHighlights, 
  foodHighlights, 
  cateringExperience, 
  celebrationMoments 
} from "@/data/business";
import feastImage from "@/assets/hero-south-indian.jpg";
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Loader2 } from "lucide-react";
export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      {
        title: "Brinda Caterings | Authentic South Indian Catering in Cheyyar & Beyond",
      },
      {
        name: "description",
        content:
          "Authentic South Indian vegetarian and non-vegetarian catering for weddings, family functions, celebrations and corporate events.",
      },
      {
        property: "og:title",
        content: "Brinda Caterings — Wedding & Event Catering",
      },
      {
        property: "og:description",
        content:
          "South Indian vegetarian and non-vegetarian food with traditional hospitality for weddings and functions.",
      },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

function Home() {
  const [highlights, setHighlights] = useState(initialHighlights);
  const [ourStoryImage, setOurStoryImage] = useState<string | null>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  
  const storyVideos = ["/assets/brindha.mp4", "/assets/brindha2.mp4"];
  
  const nextVideo = () => setActiveVideoIndex((prev) => (prev + 1) % storyVideos.length);
  const prevVideo = () => setActiveVideoIndex((prev) => (prev - 1 + storyVideos.length) % storyVideos.length);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fadeIntervalRef = useRef<number | NodeJS.Timeout | null>(null);

  const toggleMute = () => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current as any);
    if (videoRef.current) videoRef.current.volume = 1;
    setIsMuted(!isMuted);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry.isIntersecting && !isMuted && videoRef.current) {
          const video = videoRef.current;
          const fadeDuration = 800;
          const fadeSteps = 20;
          const stepTime = fadeDuration / fadeSteps;
          const volumeStep = video.volume / fadeSteps;

          if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current as any);
          
          fadeIntervalRef.current = setInterval(() => {
            if (video.volume > volumeStep) {
              video.volume -= volumeStep;
            } else {
              video.volume = 0;
              setIsMuted(true);
              if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current as any);
              setTimeout(() => {
                if (videoRef.current) videoRef.current.volume = 1;
              }, 100);
            }
          }, stepTime);
        }
      },
      { threshold: 0.1 }
    );

    if (videoContainerRef.current) {
      observer.observe(videoContainerRef.current);
    }

    return () => observer.disconnect();
  }, [isMuted]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('hide-whatsapp', { detail: !isMuted }));
    return () => {
      window.dispatchEvent(new CustomEvent('hide-whatsapp', { detail: false }));
    };
  }, [isMuted]);

  useEffect(() => {
    if (!db) return;
    const fetchHighlights = async () => {
      try {
        const q = query(collection(db!, 'cateringHighlights'), orderBy('order'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const dbHighlights = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // We cast and map to ensure we match the shape expected by the UI
          setHighlights(dbHighlights as any);
        }
      } catch (err) {
        console.error("Failed to load highlights", err);
      }
    };
    fetchHighlights();

    const unsubscribeStory = onSnapshot(doc(db, 'siteSettings', 'ourStoryImage'), (docSnap) => {
      if (docSnap.exists()) {
        setOurStoryImage(docSnap.data()?.['image']);
      } else {
        setOurStoryImage(null);
      }
    });

    return () => unsubscribeStory();
  }, []);

  return (
    <>
      {/* 01 — Hero */}
      <HeroVideo />

      {/* 02 — Brand Introduction (Responsive Video & Text) */}
      <section ref={videoContainerRef} className="flex flex-col md:block md:relative w-full bg-ink md:h-[80vh] md:min-h-[500px] md:max-h-[900px] group">
        
        {/* Video Container (Top on mobile, Absolute Background on desktop) */}
        <div className="relative w-full aspect-video md:h-full md:absolute md:inset-0 overflow-hidden @container">
          <video 
            ref={videoRef}
            key={storyVideos[activeVideoIndex]}
            src={storyVideos[activeVideoIndex]} 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100cqh] h-[100cqw] object-contain md:object-cover -rotate-90 transition-transform duration-[1200ms]"
            autoPlay 
            muted={isMuted}
            loop 
            playsInline 
            onWaiting={() => setIsVideoLoading(true)}
            onPlaying={() => setIsVideoLoading(false)}
            onCanPlay={() => setIsVideoLoading(false)}
          />
          
          {/* Loading Spinner */}
          {isVideoLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-sm pointer-events-none transition-opacity duration-300">
              <Loader2 className="h-10 w-10 animate-spin text-white/80" />
            </div>
          )}



          {/* Navigation Buttons (Simple Arrows) */}
          <div className="absolute inset-0 flex items-center justify-between px-2 sm:px-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-20 pointer-events-none">
            <button 
              onClick={prevVideo}
              className="p-2 text-white/70 hover:text-white transition-colors pointer-events-auto"
              aria-label="Previous video"
            >
              <ChevronLeft className="h-10 w-10 drop-shadow-md" />
            </button>
            <button 
              onClick={nextVideo}
              className="p-2 text-white/70 hover:text-white transition-colors pointer-events-auto"
              aria-label="Next video"
            >
              <ChevronRight className="h-10 w-10 drop-shadow-md" />
            </button>
          </div>

          {/* Mute Button */}
          <button 
            onClick={toggleMute}
            className="absolute top-6 right-6 z-30 p-2 text-white/80 hover:text-white transition-colors bg-black/20 backdrop-blur-sm rounded-full pointer-events-auto"
            aria-label={isMuted ? "Unmute video" : "Mute video"}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          
          {/* Dots indicator */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 z-20 pointer-events-none">
            {storyVideos.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-500 ${activeVideoIndex === idx ? 'w-8 bg-white' : 'w-2 bg-white/40'}`}
              />
            ))}
          </div>
        </div>


      </section>

      {/* 03 — Catering Highlights */}
      <section className="bg-secondary/20">
        <div className="mx-auto max-w-[1600px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <SectionHeading
            align="center"
            eyebrow="What we do"
            title="Catering Highlights"
            intro="Professional service shaped around the scale and traditions of your occasion."
          />
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((highlight: any, index: number) => (
              <Reveal
                as="article"
                key={highlight.title || highlight.id}
                delay={index * 100}
                className="group relative overflow-hidden rounded-2xl shadow-sm"
              >
                <div className="aspect-[3/4] w-full overflow-hidden">
                  <img
                    src={highlight.image}
                    alt={highlight.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent opacity-100 transition-opacity duration-500 group-hover:opacity-80" />
                </div>
                <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8 transition-transform duration-500 group-hover:-translate-y-2">
                  <h3 className="font-display text-2xl leading-tight text-primary-foreground">
                    {highlight.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-primary-foreground/50">
                    {highlight.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 04 — Food Highlights */}
      <section className="bg-background">
        <div className="mx-auto max-w-[1600px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <SectionHeading
            align="center"
            eyebrow="The food"
            title="Signature Dishes"
            intro="A glimpse into the authentic South Indian flavours we bring to your celebration."
          />
          <ul className="mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {foodHighlights.map((item, index) => (
              <Reveal as="li" key={item.name} delay={index * 80}>
                <div className="group overflow-hidden rounded-xl shadow-sm">
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    className="aspect-square w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.05]"
                  />
                </div>
                <h3 className="mt-6 text-center font-display text-xl text-foreground">{item.name}</h3>
              </Reveal>
            ))}
          </ul>
          <Reveal className="mt-16 text-center">
            <CTALink to="/menu">Explore Our Menu</CTALink>
          </Reveal>
        </div>
      </section>

      {/* 05 — Catering Experience */}
      <section className="bg-ink text-primary-foreground">
        <div className="mx-auto max-w-[1600px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <SectionHeading
            align="center"
            tone="inverse"
            eyebrow="The experience"
            title="How it comes together"
            intro="From our kitchen to your celebration, we ensure every detail is handled with care."
          />
          <div className="mt-24 mx-auto max-w-4xl flex flex-col">
            {cateringExperience.map((exp, index) => (
              <Reveal 
                key={exp.step}
                delay={index * 100}
                className="group flex flex-col sm:flex-row items-start gap-6 sm:gap-8 border-t border-border/20 py-12 transition-colors hover:border-gold/40"
              >
                <span className="font-sans font-light text-5xl sm:text-7xl text-primary-foreground/50 transition-colors group-hover:text-accent shrink-0">
                  {exp.step}
                </span>
                <div className="pt-2">
                  <h3 className="font-display text-3xl sm:text-4xl tracking-tight text-primary-foreground">{exp.title}</h3>
                  <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-primary-foreground/50">
                    {exp.description}
                  </p>
                </div>
              </Reveal>
            ))}
            <div className="border-t border-border/20" />
          </div>
        </div>
      </section>

      {/* 06 — Cinematic Feast */}
      <CinematicBreak
        image={feastImage}
        alt="Traditional South Indian feast served on a banana leaf with brass vessels"
        statement="Tradition Served With Care."
      />


      {/* 09 — Final CTA */}
      <FinalCTA />
    </>
  );
}
