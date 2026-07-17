import {
  ArrowRight,
  Broadcast,
  CaretDown,
  ChartLineUp,
  ChatTeardropText,
  GlobeHemisphereWest,
  List,
  MicrophoneStage,
  ShieldCheck,
  Sparkle,
  Translate,
  VideoCamera,
  X,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Brand } from "../components/Brand";

type SolutionKey = "webinar" | "virtual";

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
} as const;

export function LandingPage() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSolution, setActiveSolution] = useState<SolutionKey>("webinar");
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [solutionsPinned, setSolutionsPinned] = useState(false);
  const solutionsMenuRef = useRef<HTMLDivElement>(null);
  const solution = solutionContent[activeSolution];

  useEffect(() => {
    const updateHeader = () => setHeaderScrolled(window.scrollY > 12);

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    const closeSolutions = (event: PointerEvent) => {
      if (!solutionsMenuRef.current?.contains(event.target as Node)) {
        setSolutionsOpen(false);
        setSolutionsPinned(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSolutionsOpen(false);
        setSolutionsPinned(false);
      }
    };

    document.addEventListener("pointerdown", closeSolutions);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeSolutions);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <main className="landing-page">
      <section className="landing-hero-shell">
        <header className={`landing-header${headerScrolled ? " is-scrolled" : ""}`}>
          <Brand />

          <nav className="landing-nav" aria-label="Primary navigation">
            <div
              ref={solutionsMenuRef}
              className={`solutions-menu${solutionsOpen ? " is-open" : ""}`}
              onMouseEnter={() => setSolutionsOpen(true)}
              onMouseLeave={() => {
                if (!solutionsPinned) setSolutionsOpen(false);
              }}
              onFocus={() => setSolutionsOpen(true)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node) && !solutionsPinned) {
                  setSolutionsOpen(false);
                }
              }}
            >
              <button
                className="solutions-trigger"
                type="button"
                aria-expanded={solutionsOpen}
                aria-controls="desktop-solutions-menu"
                onClick={() => {
                  setSolutionsPinned((current) => {
                    const next = !current;
                    setSolutionsOpen(next);
                    return next;
                  });
                }}
              >
                Solutions <CaretDown size={14} weight="bold" aria-hidden="true" />
              </button>

              {solutionsOpen && (
                <div className="solutions-dropdown" id="desktop-solutions-menu" role="menu">
                  <div className="mega-solution-list">
                    <Link
                      className="mega-solution-row"
                      to="/virtual-events-platform"
                      role="menuitem"
                      onClick={() => {
                        setSolutionsOpen(false);
                        setSolutionsPinned(false);
                      }}
                    >
                      <span className="mega-solution-title">
                        <Broadcast size={23} weight="duotone" />
                        <strong>Virtual Events Platform</strong>
                      </span>
                    </Link>
                    <Link
                      className="mega-solution-row"
                      to="/webinar-service"
                      role="menuitem"
                      onClick={() => {
                        setSolutionsOpen(false);
                        setSolutionsPinned(false);
                      }}
                    >
                      <span className="mega-solution-title">
                        <MicrophoneStage size={23} weight="duotone" />
                        <strong>Webinar service</strong>
                      </span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <a href="#solutions">Platform</a>
            <a href="#capabilities">Resources</a>
            <a href="#company">Company</a>
          </nav>

          <div className="landing-header-actions">
            <Link className="landing-sign-in" to={user ? "/webinar-service" : "/login"}>
              {user ? "Dashboard" : "Sign in"}
            </Link>
            <Link className="landing-button compact" to="/webinar-service">Start now</Link>
          </div>

          <button
            className="landing-menu-toggle"
            type="button"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((current) => !current)}
          >
            {mobileMenuOpen ? <X size={25} weight="bold" /> : <List size={27} weight="bold" />}
          </button>

          {mobileMenuOpen && (
            <nav className="landing-mobile-nav" aria-label="Mobile navigation">
              <details>
                <summary>Solutions <CaretDown size={15} weight="bold" /></summary>
                <div>
                  <Link to="/virtual-events-platform" onClick={() => setMobileMenuOpen(false)}>
                    <Broadcast size={18} weight="duotone" /> Virtual Events Platform
                  </Link>
                  <Link to="/webinar-service" onClick={() => setMobileMenuOpen(false)}>
                    <MicrophoneStage size={18} weight="duotone" /> Webinar service
                  </Link>
                </div>
              </details>
              <a href="#solutions" onClick={() => setMobileMenuOpen(false)}>Platform</a>
              <a href="#capabilities" onClick={() => setMobileMenuOpen(false)}>Resources</a>
              <Link to={user ? "/webinar-service" : "/login"} onClick={() => setMobileMenuOpen(false)}>
                {user ? "Open dashboard" : "Sign in"}
              </Link>
              <Link className="landing-button" to="/webinar-service" onClick={() => setMobileMenuOpen(false)}>Start now</Link>
            </nav>
          )}
        </header>

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

      <section className="landing-solutions" id="solutions" aria-labelledby="solutions-heading">
        <h2 id="solutions-heading">Designed for every live format</h2>
        <div className="solution-tabs" role="tablist" aria-label="SyncoraXP solutions">
          <button
            type="button"
            role="tab"
            aria-selected={activeSolution === "webinar"}
            className={activeSolution === "webinar" ? "active" : ""}
            onClick={() => setActiveSolution("webinar")}
          >
            <MicrophoneStage size={18} weight="duotone" /> Webinar service
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSolution === "virtual"}
            className={activeSolution === "virtual" ? "active" : ""}
            onClick={() => setActiveSolution("virtual")}
          >
            <Broadcast size={18} weight="duotone" /> Virtual Events Platform
          </button>
        </div>

        <article className="solution-showcase" role="tabpanel">
          <div className="solution-showcase-copy">
            <span className="solution-icon">
              {activeSolution === "webinar" ? <MicrophoneStage size={27} weight="duotone" /> : <Broadcast size={27} weight="duotone" />}
            </span>
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

      <section className="landing-cta" id="company">
        <VideoCamera size={32} weight="duotone" />
        <h2>Your next live moment starts here.</h2>
        <p>Create a secure room, invite your audience, and go live with confidence.</p>
        <Link className="landing-button" to="/webinar-service">Start a webinar <ArrowRight size={18} weight="bold" /></Link>
      </section>
    </main>
  );
}
