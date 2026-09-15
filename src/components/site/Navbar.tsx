import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { business } from "@/data/business";
import { CTALink } from "./CTAButton";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/menu", label: "Menu" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const overlay = pathname === "/";
  const { settings } = useSiteSettings();

  const visibleLinks = links.filter(link =>
    link.to !== "/gallery" || settings.isGalleryEnabled
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const solid = scrolled || !overlay || open;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          solid ? "border-b border-border/60 bg-background/85 backdrop-blur-xl" : "bg-transparent",
        )}
      >
        <nav
          aria-label="Primary"
          className="relative mx-auto flex h-[4.5rem] max-w-[1600px] items-center justify-between px-5 sm:px-8 lg:px-12"
        >
          <Link
            to="/"
            className="flex items-center"
          >
            <span className={cn(
              "font-display font-bold text-xl tracking-widest uppercase transition-colors whitespace-pre",
              solid ? "text-primary" : "text-primary-foreground"
            )}>
              {"BRINDA CATERINGS"}
            </span>
          </Link>

          <ul className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden items-center gap-9 lg:flex">
            {visibleLinks.map((link) => {
              const active = link.to === "/" ? pathname === "/" : pathname.startsWith(link.to);
              return (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={cn(
                      "relative text-sm uppercase tracking-[0.14em] transition-colors",
                      solid ? "text-muted-foreground" : "text-primary-foreground/50",
                      "hover:text-primary",
                      solid ? "" : "hover:text-accent",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {link.label}
                    <span
                      className={cn(
                        "absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-300",
                        solid ? "bg-primary" : "bg-gold",
                        active && "scale-x-100",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3">
            <CTALink
              to="/login"
              variant={solid ? "primary" : "gold"}
              withArrow={false}
              className="hidden px-5 py-3 text-xs sm:inline-flex"
            >
              Sign In
            </CTALink>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-sm border transition-colors lg:hidden",
                solid
                  ? "border-border text-foreground"
                  : "border-ink-foreground/30 text-primary-foreground",
              )}
            >
              {open ? <Menu className="hidden" /> : null}
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </header>
      {open ? (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 top-[4.5rem] bottom-0 z-40 bg-ink/45 backdrop-blur-[2px] lg:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="ml-auto flex h-full w-full max-w-md flex-col overflow-y-auto bg-ink px-6 py-8 shadow-2xl sm:px-8"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="eyebrow text-accent">Explore Brinda</p>
            <ul className="mt-6 space-y-1">
              {visibleLinks.map((link) => {
                const active = link.to === "/" ? pathname === "/" : pathname.startsWith(link.to);

                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "block border-b border-ink-foreground/10 py-4 font-display text-3xl transition-colors",
                        active ? "text-accent" : "text-primary-foreground hover:text-accent",
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <CTALink to="/login" variant="gold" className="mt-8 w-full">
              Sign In
            </CTALink>

            {(business.instagram || business.facebook) && (
              <div className="mt-auto flex gap-6 pt-10 text-xs uppercase tracking-[0.16em] text-primary-foreground/50">
                {business.instagram ? (
                  <a href={business.instagram} rel="noopener noreferrer" target="_blank">
                    Instagram
                  </a>
                ) : null}
                {business.facebook ? (
                  <a href={business.facebook} rel="noopener noreferrer" target="_blank">
                    Facebook
                  </a>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
