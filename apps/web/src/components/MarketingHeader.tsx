import {
  Broadcast, CaretDown, List, MicrophoneStage, X, Ticket,
  User, Briefcase, PhoneCall, GlobeHemisphereWest, CursorClick, ShieldCheck,
  InstagramLogo, LinkedinLogo, YoutubeLogo, FacebookLogo, XLogo, MapPin, CaretRight
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

  const isAboutPage =
    location.pathname.startsWith("/about") ||
    location.pathname === "/" ||
    location.pathname.startsWith("/virtual-events-platform") ||
    location.pathname.startsWith("/book-demo") ||
    location.pathname.startsWith("/webinar-service");

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
            <div
              className="company-dropdown-bar"
              id="desktop-company-menu"
              role="menu"
              style={{
                position: "absolute",
                top: "calc(100% + 14px)",
                left: "50%",
                transform: "translateX(-50%)",
                width: "min(880px, calc(100vw - 48px))",
                background: "linear-gradient(135deg, rgba(243, 232, 255, 0.94) 0%, rgba(255, 255, 255, 0.98) 50%, rgba(243, 232, 255, 0.94) 100%)",
                borderRadius: "22px",
                border: "1.5px solid rgba(147, 51, 234, 0.18)",
                boxShadow: "0 20px 50px rgba(91, 20, 189, 0.16)",
                padding: "16px 20px",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "0",
                boxSizing: "border-box",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                zIndex: 1000,
              }}
            >
              {/* Column 1: About */}
              <Link
                to="/about"
                role="menuitem"
                onClick={() => { setCompanyOpen(false); setCompanyPinned(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "12px 18px",
                  textDecoration: "none",
                  borderRight: "1px solid rgba(147, 51, 234, 0.12)",
                  transition: "all 0.2s ease",
                  borderRadius: "14px 0 0 14px",
                }}
                className="company-hover-col"
              >
                {/* Icon Badge */}
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "#ffffff",
                  border: "1px solid rgba(147, 51, 234, 0.18)",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 6px 16px rgba(91, 20, 189, 0.12)",
                  flexShrink: 0,
                }}>
                  <User size={22} weight="regular" color="#7c3aed" />
                </div>

                {/* Text Group */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <strong style={{ fontSize: "16px", fontWeight: 850, color: "#1e1035", lineHeight: 1.2 }}>
                    About
                  </strong>
                  <div style={{
                    width: "30px",
                    height: "3px",
                    borderRadius: "2px",
                    background: "linear-gradient(90deg, #7c3aed 0%, #a855f7 100%)",
                    margin: "3px 0 4px 0",
                  }} />
                  <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 500, lineHeight: 1.3 }}>
                    Your Event-Tech Partner
                  </span>
                </div>

                {/* Arrow Circle */}
                <div
                  className="company-arrow-btn"
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: "1.5px solid rgba(124, 58, 237, 0.25)",
                    display: "grid",
                    placeItems: "center",
                    color: "#7c3aed",
                    flexShrink: 0,
                    transition: "all 0.2s ease",
                  }}
                >
                  <CaretRight size={14} weight="bold" />
                </div>
              </Link>

              {/* Column 2: Contact Us */}
              <Link
                to="/book-demo"
                role="menuitem"
                onClick={() => { setCompanyOpen(false); setCompanyPinned(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "12px 18px",
                  textDecoration: "none",
                  borderRight: "1px solid rgba(147, 51, 234, 0.12)",
                  transition: "all 0.2s ease",
                }}
                className="company-hover-col"
              >
                {/* Icon Badge */}
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "#ffffff",
                  border: "1px solid rgba(147, 51, 234, 0.18)",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 6px 16px rgba(91, 20, 189, 0.12)",
                  flexShrink: 0,
                }}>
                  <PhoneCall size={22} weight="regular" color="#7c3aed" />
                </div>

                {/* Text Group */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <strong style={{ fontSize: "16px", fontWeight: 850, color: "#1e1035", lineHeight: 1.2 }}>
                    Contact Us
                  </strong>
                  <div style={{
                    width: "30px",
                    height: "3px",
                    borderRadius: "2px",
                    background: "linear-gradient(90deg, #7c3aed 0%, #a855f7 100%)",
                    margin: "3px 0 4px 0",
                  }} />
                  <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 500, lineHeight: 1.3 }}>
                    Got a Question? Get in touch now.
                  </span>
                </div>

                {/* Arrow Circle */}
                <div
                  className="company-arrow-btn"
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: "1.5px solid rgba(124, 58, 237, 0.25)",
                    display: "grid",
                    placeItems: "center",
                    color: "#7c3aed",
                    flexShrink: 0,
                    transition: "all 0.2s ease",
                  }}
                >
                  <CaretRight size={14} weight="bold" />
                </div>
              </Link>

              {/* Column 3: Find Us At */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "12px 18px",
                  borderRadius: "0 14px 14px 0",
                }}
                className="company-hover-col"
              >
                {/* Icon Badge */}
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "#ffffff",
                  border: "1px solid rgba(147, 51, 234, 0.18)",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 6px 16px rgba(91, 20, 189, 0.12)",
                  flexShrink: 0,
                }}>
                  <GlobeHemisphereWest size={22} weight="regular" color="#7c3aed" />
                </div>

                {/* Text & Social Icons Group */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <strong style={{ fontSize: "16px", fontWeight: 850, color: "#1e1035", lineHeight: 1.2 }}>
                    Find Us At
                  </strong>
                  <div style={{
                    width: "30px",
                    height: "3px",
                    borderRadius: "2px",
                    background: "linear-gradient(90deg, #7c3aed 0%, #a855f7 100%)",
                    margin: "3px 0 6px 0",
                  }} />

                  {/* All 5 Social Media Links Row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <a
                      href="https://www.instagram.com/360brightmedia?igsh=MXF4djN5YXgyYnR3eQ=="
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "#ffffff",
                        border: "1.5px solid rgba(124, 58, 237, 0.25)",
                        color: "#7c3aed",
                        display: "grid",
                        placeItems: "center",
                        textDecoration: "none",
                        transition: "all 0.2s ease",
                      }}
                      className="social-icon-btn"
                    >
                      <InstagramLogo size={14} />
                    </a>

                    <a
                      href="https://www.linkedin.com/company/360-bright-media/"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="LinkedIn"
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "#ffffff",
                        border: "1.5px solid rgba(124, 58, 237, 0.25)",
                        color: "#7c3aed",
                        display: "grid",
                        placeItems: "center",
                        textDecoration: "none",
                        transition: "all 0.2s ease",
                      }}
                      className="social-icon-btn"
                    >
                      <LinkedinLogo size={14} />
                    </a>

                    <a
                      href="https://www.youtube.com/@360brightmedia8/featured"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="YouTube"
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "#ffffff",
                        border: "1.5px solid rgba(124, 58, 237, 0.25)",
                        color: "#7c3aed",
                        display: "grid",
                        placeItems: "center",
                        textDecoration: "none",
                        transition: "all 0.2s ease",
                      }}
                      className="social-icon-btn"
                    >
                      <YoutubeLogo size={14} />
                    </a>

                    <a
                      href="https://www.instagram.com/360brightmedia?igsh=MXF4djN5YXgyYnR3eQ=="
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "#ffffff",
                        border: "1.5px solid rgba(124, 58, 237, 0.25)",
                        color: "#7c3aed",
                        display: "grid",
                        placeItems: "center",
                        textDecoration: "none",
                        transition: "all 0.2s ease",
                      }}
                      className="social-icon-btn"
                    >
                      <FacebookLogo size={14} />
                    </a>

                    <a
                      href="https://www.linkedin.com/company/360-bright-media/"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="X"
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "#ffffff",
                        border: "1.5px solid rgba(124, 58, 237, 0.25)",
                        color: "#7c3aed",
                        display: "grid",
                        placeItems: "center",
                        textDecoration: "none",
                        transition: "all 0.2s ease",
                      }}
                      className="social-icon-btn"
                    >
                      <XLogo size={14} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="landing-header-actions">
        <Link className="landing-sign-in" to={user ? "/webinar-service/meetings" : "/login"}>
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
          <Link to={user ? "/webinar-service/meetings" : "/login"} onClick={() => setMobileMenuOpen(false)}>
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
