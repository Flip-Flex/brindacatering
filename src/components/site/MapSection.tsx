import { MapPin } from "lucide-react";
import { business } from "@/data/business";
import { CTAAnchor } from "./CTAButton";

export function MapSection() {
  return (
    <section aria-labelledby="map-heading" className="bg-secondary/50">
      <div className="mx-auto max-w-[1600px] px-5 py-20 sm:px-8 lg:px-12">
        <h2 id="map-heading" className="font-display text-3xl sm:text-4xl">
          Find us
        </h2>
        <div className="mt-8 overflow-hidden rounded-sm border border-border bg-card">
          <div className="flex h-[320px] flex-col items-center justify-center gap-4 px-6 text-center bg-muted/20">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <MapPin className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>
            <p className="font-display text-2xl font-semibold tracking-tight text-foreground uppercase">Location Temporarily Unavailable</p>
            <p className="max-w-md text-base text-muted-foreground leading-relaxed">
              Please call our contact number to get the exact location details.
            </p>
            <CTAAnchor
              href={`tel:${business.phone}`}
              variant="default"
              className="mt-4"
            >
              Call {business.phone}
            </CTAAnchor>
          </div>
        </div>
      </div>
    </section>
  );
}
