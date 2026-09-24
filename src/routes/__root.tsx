import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { business } from "@/data/business";
import { Toaster } from "sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 text-primary-foreground">
      <div className="max-w-md text-center">
        <p className="eyebrow text-accent">404</p>
        <h1 className="mt-6 font-display text-5xl leading-tight">
          Looks like this plate is empty.
        </h1>
        <p className="mt-4 text-sm text-primary-foreground/50">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-sm bg-gold px-7 py-3.5 text-sm font-medium uppercase tracking-[0.16em] text-accent-foreground transition-colors hover:bg-gold/90"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-sm bg-primary px-6 py-3 text-sm uppercase tracking-[0.16em] text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-sm border border-input bg-background px-6 py-3 text-sm uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-accent/20"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const routerState = useRouterState();
  
  useEffect(() => {
    window.scrollTo(0, 0);
    // Force scroll to top on initial load (browser refresh) after data might have rendered
    const t1 = setTimeout(() => window.scrollTo(0, 0), 100);
    const t2 = setTimeout(() => window.scrollTo(0, 0), 500);
    const t3 = setTimeout(() => window.scrollTo(0, 0), 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);
  const hideLayoutElements = routerState.location.pathname.startsWith('/admin') || routerState.location.pathname.startsWith('/customer') || routerState.location.pathname === '/login';

  return (
    <QueryClientProvider client={queryClient}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[70] focus:rounded-sm focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      {!hideLayoutElements && <Navbar />}
      <main id="main">
        <Outlet />
        
      </main>
      {!hideLayoutElements && <Footer />}
      {!hideLayoutElements && <WhatsAppButton />}
      
      {!hideLayoutElements && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FoodEstablishment",
              "name": business.name,
              "image": "https://brindacaterers.com/favicon.ico",
              "@id": "https://brindacaterers.com",
              "url": "https://brindacaterers.com",
              "telephone": business.phone,
              "address": {
                "@type": "PostalAddress",
                "streetAddress": business.addressLines.join(", "),
                "addressLocality": "Cheyyar",
                "addressRegion": "TN",
                "postalCode": "604407",
                "addressCountry": "IN"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 12.663573,
                "longitude": 79.537971
              },
              "servesCuisine": "South Indian"
            })
          }}
        />
      )}
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  );
}
