import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  budgetOptions,
  enquirySchema,
  eventTypeOptions,
  type EnquiryInput,
} from "@/lib/validation";
import { services } from "@/data/services";
import { CTAAnchor, CTAButton } from "./CTAButton";
import { whatsAppLink } from "@/lib/whatsapp";

type Status = { state: "idle" } | { state: "success" } | { state: "error"; message: string };

const fieldClass =
  "w-full rounded-sm border border-input bg-card px-4 py-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none";

const labelClass = "block text-xs uppercase tracking-[0.16em] text-muted-foreground";

export function EnquiryForm({ defaultService }: { defaultService?: string }) {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EnquiryInput>({
    resolver: zodResolver(enquirySchema),
    defaultValues: { service: defaultService ?? "", company: "" },
  });

  const wa = whatsAppLink({
    service: watch("service") || defaultService,
    eventType: watch("eventType"),
    eventDate: watch("eventDate"),
  });

  const onSubmit = async (values: EnquiryInput) => {
    setStatus({ state: "idle" });
    
    // Build the full WhatsApp url with all the form values
    const url = whatsAppLink(values);
    
    if (!url) {
      setStatus({
        state: "error",
        message: "WhatsApp number is not configured.",
      });
      return;
    }
    
    // Redirect to WhatsApp
    window.open(url, "_blank");
    
    // Optionally reset form and show success
    reset({ service: defaultService ?? "", company: "" });
    setStatus({ state: "success" });
  };

  if (status.state === "success") {
    return (
      <div className="rounded-sm border border-border bg-card p-10 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
        <h3 className="mt-5 font-display text-3xl">Enquiry received</h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          Thank you for getting in touch with Brinda Catering. We will review your event
          details and respond with the next steps.
        </p>
        <CTAButton
          variant="outline"
          className="mt-8 text-foreground"
          withArrow={false}
          onClick={() => setStatus({ state: "idle" })}
        >
          Send another enquiry
        </CTAButton>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="rounded-sm border border-border bg-card p-6 sm:p-9"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Name" required error={errors.name?.message}>
          <input
            {...register("name")}
            id="name"
            autoComplete="name"
            className={fieldClass}
            placeholder="Your full name"
            aria-invalid={Boolean(errors.name)}
          />
        </Field>

        <Field label="Phone" required error={errors.phone?.message} htmlFor="phone">
          <input
            {...register("phone")}
            id="phone"
            type="tel"
            autoComplete="tel"
            className={fieldClass}
            placeholder="Contact number"
            aria-invalid={Boolean(errors.phone)}
          />
        </Field>

        <Field label="Email" error={errors.email?.message} htmlFor="email">
          <input
            {...register("email")}
            id="email"
            type="email"
            autoComplete="email"
            className={fieldClass}
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Event type" required error={errors.eventType?.message} htmlFor="eventType">
          <select {...register("eventType")} id="eventType" className={fieldClass} defaultValue="">
            <option value="" disabled>
              Select event type
            </option>
            {eventTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Event date" error={errors.eventDate?.message} htmlFor="eventDate">
          <input {...register("eventDate")} id="eventDate" type="date" className={fieldClass} />
        </Field>

        <Field label="Number of guests" error={errors.guests?.message} htmlFor="guests">
          <input
            {...register("guests")}
            id="guests"
            type="number"
            min={1}
            className={fieldClass}
            placeholder="Approximate count"
          />
        </Field>

        <Field label="Location" error={errors.location?.message} htmlFor="location">
          <input
            {...register("location")}
            id="location"
            className={fieldClass}
            placeholder="Venue or area"
          />
        </Field>

        <Field label="Catering service" htmlFor="service">
          <select {...register("service")} id="service" className={fieldClass}>
            <option value="">Not sure yet</option>
            {services.map((service) => (
              <option key={service.id} value={service.title}>
                {service.title}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Budget range" htmlFor="budget">
          <select {...register("budget")} id="budget" className={fieldClass}>
            <option value="">Select an option</option>
            {budgetOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Preferred contact" htmlFor="contactPreference">
          <select {...register("contactPreference")} id="contactPreference" className={fieldClass}>
            <option value="">No preference</option>
            <option value="Phone">Phone</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Email">Email</option>
          </select>
        </Field>

        <div className="sm:col-span-2">
          <Field label="Message" error={errors.message?.message} htmlFor="message">
            <textarea
              {...register("message")}
              id="message"
              rows={5}
              className={cn(fieldClass, "resize-y")}
              placeholder="Tell us about your event — sessions, cuisine preferences, service style."
            />
          </Field>
        </div>
      </div>

      {/* Honeypot — hidden from users, catches simple bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label htmlFor="company">Company</label>
        <input {...register("company")} id="company" tabIndex={-1} autoComplete="off" />
      </div>

      {status.state === "error" ? (
        <div
          role="alert"
          className="mt-8 rounded-sm border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <p>{status.message}</p>
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block underline"
            >
              Message us on WhatsApp instead
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
        <CTAButton type="submit" disabled={isSubmitting} withArrow={!isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Sending
            </>
          ) : (
            "Send Enquiry"
          )}
        </CTAButton>
        {wa ? (
          <CTAAnchor href={wa} target="_blank" variant="outline" className="text-foreground">
            Chat on WhatsApp
          </CTAAnchor>
        ) : null}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Fields marked * are required. We only use these details to respond to your enquiry.
      </p>
    </form>
  );
}

function Field({
  label,
  required,
  error,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean | undefined;
  error?: string | undefined;
  htmlFor?: string | undefined;
  children: React.ReactNode;
}) {
  const id = htmlFor ?? label.toLowerCase().replace(/\s+/g, "");
  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label}
        {required ? <span className="text-primary"> *</span> : null}
      </label>
      <div className="mt-2">{children}</div>
      {error ? (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
