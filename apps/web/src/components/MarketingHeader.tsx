import {
  Broadcast, CaretDown, List, MicrophoneStage, X, Ticket,
  User, Briefcase, PhoneCall, GlobeHemisphereWest, CursorClick, ShieldCheck,
  InstagramLogo, LinkedinLogo, YoutubeLogo, FacebookLogo, XLogo
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Brand } from "./Brand";

export function MarketingHeader() {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [solutionsPinned, setSolutionsPinned] = useState(false);
  const solutionsMenuRef = useRef<HTMLDivElement>(null);

  const [companyOpen, setCompanyOpen] = useState(false);
  const [companyPinned, setCompanyPinned] = useState(false);
  const companyMenuRef = useRef<HTMLDivElement>(null);
  const landingAnchor = (hash: string) => location.pathname === "/" ? hash : `/${hash}`;

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
      if (!companyMenuRef.current?.contains(event.target as Node)) {
        setCompanyOpen(false);
        setCompanyPinned(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSolutionsOpen(false);
        setSolutionsPinned(false);
        setCompanyOpen(false);
        setCompanyPinned(false);
      }
    };

    document.addEventListener("pointerdown", closeSolutions);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeSolutions);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const isAboutPage = location.pathname.startsWith("/about") || location.pathname === "/" || location.pathname.startsWith("/virtual-events-platform");

  return (
    <header className={`landing-header${headerScrolled ? " is-scrolled" : ""}${isAboutPage ? " is-about-header" : ""}`}>
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
                <Link
                  className="mega-solution-row"
                  to="/event-registration"
                  role="menuitem"
                  onClick={() => {
                    setSolutionsOpen(false);
                    setSolutionsPinned(false);
                  }}
                >
                  <span className="mega-solution-title">
                    <Ticket size={23} weight="duotone" />
                    <strong>Event Registration</strong>
                  </span>
                </Link>
              </div>
            </div>
          )}
        </div>
        <a href={landingAnchor("#solutions")}>Platform</a>
        <a href={landingAnchor("#capabilities")}>Resources</a>
        <div
          ref={companyMenuRef}
          className={`solutions-menu${companyOpen ? " is-open" : ""}`}
          onMouseEnter={() => setCompanyOpen(true)}
          onMouseLeave={() => {
            if (!companyPinned) setCompanyOpen(false);
          }}
          onFocus={() => setCompanyOpen(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node) && !companyPinned) {
              setCompanyOpen(false);
            }
          }}
        >
          <button
            className="solutions-trigger"
            type="button"
            aria-expanded={companyOpen}
            aria-controls="desktop-company-menu"
            onClick={() => {
              setCompanyPinned((current) => {
                const next = !current;
                setCompanyOpen(next);
                return next;
              });
            }}
          >
            Company <CaretDown size={14} weight="bold" aria-hidden="true" />
          </button>

          {companyOpen && (
            <div className="solutions-dropdown company-dropdown" id="desktop-company-menu" role="menu">
              <div className="company-dropdown-layout">
                <div className="company-dropdown-left">
                  <div className="company-section-title">COMPANY</div>
                  <div className="company-grid">
                    <Link className="mega-solution-row" to="/about" role="menuitem" onClick={() => { setCompanyOpen(false); setCompanyPinned(false); }}>
                      <span className="mega-solution-title">
                        <User size={23} weight="duotone" />
                        <div>
                          <strong>About</strong>
                          <small>Your Event-Tech Partner</small>
                        </div>
                      </span>
                    </Link>
                    <Link className="mega-solution-row" to="/careers" role="menuitem" onClick={() => { setCompanyOpen(false); setCompanyPinned(false); }}>
                      <span className="mega-solution-title">
                        <Briefcase size={23} weight="duotone" />
                        <div>
                          <strong>Careers</strong>
                          <small>Join us in creating cutting-edge solutions for events</small>
                        </div>
                      </span>
                    </Link>
                    <Link className="mega-solution-row" to="/book-demo" role="menuitem" onClick={() => { setCompanyOpen(false); setCompanyPinned(false); }}>
                      <span className="mega-solution-title">
                        <PhoneCall size={23} weight="duotone" />
                        <div>
                          <strong>Contact Us</strong>
                          <small>Got a Question? Get in touch now.</small>
                        </div>
                      </span>
                    </Link>
                    <div className="mega-solution-row company-social-row">
                      <span className="mega-solution-title">
                        <GlobeHemisphereWest size={23} weight="duotone" />
                        <div>
                          <strong>Find Us At</strong>
                          <div className="company-social-icons">
                            <a href="https://www.instagram.com/360brightmedia?igsh=MXF4djN5YXgyYnR3eQ==" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><InstagramLogo size={20} /></a>
                            <a href="https://www.linkedin.com/company/360-bright-media/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><LinkedinLogo size={20} /></a>
                            <a href="https://www.youtube.com/@360brightmedia8/featured" target="_blank" rel="noopener noreferrer" aria-label="Youtube"><YoutubeLogo size={20} /></a>
                            <a href="https://www.instagram.com/360brightmedia?igsh=MXF4djN5YXgyYnR3eQ==" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FacebookLogo size={20} /></a>
                            <a href="https://www.linkedin.com/company/360-bright-media/" target="_blank" rel="noopener noreferrer" aria-label="X"><XLogo size={20} /></a>
                          </div>
                        </div>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="company-dropdown-right">
                  <Link className="company-right-card" to="/why-syncoraxp" onClick={() => { setCompanyOpen(false); setCompanyPinned(false); }}>
                    <span className="mega-solution-title">
                      <CursorClick size={23} weight="duotone" />
                      <div>
                        <strong>Why Choose SyncoraXP</strong>
                        <small>Empower your events with SyncoraXP's comprehensive event-tech suite</small>
                      </div>
                    </span>
                  </Link>
                  <Link className="company-right-card" to="/trust-security" onClick={() => { setCompanyOpen(false); setCompanyPinned(false); }}>
                    <span className="mega-solution-title">
                      <ShieldCheck size={23} weight="duotone" />
                      <div>
                        <strong>Trust and Security</strong>
                        <small>SyncoraXP prioritizes trust and security, being your event's secure partner</small>
                      </div>
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="landing-header-actions">
        <Link className="landing-sign-in" to={user ? "/webinar-service" : "/login"}>
          {user ? "Dashboard" : "Sign in"}
        </Link>
        <Link className="landing-button compact" to="/book-demo">
          Book a demo
        </Link>
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
              <Link to="/event-registration" onClick={() => setMobileMenuOpen(false)}>
                <Ticket size={18} weight="duotone" /> Event Registration
              </Link>
            </div>
          </details>
          <a href={landingAnchor("#solutions")} onClick={() => setMobileMenuOpen(false)}>Platform</a>
          <a href={landingAnchor("#capabilities")} onClick={() => setMobileMenuOpen(false)}>Resources</a>
          <Link to={user ? "/webinar-service" : "/login"} onClick={() => setMobileMenuOpen(false)}>
            {user ? "Open dashboard" : "Sign in"}
          </Link>
          <Link className="landing-button" to="/book-demo" onClick={() => setMobileMenuOpen(false)}>
            Book a demo
          </Link>
        </nav>
      )}
    </header>
  );
}
