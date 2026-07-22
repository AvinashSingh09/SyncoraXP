import {
  ArrowRight,
  Broadcast,
  CaretLeft,
  CaretRight,
  ChartLineUp,
  ChatTeardropText,
  GlobeHemisphereWest,
  MicrophoneStage,
  ShieldCheck,
  Star,
  Ticket,
  Translate,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { MarketingHeader } from "../components/MarketingHeader";
import { Footer } from "../components/Footer";

type SolutionKey = "webinar" | "virtual" | "registration";

const solutionContent = {
  webinar: {
    eyebrow: "Webinar service",
    title: "Turn every broadcast into a conversation.",
    description: "Deliver polished webinars with live audience controls, secure invitations, and a frictionless experience for hosts and guests.",
    route: "/webinar-service",
    action: "Explore webinar service",
    image: "/landing/syncoraxp-webinar-preview.png",
    imageAlt: "Presenter hosting a live SyncoraXP webinar",
    features: ["HD live rooms", "Audience engagement", "Host controls"],
  },
  virtual: {
    eyebrow: "Virtual Events Platform",
    title: "Create immersive events without borders.",
    description: "Bring keynotes, networking, and global audiences together in one branded digital destination built to scale.",
    route: "/virtual-events-platform",
    action: "Explore virtual events",
    image: "/landing/syncoraxp-live-stage.png",
    imageAlt: "Global audience joining a SyncoraXP virtual event",
    features: ["Global reach", "Live translation", "Flexible formats"],
  },
  registration: {
    eyebrow: "Event Registration",
    title: "Seamless guest check-in & event registration.",
    description: "Manage attendee sign-ups, issue instant QR ticket badges, and enable fast check-ins for in-person or hybrid events.",
    route: "/event-registration",
    action: "Explore event registration",
    image: "/landing/registration-landing.png",
    imageAlt: "Event registration and QR check-in preview",
    features: ["Instant QR tickets", "Guest badge scanning", "Real-time attendee list"],
  },
} as const;

const brandLogoFiles = [
  "1.jfif", "2.jfif", "3.webp", "4.jfif", "5.png", "6.png", "7.png", "8.png",
  "9.png", "10.png", "11.png", "12.png", "13.jpg", "14.png", "15.jfif", "16.avif", "16.jpg",
  "17.png", "18.png", "19.jfif", "20.png", "21.avif", "22.png", "23.png", "24.png",
  "25.svg", "26.png", "27.png", "28.png", "29.png", "30.png", "31.png", "32.png",
  "33-removebg-preview.png", "35.png", "36.png", "37.jfif"
];

const testimonials = [
  {
    quote: "The live stream quality & virtual stage was impressive. We hosted 5,000+ attendees seamlessly with zero latency. Outputs looked absolutely premium.",
    name: "Sneha Kapoor",
    role: "Brand Activation Manager",
    country: "INDIA",
    flag: "????",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    rating: 5,
  },
  {
    quote: "From face swap to branded overlays, everything felt customized. It aligned perfectly with our campaign identity.",
    name: "Omar Khan",
    role: "Creative Director, Advertising Agency",
    country: "DUBAI",
    flag: "????",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    rating: 5,
  },
  {
    quote: "The QR-based workflow was smooth and intuitive. Guests loved receiving instant downloads and badges on their phones.",
    name: "Fatima Al Balushi",
    role: "Marketing Specialist",
    country: "OMAN",
    flag: "????",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
    rating: 5,
  },
  {
    quote: "SyncoraXP's webinar platform doubled our event registration & engagement. High definition rooms and instant audience controls are top-notch.",
    name: "David Chen",
    role: "VP of Global Events",
    country: "USA",
    flag: "????",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    rating: 5,
  },
];

export function LandingPage() {
  const [activeSolution, setActiveSolution] = useState<SolutionKey>("webinar");
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const solution = solutionContent[activeSolution];

  const getSolutionIcon = (key: SolutionKey, size = 18) => {
    if (key === "webinar") return <MicrophoneStage size={size} weight="duotone" />;
    if (key === "virtual") return <Broadcast size={size} weight="duotone" />;
    return <Ticket size={size} weight="duotone" />;
  };

  const handlePrevTestimonial = () => {
    setTestimonialIndex((curr) => (curr === 0 ? testimonials.length - 1 : curr - 1));
  };

  const handleNextTestimonial = () => {
    setTestimonialIndex((curr) => (curr === testimonials.length - 1 ? 0 : curr + 1));
  };

  return (
    <main className="landing-page">
      <section className="landing-hero-shell">
        <MarketingHeader />
        <div className="landing-hero">
          <div className="landing-hero-copy">
            <h1>One platform for<br />moments that <span>matter.</span></h1>
            <p>Plan, host, and scale immersive virtual events and webinars. Engage audiences worldwide and make every moment count.</p>
          </div>
          <figure className="landing-stage">
            <img src="/landing/syncoraxp-live-stage.png" alt="SyncoraXP virtual summit with a global live audience" />
          </figure>
        </div>
      </section>

      <section className="webinar-lead-section" style={{ padding: "40px 0 60px", background: "transparent" }}>
        <div className="brand-logos-wrapper">
          <h3 className="brand-logos-title">Trusted by Global Leaders &amp; Industry Pioneers</h3>
          <div className="brand-marquee-track-outer">
            <div className="brand-marquee-track">
              {brandLogoFiles.map((file, idx) => (
                <img key={`b1-${idx}`} src={`/brands/${file}`} alt={`Brand Logo ${idx + 1}`} className="brand-normal-logo-img" loading="lazy" />
              ))}
              {brandLogoFiles.map((file, idx) => (
                <img key={`b2-${idx}`} src={`/brands/${file}`} alt={`Brand Logo ${idx + 1}`} className="brand-normal-logo-img" loading="lazy" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-solutions" id="solutions" aria-labelledby="solutions-heading">
        <h2 id="solutions-heading">Designed for every live format</h2>
        <div className="solution-tabs" role="tablist" aria-label="SyncoraXP solutions">
          <button type="button" role="tab" aria-selected={activeSolution === "webinar"} className={activeSolution === "webinar" ? "active" : ""} onClick={() => setActiveSolution("webinar")}>
            <MicrophoneStage size={18} weight="duotone" /> Webinar service
          </button>
          <button type="button" role="tab" aria-selected={activeSolution === "virtual"} className={activeSolution === "virtual" ? "active" : ""} onClick={() => setActiveSolution("virtual")}>
            <Broadcast size={18} weight="duotone" /> Virtual Events Platform
          </button>
          <button type="button" role="tab" aria-selected={activeSolution === "registration"} className={activeSolution === "registration" ? "active" : ""} onClick={() => setActiveSolution("registration")}>
            <Ticket size={18} weight="duotone" /> Event Registration
          </button>
        </div>
        <article className="solution-showcase" role="tabpanel">
          <div className="solution-showcase-copy">
            <span className="solution-icon">{getSolutionIcon(activeSolution, 27)}</span>
            <p className="section-kicker">{solution.eyebrow}</p>
            <h3>{solution.title}</h3>
            <p>{solution.description}</p>
            <div className="solution-feature-list">
              {solution.features.map((feature) => <span key={feature}><ShieldCheck size={16} weight="fill" /> {feature}</span>)}
            </div>
            <Link className="landing-button" to={solution.route}>{solution.action} <ArrowRight size={17} weight="bold" /></Link>
          </div>
          <img className="solution-showcase-image" src={solution.image} alt={solution.imageAlt} />
        </article>
      </section>

      <section className="landing-capabilities" id="capabilities" aria-labelledby="capabilities-heading">
        <div>
          <p className="section-kicker">Everything connected</p>
          <h2 id="capabilities-heading">Built to keep every audience in the moment.</h2>
        </div>
        <div className="capability-list">
          <article><GlobeHemisphereWest size={27} weight="duotone" /><strong>Global participation</strong><p>Bring speakers and guests together from anywhere.</p></article>
          <article><Translate size={27} weight="duotone" /><strong>Inclusive conversations</strong><p>Help every attendee follow the live experience.</p></article>
          <article><ChatTeardropText size={27} weight="duotone" /><strong>Audience engagement</strong><p>Turn passive viewing into an active conversation.</p></article>
          <article><ChartLineUp size={27} weight="duotone" /><strong>Confident hosting</strong><p>Stay in control from invitation through sign-off.</p></article>
        </div>
      </section>

      <section style={{ width: "100%", padding: "80px 0 100px", background: "linear-gradient(180deg, #090c24 0%, #0d1033 100%)", color: "#ffffff", position: "relative", overflow: "hidden" }}>
        <div style={{ width: "min(1280px, calc(100% - 48px))", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "48px" }}>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ font: "800 clamp(32px, 4vw, 48px) 'Manrope', sans-serif", color: "#ffffff", margin: "10px 0 0", letterSpacing: "-0.03em" }}>
              Loved by Event Teams Worldwide
            </h2>
          </div>

          <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <button
              type="button"
              aria-label="Previous Testimonials"
              onClick={handlePrevTestimonial}
              style={{ position: "absolute", left: "-18px", zIndex: 10, width: "48px", height: "48px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#ffffff", display: "grid", placeItems: "center", cursor: "pointer", backdropFilter: "blur(10px)", transition: "all 0.25s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(168,85,247,0.4)"; e.currentTarget.style.borderColor = "#a855f7"; e.currentTarget.style.transform = "scale(1.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "scale(1)"; }}
            >
              <CaretLeft size={22} weight="bold" />
            </button>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "28px", width: "100%", boxSizing: "border-box" }}>
              {[0, 1, 2].map((offset) => {
                const item = testimonials[(testimonialIndex + offset) % testimonials.length];
                if (!item) return null;
                return (
                  <div key={`${item.name}-${offset}`} style={{ background: "rgba(18,22,54,0.75)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", padding: "32px 28px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "24px", boxShadow: "0 20px 50px rgba(0,0,0,0.4)", backdropFilter: "blur(12px)", transition: "all 0.3s ease" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", gap: "4px", color: "#eab308" }}>
                        {[...Array(item.rating)].map((_, i) => <Star key={i} size={18} weight="fill" />)}
                      </div>
                      <span style={{ fontSize: "20px" }}>{item.flag}</span>
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.92)", fontSize: "15px", lineHeight: "1.65", fontStyle: "italic", margin: 0 }}>
                      "{item.quote}"
                    </p>
                    <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", width: "100%" }} />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <h4 style={{ font: "800 17px 'Manrope', sans-serif", color: "#ffffff", margin: 0 }}>{item.name}</h4>
                        <p style={{ color: "#94a3b8", fontSize: "12.5px", margin: "4px 0 8px" }}>{item.role}</p>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#a855f7", fontSize: "11px", fontWeight: 800, letterSpacing: "0.08em" }}>
                          <span style={{ width: "12px", height: "2px", background: "#a855f7" }} />
                          {item.country}
                        </span>
                      </div>
                      <img src={item.avatar} alt={item.name} style={{ width: "54px", height: "54px", borderRadius: "50%", objectFit: "cover", border: "2px solid #a855f7", boxShadow: "0 6px 16px rgba(168,85,247,0.3)" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              aria-label="Next Testimonials"
              onClick={handleNextTestimonial}
              style={{ position: "absolute", right: "-18px", zIndex: 10, width: "48px", height: "48px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#ffffff", display: "grid", placeItems: "center", cursor: "pointer", backdropFilter: "blur(10px)", transition: "all 0.25s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(168,85,247,0.4)"; e.currentTarget.style.borderColor = "#a855f7"; e.currentTarget.style.transform = "scale(1.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "scale(1)"; }}
            >
              <CaretRight size={22} weight="bold" />
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px" }}>
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Go to slide ${idx + 1}`}
                onClick={() => setTestimonialIndex(idx)}
                style={{ width: idx === testimonialIndex ? "28px" : "8px", height: "8px", borderRadius: "999px", background: idx === testimonialIndex ? "#a855f7" : "rgba(255,255,255,0.2)", border: "none", cursor: "pointer", transition: "all 0.3s ease", boxShadow: idx === testimonialIndex ? "0 0 12px rgba(168,85,247,0.6)" : "none" }}
              />
            ))}
          </div>
        </div>
      </section>

      <section style={{ width: "100%", padding: "90px 0 110px", background: "#f7f6fd", color: "#2a1758", textAlign: "center" }}>
        <div style={{ width: "min(1240px, calc(100% - 48px))", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "52px" }}>
          <h2 style={{ font: "800 clamp(34px, 4.2vw, 54px)/1.15 'Manrope', sans-serif", color: "#2a1758", margin: 0, letterSpacing: "-0.035em", maxWidth: "920px" }}>
            Great Tech backed by<br />Great Services = SyncoraXP
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", width: "100%", background: "#ffffff", border: "1px solid #e5e0f5", borderRadius: "28px", padding: "64px 0", boxShadow: "0 14px 45px rgba(42,23,88,0.05)", boxSizing: "border-box" }}>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "10px 32px", borderRight: "1.5px solid #f1f5f9" }}>
              <div style={{ marginBottom: "24px", height: "110px", display: "grid", placeItems: "center" }}>
                <img src="/landing/Round-the-Clock-Support (1).svg" alt="Round-the-Clock Support" style={{ width: "110px", height: "110px", objectFit: "contain" }} />
              </div>
              <h3 style={{ font: "800 24px/1.3 'Manrope', sans-serif", color: "#1e1b4b", margin: "0 0 12px" }}>Round-the-Clock<br />Support</h3>
              <p style={{ color: "#475569", fontSize: "15.5px", lineHeight: "1.6", margin: 0, maxWidth: "270px" }}>Help available anytime,<br />wherever you operate.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "10px 32px", borderRight: "1.5px solid #f1f5f9" }}>
              <div style={{ marginBottom: "24px", height: "110px", display: "grid", placeItems: "center" }}>
                <img src="/landing/Rapid-Issue-Resolution.svg" alt="Rapid Issue Resolution" style={{ width: "110px", height: "110px", objectFit: "contain" }} />
              </div>
              <h3 style={{ font: "800 24px/1.3 'Manrope', sans-serif", color: "#1e1b4b", margin: "0 0 12px" }}>Rapid Issue<br />Resolution</h3>
              <p style={{ color: "#475569", fontSize: "15.5px", lineHeight: "1.6", margin: 0, maxWidth: "270px" }}>Problems addressed<br />within minutes.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "10px 32px" }}>
              <div style={{ marginBottom: "24px", height: "110px", display: "grid", placeItems: "center" }}>
                <img src="/landing/Proven-System-Reliability.svg" alt="Proven System Reliability" style={{ width: "110px", height: "110px", objectFit: "contain" }} />
              </div>
              <h3 style={{ font: "800 24px/1.3 'Manrope', sans-serif", color: "#1e1b4b", margin: "0 0 12px" }}>Proven System<br />Reliability</h3>
              <p style={{ color: "#475569", fontSize: "15.5px", lineHeight: "1.6", margin: 0, maxWidth: "270px" }}>Enterprise-grade consistency<br />you can depend on.</p>
            </div>

          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
