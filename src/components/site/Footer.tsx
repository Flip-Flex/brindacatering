import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { business } from "@/data/business";
import { mailLink, telLink, whatsAppLink } from "@/lib/whatsapp";
import { CTALink } from "./CTAButton";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/menu", label: "Menu" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
] as const;

export function Footer() {
  const wa = whatsAppLink();
  const tel = telLink();
  const mail = mailLink();
  const { settings } = useSiteSettings();

  const visibleNav = nav.filter(item => 
    item.to !== "/gallery" || settings.isGalleryEnabled
  );

  return (
    <footer className="bg-ink text-primary-foreground border-t border-primary-foreground/10">
      <div className="mx-auto max-w-[1600px] px-5 py-24 sm:px-8 lg:px-12">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-8 xl:gap-12">
          
          <div className="lg:col-span-4">
            <p className="font-display text-4xl leading-tight">Brinda</p>
            <p className="eyebrow mt-3 text-accent tracking-[0.2em]">Catering Services</p>
            <p className="mt-8 max-w-sm text-sm leading-relaxed text-primary-foreground/50">
              Professional catering for weddings, celebrations, corporate events and special
              occasions.
            </p>
          </div>

          <nav aria-label="Footer" className="lg:col-span-2">
            <h2 className="eyebrow text-primary-foreground/50 tracking-[0.2em]">Navigate</h2>
            <ul className="mt-8 space-y-4 text-sm">
              {visibleNav.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-primary-foreground/50 transition-colors hover:text-accent"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <h2 className="eyebrow text-primary-foreground/50 tracking-[0.2em]">Contact</h2>
            <ul className="mt-8 space-y-5 text-sm text-primary-foreground/50">
              <li className="flex items-start gap-4">
                <Phone aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {tel ? (
                  <a href={tel} className="hover:text-accent transition-colors">
                    {business.phone}
                  </a>
                ) : (
                  <span className="text-primary-foreground/50">Phone number to be added</span>
                )}
              </li>
              <li className="flex items-start gap-4">
                <MessageCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {wa ? (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent transition-colors"
                  >
                    {business.phone}
                  </a>
                ) : (
                  <span className="text-primary-foreground/50">WhatsApp number to be added</span>
                )}
              </li>
              <li className="flex items-start gap-4">
                <Mail aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {mail ? (
                  <a href={mail} className="hover:text-accent transition-colors">
                    {business.email}
                  </a>
                ) : (
                  <span className="text-primary-foreground/50">Email to be added</span>
                )}
              </li>
              <li className="flex items-start gap-4">
                <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {business.addressLines.length ? (
                  <span className="leading-relaxed">
                    {business.addressLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="text-primary-foreground/50">Address to be added</span>
                )}
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h2 className="eyebrow text-primary-foreground/50 tracking-[0.2em]">Plan your event</h2>
            <CTALink to="/contact" variant="gold" className="mt-8 w-max">
              Get a Quote
            </CTALink>
            {(business.instagram || business.facebook) && (
              <div className="mt-10 flex gap-4">
                {business.instagram ? (
                  <a
                    href={business.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-primary-foreground/20 text-primary-foreground/50 transition-colors hover:border-accent hover:text-accent"
                  >
                    <Instagram className="h-4 w-4" aria-hidden="true" />
                  </a>
                ) : null}
                {business.facebook ? (
                  <a
                    href={business.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-primary-foreground/20 text-primary-foreground/50 transition-colors hover:border-accent hover:text-accent"
                  >
                    <Facebook className="h-4 w-4" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-primary-foreground/10 pt-8 text-xs text-primary-foreground/50 sm:flex-row sm:items-center sm:justify-between tracking-wide">
          <p>
            © {new Date().getFullYear()} {business.name}. All rights reserved.
          </p>
          <p>Website content and contact details are configurable.</p>
        </div>
      </div>
    </footer>
  );
}
