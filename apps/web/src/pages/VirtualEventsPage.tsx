import React, { useState, useRef } from "react";
import {
  ArrowRight,
  Broadcast,
  ChartLineUp,
  ChatCircleDots,
  CheckCircle,
  PlayCircle,
  UsersThree,
  VideoCamera,
  ShieldCheck,
  Buildings,
  Handshake,
  Trophy,
  Users,
  Storefront,
  Image,
  Lectern,
  Presentation,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { MarketingHeader } from "../components/MarketingHeader";

const eventArtwork = "/virtual-events/syncoraxp-virtual-events-hero.png";
const hostArtwork = "/virtual-events/host-live-v1.png";
const keynoteArtwork = "/virtual-events/keynote-audience-v1.png";
const attendeeArtwork = "/virtual-events/attendee-grid-v1.png";

const capabilities = [
  { icon: VideoCamera, title: "Broadcast with impact", text: "Studio-quality sessions that engage every attendee, anywhere." },
  { icon: UsersThree, title: "Connect naturally", text: "Turn passive watching into conversations that continue beyond the session." },
  { icon: ChartLineUp, title: "Measure what matters", text: "See the signals behind attendance, participation, and event outcomes." },
];

const COUNTRY_CODES = [
  { code: "IN", dial: "+91", flag: "🇮🇳" },
  { code: "US", dial: "+1", flag: "🇺🇸" },
  { code: "GB", dial: "+44", flag: "🇬🇧" },
  { code: "AE", dial: "+971", flag: "🇦🇪" },
  { code: "SG", dial: "+65", flag: "🇸🇬" },
  { code: "AU", dial: "+61", flag: "🇦🇺" },
  { code: "CA", dial: "+1", flag: "🇨🇦" },
  { code: "DE", dial: "+49", flag: "🇩🇪" },
];

const CATEGORIES = [
  "SaaS / Technology",
  "Marketing and Advertising",
  "Education and EdTech",
  "Healthcare",
  "Finance and Banking",
  "Retail and e-Commerce",
  "Manufacturing",
  "Non-Profit / NGO",
  "Government",
  "Other",
];

const brandLogos = [
  { name: "Teamwork", style: { fontWeight: 900, letterSpacing: "-0.05em" } },
  { name: "ISB", style: { fontWeight: 800, fontStyle: "italic" } },
  { name: "Johnson & Johnson", style: { fontFamily: "serif", fontStyle: "italic", fontWeight: 700 } },
  { name: "Automation Anywhere", style: { fontWeight: 300, letterSpacing: "0.1em" } },
  { name: "AAOS", style: { fontWeight: 900 } },
  { name: "Lenovo", style: { fontWeight: 800, textTransform: "uppercase" } },
  { name: "Novo Nordisk", style: { fontFamily: "sans-serif", fontWeight: 600 } },
  { name: "Tech Mahindra", style: { fontWeight: 400, letterSpacing: "0.05em" } },
  { name: "GSK", style: { fontWeight: 900, textTransform: "lowercase" } },
  { name: "Hitachi", style: { fontWeight: 700, fontStyle: "italic" } },
  { name: "BSE", style: { fontWeight: 800 } },
  { name: "PWC", style: { fontWeight: 900, textTransform: "lowercase" } },
];

const virtualSpaces = [
  { name: "Exterior", image: "/virtual-events-assets/expo-bg.jpg" },
  { name: "Lobby", image: "/virtual-events-assets/lobby-bg.png" },
  { name: "Booth", image: "/virtual-events-assets/default-booth-bg.png" },
  { name: "Booth", image: "/virtual-events-assets/meeting-room-bg.png" },
  { name: "Exhibition Hall", image: "https://cdn5.godcstatic.com/dreamcast/solutions/virtual-event-platform/Slider_09.png" },
  { name: "Main Stage", image: "https://cdn5.godcstatic.com/dreamcast/solutions/virtual-event-platform/Slider_08.png" },
  { name: "Conference Hall", image: "https://cdn5.godcstatic.com/dreamcast/solutions/virtual-event-platform/Slider_06.png" },
];

function EventPhoto({ className, alt, src = eventArtwork }: { className: string; alt: string; src?: string }) {
  return <img className={`event-stage-photo ${className}`} src={src} alt={alt} />;
}

export function VirtualEventsPage() {
  const formRef = useRef<HTMLDivElement>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [activeTabRow1, setActiveTabRow1] = useState(1);
  const [activeTabRow2, setActiveTabRow2] = useState(1);
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(0);

  const [form, setForm] = useState({
    fullName: "",
    workEmail: "",
    countryCode: "+91",
    phone: "",
    city: "",
    company: "",
    category: "",
    message: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateField = (name: string, value: string, currentCC = form.countryCode) => {
    let error = "";
    if (name === "fullName") {
      if (!value.trim()) {
        error = "Full name is required";
      } else if (value.trim().length < 2) {
        error = "Name must be at least 2 characters";
      } else if (!/^[A-Za-z\s]+$/.test(value)) {
        error = "Name should only contain letters and spaces";
      }
    } else if (name === "workEmail") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) {
        error = "Work email is required";
      } else if (!emailRegex.test(value)) {
        error = "Please enter a valid email address";
      }
    } else if (name === "phone") {
      const digits = value.replace(/\D/g, "");
      if (!value.trim()) {
        error = "Phone number is required";
      } else if (!/^[0-9\s\-()]+$/.test(value)) {
        error = "Phone number should only contain digits, spaces, or hyphens";
      } else if (currentCC === "+91" || currentCC === "+1") {
        if (digits.length !== 10) {
          error = `Phone number must be exactly 10 digits for ${currentCC === "+91" ? "India" : "US/Canada"}`;
        }
      } else {
        if (digits.length < 8 || digits.length > 12) {
          error = "Phone number must be between 8 and 12 digits";
        }
      }
    } else if (name === "city") {
      if (!value.trim()) {
        error = "City is required";
      } else if (value.trim().length < 2) {
        error = "City must be at least 2 characters";
      }
    } else if (name === "company") {
      if (!value.trim()) {
        error = "Company name is required";
      } else if (value.trim().length < 2) {
        error = "Company must be at least 2 characters";
      }
    } else if (name === "category") {
      if (!value) {
        error = "Please select your business category";
      }
    }
    return error;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((p) => {
      const nextForm = { ...p, [name]: value };
      if (name === "countryCode" && touched["phone"]) {
        const err = validateField("phone", p.phone, value);
        setErrors((prev) => ({ ...prev, phone: err }));
      }
      return nextForm;
    });
    if (touched[name]) {
      const err = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    const allTouched: Record<string, boolean> = {};

    Object.keys(form).forEach((key) => {
      if (key !== "countryCode" && key !== "message") {
        const val = form[key as keyof typeof form];
        const err = validateField(key, val);
        if (err) {
          newErrors[key] = err;
        }
        allTouched[key] = true;
      }
    });

    setTouched(allTouched);
    setErrors(newErrors);

    const hasErrors = Object.keys(newErrors).some((k) => newErrors[k]);
    if (hasErrors) {
      return;
    }

    setLoading(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to submit demo request.");
      }

      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (name: string): React.CSSProperties => {
    const hasError = touched[name] && errors[name];
    return {
      width: "100%",
      padding: "14px 16px",
      borderRadius: "10px",
      fontSize: "13.5px",
      color: "#ffffff",
      outline: "none",
      boxSizing: "border-box",
      fontFamily: "inherit",
      transition: "all 0.2s ease",
      border: hasError ? "1.5px solid #ef4444" : "1.5px solid rgba(255, 255, 255, 0.15)",
      background: hasError ? "rgba(239, 68, 68, 0.1)" : "rgba(255, 255, 255, 0.05)",
      boxShadow: hasError ? "0 0 0 3px rgba(239, 68, 68, 0.2)" : "none",
    };
  };

  const renderError = (name: string) => {
    if (touched[name] && errors[name]) {
      return (
        <span style={{
          color: "#ef4444",
          fontSize: "11px",
          fontWeight: 700,
          marginTop: "4px",
          marginLeft: "2px",
          display: "block",
          textAlign: "left",
        }}>
          {errors[name]}
        </span>
      );
    }
    return null;
  };

  return (
    <main className="landing-page virtual-events-page">
      <MarketingHeader />

      <section className="virtual-events-hero" id="platform" aria-labelledby="virtual-events-title">
        <p className="virtual-events-kicker"><span /> Your virtual events, elevated</p>
        <h1 id="virtual-events-title">Virtual events that<br />feel truly together.</h1>
        <p className="virtual-events-intro">Create branded live experiences that bring every session, conversation, and connection into one seamless place.</p>
        <div className="virtual-events-actions">
          <Link className="virtual-events-primary" to="/virtual-events-platform/app/login">Explore the platform <ArrowRight size={18} weight="bold" /></Link>
          <a className="virtual-events-watch" href="#capabilities"><PlayCircle size={22} weight="fill" /> Watch overview</a>
        </div>

        <section className="event-stage" id="experience" aria-label="A live SyncoraXP virtual event experience">
          <article className="event-stage-keynote">
            <EventPhoto className="event-stage-keynote-photo" src={keynoteArtwork} alt="A keynote speaker addressing an online event audience" />
            <span className="event-stage-label"><i /> Launch Keynote</span>
          </article>

          <div className="event-stage-left-lower">
            <article className="event-stage-chat">
              <header><ChatCircleDots size={17} weight="fill" /> Event chat</header>
              <div><EventPhoto className="event-stage-avatar avatar-one" alt="Alex R. attending the event" /><p><b>Alex R.</b><span>Great insights!</span></p><time>10:24 AM</time></div>
              <div><EventPhoto className="event-stage-avatar avatar-two" alt="Maya S. attending the event" /><p><b>Maya S.</b><span>Loving this session ✨</span></p></div>
              <div><EventPhoto className="event-stage-avatar avatar-three" alt="Jordan K. attending the event" /><p><b>Jordan K.</b><span>Thanks for sharing!</span></p></div>
            </article>
            <article className="event-stage-attendance">
              <UsersThree size={25} weight="fill" />
              <strong>1,256</strong><span>Attendees online</span>
              <div className="event-stage-sparkline" aria-hidden="true"><i /><i /><i /><i /><i /></div>
            </article>
          </div>

          <article className="event-stage-host">
            <EventPhoto className="event-stage-host-photo" src={hostArtwork} alt="A live event host presenting to attendees" />
            <span className="event-stage-live"><Broadcast size={14} weight="fill" /> Live</span>
            <span className="event-stage-viewers"><UsersThree size={14} weight="fill" /> 1,256</span>
          </article>

          <article className="event-stage-audience">
            <EventPhoto className="event-stage-audience-photo" src={keynoteArtwork} alt="An engaged virtual event audience" />
            <span><i /> Connected</span>
          </article>

          <section className="event-stage-speakers" aria-label="Connected attendees">
            <img className="event-stage-attendee-grid" src={attendeeArtwork} alt="Four virtual event attendees connected live" />
          </section>

          <article className="event-stage-networking">
            <div><UsersThree size={19} weight="fill" /><b>Networking</b><span>Find and connect<br />with the right people.</span></div>
            <div className="event-stage-mini-avatars"><EventPhoto className="avatar-one" alt="" /><EventPhoto className="avatar-two" alt="" /><EventPhoto className="avatar-three" alt="" /><b>+32</b></div>
            <ArrowRight size={19} weight="bold" />
          </article>

          <article className="event-stage-engagement">
            <div><span>Engagement score</span><strong>92%</strong><b>Excellent</b></div>
            <div className="event-stage-engagement-line" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
          </article>
        </section>
      </section>

      <section className="virtual-events-capabilities" id="capabilities" aria-labelledby="virtual-events-capabilities-title">
        <div className="virtual-events-capability-intro"><p>Built for powerful experiences</p><h2 id="virtual-events-capabilities-title">Everything you need to run remarkable virtual events.</h2></div>
        <div className="virtual-events-capability-list">
          {capabilities.map(({ icon: Icon, title, text }) => <article key={title}><Icon size={29} weight="duotone" aria-hidden="true" /><h3>{title}</h3><p>{text}</p></article>)}
        </div>
        <Link className="virtual-events-join" to="/register">Create your event <CheckCircle size={19} weight="fill" /></Link>
      </section>

      {/* ── DOT MATRIX BACKGROUND GRID ── */}
      <div style={{
        backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.06) 1.5px, transparent 1.5px)",
        backgroundSize: "24px 24px",
        width: "100%",
      }}>
        {/* ── B2B TRUST LOGOS SECTION ── */}
        <section style={{
        padding: "48px 0",
        background: "rgba(255, 255, 255, 0.02)",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        textAlign: "center",
        width: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
      }}>
        <style>{`
          @keyframes ve-marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
        <p style={{
          fontSize: "11px",
          fontWeight: 800,
          color: "rgba(255, 255, 255, 0.4)",
          textTransform: "uppercase",
          letterSpacing: "2.5px",
          marginBottom: "32px",
        }}>
          Trusted by the Biggest Names in B2B
        </p>

        <div style={{
          overflow: "hidden",
          width: "100%",
          display: "flex",
          position: "relative",
          maskImage: "linear-gradient(to right, transparent, white 20%, white 80%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, white 20%, white 80%, transparent)",
        }}>
          <div style={{
            display: "flex",
            gap: "80px",
            alignItems: "center",
            width: "max-content",
            animation: "ve-marquee 30s linear infinite",
            paddingRight: "80px",
          }}>
            {brandLogos.map((brand, i) => (
              <span
                key={`1-${i}`}
                style={{
                  color: "#ffffff",
                  fontSize: "16px",
                  whiteSpace: "nowrap",
                  ...brand.style,
                }}
              >
                {brand.name}
              </span>
            ))}
            {brandLogos.map((brand, i) => (
              <span
                key={`2-${i}`}
                style={{
                  color: "#ffffff",
                  fontSize: "16px",
                  whiteSpace: "nowrap",
                  ...brand.style,
                }}
              >
                {brand.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT/DEMO FORM CARD ── */}
      <section ref={formRef} style={{
        padding: "80px 24px",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        boxSizing: "border-box",
      }}>
        <div style={{
          width: "100%",
          maxWidth: "1100px",
          background: "linear-gradient(135deg, rgba(30, 27, 75, 0.8) 0%, rgba(91, 20, 189, 0.2) 100%)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "24px",
          padding: "54px 48px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "48px",
          alignItems: "center",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.25)",
          boxSizing: "border-box",
        }}>
          {/* Left Column Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", textAlign: "left" }}>
            <h2 style={{
              fontSize: "clamp(30px, 4vw, 44px)",
              fontWeight: 850,
              color: "#ffffff",
              margin: 0,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}>
              Let's Get<br />Your Event Going!
            </h2>
            <p style={{
              fontSize: "16px",
              color: "rgba(255, 255, 255, 0.7)",
              margin: 0,
              fontWeight: 500,
            }}>
              Connect With Us Today!
            </p>

            <div style={{
              marginTop: "24px",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              paddingTop: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}>
              <span style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.5)", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>Let's talk!</span>
              <a href="tel:+919509936100" style={{ fontSize: "22px", fontWeight: 800, color: "#fbbf24", textDecoration: "none" }}>
                +91 90000000000
              </a>
            </div>
          </div>

          {/* Right Column Form */}
          <div style={{ width: "100%" }}>
            {submitted ? (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                gap: "16px",
                padding: "24px 0",
              }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "rgba(59, 130, 246, 0.1)",
                  border: "2px solid #3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3b82f6",
                  marginBottom: "8px",
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", margin: 0 }}>
                  Demo Request Received!
                </h3>
                <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "14px", lineHeight: 1.5, margin: 0, maxWidth: "340px" }}>
                  Thank you! Our event specialists will get in touch with you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {submitError && (
                  <div style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    color: "#f87171",
                    fontSize: "13px",
                    fontWeight: 600,
                    textAlign: "left"
                  }}>
                    ⚠️ {submitError}
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={60}
                    placeholder="Full Name* (Max 60 chars)"
                    style={inputStyle("fullName")}
                  />
                  {renderError("fullName")}
                </div>

                {/* Work Email */}
                <div>
                  <input
                    name="workEmail"
                    type="email"
                    value={form.workEmail}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Your Work Email*"
                    style={inputStyle("workEmail")}
                  />
                  {renderError("workEmail")}
                </div>

                {/* Phone */}
                <div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <select
                        name="countryCode"
                        value={form.countryCode}
                        onChange={handleChange}
                        style={{
                          ...inputStyle("phone"),
                          minWidth: "85px",
                          paddingRight: "24px",
                          appearance: "none",
                          cursor: "pointer",
                        }}
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.dial} style={{ color: "#000" }}>
                            {c.code} {c.dial}
                          </option>
                        ))}
                      </select>
                      <span style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "8px",
                        color: "rgba(255, 255, 255, 0.5)",
                        pointerEvents: "none",
                      }}>▼</span>
                    </div>
                    <input
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Phone No.*"
                      style={{ ...inputStyle("phone"), flex: 1 }}
                    />
                  </div>
                  {renderError("phone")}
                </div>

                {/* City & Company (2 columns on wider screens) */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
                  <div>
                    <input
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      maxLength={60}
                      placeholder="City* (Max 60 chars)"
                      style={inputStyle("city")}
                    />
                    {renderError("city")}
                  </div>
                  <div>
                    <input
                      name="company"
                      value={form.company}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      maxLength={60}
                      placeholder="Company* (Max 60 chars)"
                      style={inputStyle("company")}
                    />
                    {renderError("company")}
                  </div>
                </div>

                {/* Category of Business */}
                <div>
                  <div style={{ position: "relative" }}>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      style={{
                        ...inputStyle("category"),
                        appearance: "none",
                        cursor: "pointer",
                        color: form.category ? "#ffffff" : "rgba(255, 255, 255, 0.5)",
                        width: "100%",
                      }}
                    >
                      <option value="" disabled style={{ color: "#000" }}>
                        Category of Business*
                      </option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} style={{ color: "#000" }}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <span style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "8px",
                      color: "rgba(255, 255, 255, 0.5)",
                      pointerEvents: "none",
                    }}>▼</span>
                  </div>
                  {renderError("category")}
                </div>

                {/* Message */}
                <div>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    maxLength={2000}
                    rows={3}
                    placeholder="Message (Max 2000 chars)"
                    style={{
                      ...inputStyle("message"),
                      resize: "vertical",
                      minHeight: "80px",
                    }}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: loading ? "rgba(255, 255, 255, 0.5)" : "#ffffff",
                    color: "#7c3aed",
                    border: "none",
                    borderRadius: "10px",
                    padding: "14px 20px",
                    fontWeight: 800,
                    fontSize: "14.5px",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    marginTop: "6px",
                    boxShadow: loading ? "none" : "0 4px 14px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  {loading ? "Submitting…" : "Submit"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

         {/* ── INTERACTIVE EVENT SPACES CAROUSEL ── */}
      <section style={{
        padding: "80px 24px 40px",
        width: "100%",
        maxWidth: "1400px",
        margin: "0 auto",
        boxSizing: "border-box",
        textAlign: "left",
      }}>
        {/* Header Row */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "40px",
          width: "100%",
        }}>
          <div>
            <p style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#fbbf24",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              margin: "0 0 8px 0",
            }}>
              Host A Virtual Event
            </p>
            <h2 style={{
              fontSize: "clamp(24px, 3.5vw, 36px)",
              fontWeight: 850,
              color: "#ffffff",
              margin: 0,
              letterSpacing: "-0.02em",
            }}>
              Your Audience - Your Way
            </h2>
          </div>

          {/* Navigation Buttons */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => setCarouselIndex((prev) => (prev - 1 + virtualSpaces.length) % virtualSpaces.length)}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"; }}
            >
              ←
            </button>
            <button
              onClick={() => setCarouselIndex((prev) => (prev + 1) % virtualSpaces.length)}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"; }}
            >
              →
            </button>
          </div>
        </div>

        {/* Carousel Viewport */}
        <div style={{
          width: "100%",
          overflow: "hidden",
          position: "relative",
          padding: "10px 0",
        }}>
          <div style={{
            display: "flex",
            gap: "24px",
            transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            transform: `translateX(-${carouselIndex * 484}px)`,
          }}>
            {virtualSpaces.map((space, idx) => (
              <div
                key={idx}
                style={{
                  minWidth: "460px",
                  width: "460px",
                  height: "310px",
                  borderRadius: "20px",
                  overflow: "hidden",
                  position: "relative",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)"; }}
              >
                <img
                  src={space.image}
                  alt={space.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                {/* Space Label Badge */}
                <div style={{
                  position: "absolute",
                  bottom: "12px",
                  right: "12px",
                  background: "rgba(0, 0, 0, 0.75)",
                  backdropFilter: "blur(4px)",
                  color: "#ffffff",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                }}>
                  {space.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      </div>

      {/* ── LIGHT THEME DOT MATRIX BACKGROUND GRID ── */}
      <div style={{
        background: "#faf9ff",
        backgroundImage: "radial-gradient(rgba(109, 40, 217, 0.08) 1.5px, transparent 1.5px)",
        backgroundSize: "24px 24px",
        width: "100%",
        borderTop: "1px solid rgba(109, 40, 217, 0.05)",
      }}>
        {/* ── FOOTER PROMO HEADING ── */}
        <section style={{
          padding: "60px 24px 20px",
          textAlign: "center",
          width: "100%",
          boxSizing: "border-box",
        }}>
          <p style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#6d28d9",
            textTransform: "uppercase",
            letterSpacing: "1px",
            marginBottom: "16px",
          }}>
            Do More With Events, Power them With Inter
          </p>
          <h2 style={{
            fontSize: "clamp(24px, 3.5vw, 38px)",
            fontWeight: 850,
            color: "#1e1b4b",
            maxWidth: "800px",
            margin: "0 auto 20px",
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
          }}>
            Virtual Events Are The New Way<br />Businesses Engage With Customers
          </h2>
        </section>

        {/* ── TWO-ROW INTERACTIVE FEATURE TABS ── */}
        <section style={{
          padding: "20px 24px 80px",
          width: "100%",
          maxWidth: "1100px",
          margin: "0 auto",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: "80px",
        }}>
          {/* ROW 1: TABS (LEFT) | VISUAL (RIGHT) */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "48px",
            alignItems: "center",
          }}>
            {/* Tabs Left Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "left" }}>
              {[
                {
                  title: "Networking Tables",
                  desc: "Enable video networking roundtables where attendees can freely click and join multiple topic discussions dynamically.",
                },
                {
                  title: "Dynamic Banners Functionality",
                  desc: "Dynamic Banners are very helpful – As in the same space, the host is able to display a number of brands at the same time due to the dynamic functionality. This enhances the sponsorship at the virtual events additionally it also provides the benefit to the displayed brand, as an attendee can easily reach out to their brand booth directly during the event.",
                },
                {
                  title: "AI Matchmaking Tool",
                  desc: "This enables exhibitors & attendees to get an entire list of people who have matched with their interest areas. The exhibitors & attendees can further connect & network with each individual from that list. In fact attendees can also directly reach out to the exhibitor booth directly via that matched list.",
                },
              ].map((tab, idx) => {
                const isActive = activeTabRow1 === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveTabRow1(idx)}
                    style={{
                      padding: "16px 20px",
                      borderRadius: "14px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      border: isActive ? "1px solid rgba(109, 40, 217, 0.12)" : "1px solid transparent",
                      background: isActive ? "#ffffff" : "transparent",
                      boxShadow: isActive ? "0 10px 30px -10px rgba(109, 40, 217, 0.12)" : "none",
                    }}
                  >
                    <h3 style={{
                      fontSize: "18px",
                      fontWeight: 750,
                      color: isActive ? "#6d28d9" : "#1e1b4b",
                      margin: "0 0 6px 0",
                      transition: "color 0.2s ease",
                    }}>
                      {tab.title}
                    </h3>
                    {isActive && (
                      <p style={{
                        fontSize: "13.5px",
                        color: "#475569",
                        margin: 0,
                        lineHeight: 1.5,
                      }}>
                        {tab.desc}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Visual Right Column */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                background: "#ffffff",
                borderRadius: "20px",
                height: "300px",
                width: "100%",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 20px 45px rgba(0, 0, 0, 0.08)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                boxSizing: "border-box",
                border: "1px solid rgba(109, 40, 217, 0.08)",
              }}>
                {activeTabRow1 === 0 && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", color: "#1e1b4b" }}>
                    {/* Networking Tables Mockup */}
                    <div style={{ width: "100px", height: "100px", borderRadius: "50%", border: "4px dashed #7c3aed", display: "grid", placeItems: "center", position: "relative" }}>
                      <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#ede9fe", display: "grid", placeItems: "center", fontWeight: "bold" }}>Table 1</div>
                      <div style={{ position: "absolute", top: "-10px", width: "24px", height: "24px", borderRadius: "50%", background: "#3b82f6" }} />
                      <div style={{ position: "absolute", bottom: "-10px", width: "24px", height: "24px", borderRadius: "50%", background: "#10b981" }} />
                      <div style={{ position: "absolute", left: "-10px", width: "24px", height: "24px", borderRadius: "50%", background: "#ec4899" }} />
                      <div style={{ position: "absolute", right: "-10px", width: "24px", height: "24px", borderRadius: "50%", background: "#f59e0b" }} />
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: "bold" }}>Interactive Networking Lounge</span>
                  </div>
                )}

                {activeTabRow1 === 1 && (
                  <img
                    src="https://cdn5.godcstatic.com/dreamcast/solutions/virtual-event-platform/Slider_05.png"
                    alt="Dynamic Banners Preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}

                {activeTabRow1 === 2 && (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "28px", color: "#1e1b4b", position: "relative" }}>
                    {/* AI Matchmaking Mockup */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=80&h=80&q=80" style={{ width: "70px", height: "70px", borderRadius: "50%", border: "3px solid #7c3aed" }} alt="" />
                      <span style={{ fontSize: "11px", fontWeight: 700 }}>Alex R.</span>
                      <span style={{ fontSize: "8px", background: "#ede9fe", color: "#7c3aed", padding: "2px 6px", borderRadius: "8px", fontWeight: 800 }}>Business Tech</span>
                    </div>

                    {/* Glowing Connect Path */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      <div style={{ width: "50px", height: "2px", background: "linear-gradient(to right, #7c3aed, #ec4899)", animation: "pulse 1.5s infinite" }} />
                      <span style={{ fontSize: "12px", position: "absolute", background: "#ffffff", padding: "2px 6px", borderRadius: "10px", border: "1px solid #ddd", fontWeight: 800 }}>98% Match</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?fit=crop&w=80&h=80&q=80" style={{ width: "70px", height: "70px", borderRadius: "50%", border: "3px solid #ec4899" }} alt="" />
                      <span style={{ fontSize: "11px", fontWeight: 700 }}>Maya S.</span>
                      <span style={{ fontSize: "8px", background: "#fce7f3", color: "#ec4899", padding: "2px 6px", borderRadius: "8px", fontWeight: 800 }}>Product Design</span>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>

          {/* ROW 2: VISUAL (LEFT) | TABS (RIGHT) */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "48px",
            alignItems: "center",
          }}>
            {/* Visual Left Column */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              order: window.innerWidth > 768 ? 1 : 2,
            }}>
              <div style={{
                background: "#ffffff",
                borderRadius: "20px",
                height: "300px",
                width: "100%",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 20px 45px rgba(0, 0, 0, 0.08)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                boxSizing: "border-box",
                border: "1px solid rgba(109, 40, 217, 0.08)",
              }}>
                {activeTabRow2 === 0 && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", color: "#1e1b4b" }}>
                    {/* Browser Mockup */}
                    <div style={{ width: "200px", height: "120px", background: "#f3f4f6", borderRadius: "8px", border: "2px solid #ddd", overflow: "hidden", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
                      <div style={{ height: "14px", background: "#e5e7eb", display: "flex", gap: "4px", paddingLeft: "6px", alignItems: "center" }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ff5f56" }} />
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ffbd2e" }} />
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#27c93f" }} />
                      </div>
                      <div style={{ height: "106px", display: "grid", placeItems: "center", background: "#295ce8", color: "#fff", fontSize: "10px", fontWeight: "bold" }}>
                        SyncoraXP Lobby
                      </div>
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: "bold" }}>No Install Browser App</span>
                  </div>
                )}

                {activeTabRow2 === 1 && (
                  <img
                    src="https://cdn5.godcstatic.com/dreamcast/solutions/virtual-event-platform/Slider_04.png"
                    alt="Custom Environment Preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}

                {activeTabRow2 === 2 && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", width: "100%", color: "#1e1b4b" }}>
                    {/* DIY Booth Editor Mockup */}
                    <div style={{ display: "flex", gap: "10px", width: "95%", height: "130px", background: "#f3f4f6", borderRadius: "10px", padding: "10px", boxSizing: "border-box", border: "1px solid #e5e7eb" }}>
                      {/* Left Toolbar */}
                      <div style={{ width: "30px", background: "#e5e7eb", borderRadius: "6px", display: "flex", flexDirection: "column", gap: "6px", padding: "4px", boxSizing: "border-box" }}>
                        <div style={{ width: "100%", height: "14px", background: "#7c3aed", borderRadius: "4px" }} />
                        <div style={{ width: "100%", height: "14px", background: "#ccc", borderRadius: "4px" }} />
                        <div style={{ width: "100%", height: "14px", background: "#ccc", borderRadius: "4px" }} />
                      </div>
                      {/* Booth Preview Center */}
                      <div style={{ flex: 1, background: "#fff", border: "1px solid #ddd", borderRadius: "6px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", position: "relative" }}>
                        <span style={{ fontSize: "9px", fontWeight: "bold", color: "#1e1b4b" }}>Interactive Booth</span>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#3b82f6" }} />
                          <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#ec4899" }} />
                        </div>
                      </div>
                      {/* Right Presets */}
                      <div style={{ width: "55px", background: "#e5e7eb", borderRadius: "6px", padding: "6px", display: "flex", flexDirection: "column", gap: "6px", boxSizing: "border-box" }}>
                        <div style={{ width: "100%", height: "8px", background: "#10b981", borderRadius: "2px" }} />
                        <div style={{ width: "100%", height: "8px", background: "#3b82f6", borderRadius: "2px" }} />
                        <div style={{ width: "100%", height: "8px", background: "#f59e0b", borderRadius: "2px" }} />
                      </div>
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: "bold" }}>DIY Banner, Colors & Button Customizer</span>
                  </div>
                )}
            </div>
          </div>

            {/* Tabs Right Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "left", order: window.innerWidth > 768 ? 2 : 1 }}>
              {[
                {
                  title: "Browser-Based Solutions",
                  desc: "No installation or extensions needed. Everything runs in high fidelity inside all modern standard web browsers.",
                },
                {
                  title: "Custom Environment",
                  desc: "SyncoraXP virtual event platform supports you to customise the entire environment of your event. You can inculcate different functionalities, designs, music, tabs, icons, touchpoints etc that uplift the overall ambience of your event, basis of your brand requirement.",
                },
                {
                  title: "DIY Booth Button Icons And Names",
                  desc: "Our virtual event platform offers a completely 'Do It Yourself' Booth Module. The exhibitors are empowered to adjust various colours, banners, functionality, icons, symbols along with video recordings, pictures, or even PDF in a jiffy. Do it yourself & make your booth your way!",
                },
              ].map((tab, idx) => {
                const isActive = activeTabRow2 === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveTabRow2(idx)}
                    style={{
                      padding: "16px 20px",
                      borderRadius: "14px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      border: isActive ? "1px solid rgba(109, 40, 217, 0.12)" : "1px solid transparent",
                      background: isActive ? "#ffffff" : "transparent",
                      boxShadow: isActive ? "0 10px 30px -10px rgba(109, 40, 217, 0.12)" : "none",
                    }}
                  >
                    <h3 style={{
                      fontSize: "18px",
                      fontWeight: 750,
                      color: isActive ? "#6d28d9" : "#1e1b4b",
                      margin: "0 0 6px 0",
                      transition: "color 0.2s ease",
                    }}>
                      {tab.title}
                    </h3>
                    {isActive && (
                      <p style={{
                        fontSize: "13.5px",
                        color: "#475569",
                        margin: 0,
                        lineHeight: 1.5,
                      }}>
                        {tab.desc}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── EVENTS OF ALL TYPES & SIZES ── */}
        <section style={{
          padding: "60px 0 80px",
          width: "100%",
          boxSizing: "border-box",
          textAlign: "center",
          overflow: "hidden",
        }}>
          <style>{`
            @keyframes ve-event-marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
          <p style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#6d28d9",
            textTransform: "uppercase",
            letterSpacing: "1px",
            marginBottom: "16px",
          }}>
            We Are Ready To Host
          </p>
          <h2 style={{
            fontSize: "clamp(24px, 3.5vw, 38px)",
            fontWeight: 850,
            color: "#1e1b4b",
            maxWidth: "800px",
            margin: "0 auto 40px",
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
          }}>
            Events Of All Types & Sizes
          </h2>

          <div style={{
            overflow: "hidden",
            width: "100%",
            display: "flex",
            position: "relative",
            maskImage: "linear-gradient(to right, transparent, white 10%, white 90%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, white 10%, white 90%, transparent)",
          }}>
            <div style={{
              display: "flex",
              gap: "20px",
              width: "max-content",
              animation: "ve-event-marquee 30s linear infinite",
              padding: "10px 0",
            }}>
              {[
                { name: "Virtual Townhall", color: "#fce7f3", icon: Buildings, iconColor: "#ec4899" },
                { name: "Virtual Trade Shows", color: "#ecfdf5", icon: Handshake, iconColor: "#10b981" },
                { name: "Virtual Award Show", color: "#fffbeb", icon: Trophy, iconColor: "#f59e0b" },
                { name: "Virtual Meeting", color: "#f5f3ff", icon: Users, iconColor: "#8b5cf6" },
                { name: "Virtual Fairs", color: "#fee2e2", icon: Storefront, iconColor: "#ef4444" },
                { name: "Virtual Exhibitions", color: "#e0f2fe", icon: Image, iconColor: "#0284c7" },
                { name: "Virtual Fest", color: "#fef3c7", icon: Lectern, iconColor: "#d97706" },
                { name: "Virtual Conferences", color: "#e0e7ff", icon: Presentation, iconColor: "#4f46e5" },
              ].concat([
                { name: "Virtual Townhall", color: "#fce7f3", icon: Buildings, iconColor: "#ec4899" },
                { name: "Virtual Trade Shows", color: "#ecfdf5", icon: Handshake, iconColor: "#10b981" },
                { name: "Virtual Award Show", color: "#fffbeb", icon: Trophy, iconColor: "#f59e0b" },
                { name: "Virtual Meeting", color: "#f5f3ff", icon: Users, iconColor: "#8b5cf6" },
                { name: "Virtual Fairs", color: "#fee2e2", icon: Storefront, iconColor: "#ef4444" },
                { name: "Virtual Exhibitions", color: "#e0f2fe", icon: Image, iconColor: "#0284c7" },
                { name: "Virtual Fest", color: "#fef3c7", icon: Lectern, iconColor: "#d97706" },
                { name: "Virtual Conferences", color: "#e0e7ff", icon: Presentation, iconColor: "#4f46e5" },
              ]).map((ev, idx) => {
                const IconComponent = ev.icon;
                return (
                  <div
                    key={idx}
                    style={{
                      background: "#ffffff",
                      border: "1px solid rgba(109, 40, 217, 0.08)",
                      borderRadius: "18px",
                      padding: "16px 24px",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      boxShadow: "0 10px 25px -5px rgba(109, 40, 217, 0.04)",
                      minWidth: "220px",
                    }}
                  >
                    <IconComponent size={26} weight="duotone" style={{ color: ev.iconColor, flexShrink: 0 }} />
                    <span style={{
                      fontSize: "15px",
                      fontWeight: 750,
                      color: "#1e1b4b",
                      textAlign: "left",
                    }}>
                      {ev.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── FREQUENTLY ASKED QUESTIONS ── */}
        <section style={{
          padding: "60px 24px 80px",
          width: "100%",
          maxWidth: "1100px",
          margin: "0 auto",
          boxSizing: "border-box",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "48px",
          alignItems: "start",
          borderTop: "1px solid rgba(109, 40, 217, 0.05)",
        }}>
          {/* Left Heading */}
          <div style={{ textAlign: "left" }}>
            <h2 style={{
              fontSize: "clamp(32px, 4.5vw, 48px)",
              fontWeight: 850,
              color: "#1e1b4b",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              margin: 0,
            }}>
              Frequently<br />asked questions
            </h2>
          </div>

          {/* Right Accordions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "left" }}>
            {[
              {
                q: "Do attendees need to download any software to join a virtual event?",
                a: "SyncoraXP offers web-based virtual event platform that let attendees join virtual events without the hassle of downloading or installing any additional software.",
              },
              {
                q: "What networking features are available on the platform?",
                a: "SyncoraXP supports interactive networking tables, AI-driven matchmaking, 1-on-1 private messaging, dynamic business cards exchange, and integrated group video chats.",
              },
              {
                q: "How customizable is SyncoraXP's virtual event platform?",
                a: "Highly customizable! Event hosts can upload dynamic banners, configure custom booth names and button icons, pick custom brand layouts, and customize color schemes.",
              },
              {
                q: "Can I integrate third-party tools with my virtual event?",
                a: "Yes. We offer robust API endpoints and integrations with leading CRM platforms, marketing tools, live streaming providers, and web analytics tools.",
              },
              {
                q: "How does SyncoraXP ensure audience engagement during virtual events?",
                a: "Through interactive live chats, instant polls, direct Q&A boards, gamified event stages, and dynamic photo booths that keep engagement scores high.",
              },
            ].map((faq, idx) => {
              const isOpen = activeFaqIndex === idx;
              return (
                <div
                  key={idx}
                  style={{
                    borderBottom: "1px solid rgba(109, 40, 217, 0.1)",
                    paddingBottom: "16px",
                  }}
                >
                  <button
                    onClick={() => setActiveFaqIndex(isOpen ? null : idx)}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      cursor: "pointer",
                      textAlign: "left",
                      gap: "16px",
                    }}
                  >
                    <span style={{
                      fontSize: "16px",
                      fontWeight: 750,
                      color: "#1e1b4b",
                      lineHeight: 1.4,
                    }}>
                      {faq.q}
                    </span>
                    <span style={{
                      fontSize: "14px",
                      color: "#6d28d9",
                      fontWeight: "bold",
                    }}>
                      {isOpen ? "▲" : "▼"}
                    </span>
                  </button>
                  {isOpen && (
                    <p style={{
                      fontSize: "14.5px",
                      color: "#475569",
                      margin: "8px 0 0 0",
                      lineHeight: 1.5,
                    }}>
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── CTA BANNER CARD ── */}
        <section style={{
          padding: "40px 24px 100px",
          width: "100%",
          maxWidth: "1100px",
          margin: "0 auto",
          boxSizing: "border-box",
        }}>
          <div style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
            borderRadius: "24px",
            padding: "60px 48px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 24px 60px rgba(124, 58, 237, 0.2)",
            textAlign: "left",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "40px",
            alignItems: "center",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", zIndex: 5, maxWidth: "650px" }}>
              <h2 style={{
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: 850,
                color: "#ffffff",
                lineHeight: 1.15,
                letterSpacing: "-0.01em",
                margin: 0,
              }}>
                Boost your virtual event<br />experience with SyncoraXP
              </h2>
              <h3 style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "rgba(255, 255, 255, 0.9)",
                margin: 0,
              }}>
                Host engaging virtual events & connect with global attendees
              </h3>
              <p style={{
                fontSize: "14px",
                color: "rgba(255, 255, 255, 0.75)",
                lineHeight: 1.6,
                margin: "8px 0 20px 0",
              }}>
                SyncoraXP's virtual event platform is a perfect virtual venue for all your event needs that is optimized for networking and engaging attendees seamlessly. Host virtual events, meetings, conferences, trade fairs, job fairs, exhibitions, product launches, and more with SyncoraXP online event platform and deliver the most engaging event experiences to attendees.
              </p>
              <Link
                to="/book-demo"
                style={{
                  color: "#ffffff",
                  fontSize: "14.5px",
                  fontWeight: "bold",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                Read More →
              </Link>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "16px", marginTop: "24px" }}>
                <Link
                  to="/book-demo"
                  style={{
                    background: "#ffffff",
                    color: "#7c3aed",
                    border: "none",
                    borderRadius: "10px",
                    padding: "14px 24px",
                    fontWeight: 800,
                    fontSize: "14px",
                    textDecoration: "none",
                    display: "inline-block",
                    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1)",
                    textAlign: "center",
                  }}
                >
                  Talk To An Expert
                </Link>
                <Link
                  to="/book-demo"
                  style={{
                    background: "transparent",
                    color: "#ffffff",
                    border: "2px solid #ffffff",
                    borderRadius: "10px",
                    padding: "12px 24px",
                    fontWeight: 800,
                    fontSize: "14px",
                    textDecoration: "none",
                    display: "inline-block",
                    textAlign: "center",
                  }}
                >
                  Free Demo
                </Link>
              </div>
            </div>

            {/* Right Backdrop Logo Design */}
            <div style={{
              position: "absolute",
              right: "40px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "220px",
              height: "220px",
              zIndex: 2,
              pointerEvents: "none",
            }}>
              <img
                src="/favicon_io/android-chrome-192x192.png"
                alt="SyncoraXP Logo Backdrop"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  opacity: 0.15,
                  filter: "drop-shadow(0 0 20px rgba(255, 255, 255, 0.2))",
                }}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
