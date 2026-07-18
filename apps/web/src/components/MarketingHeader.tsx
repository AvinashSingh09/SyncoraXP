import { Broadcast, CaretDown, List, MicrophoneStage, X } from "@phosphor-icons/react";
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
        <a href={landingAnchor("#solutions")}>Platform</a>
        <a href={landingAnchor("#capabilities")}>Resources</a>
        <a href={landingAnchor("#company")}>Company</a>
      </nav>

      <div className="landing-header-actions">
        <Link className="landing-sign-in" to={user ? "/webinar-service" : "/login"}>
          {user ? "Dashboard" : "Sign in"}
        </Link>
        <Link className="landing-button compact" to="/virtual-events-platform/book-demo">
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
            </div>
          </details>
          <a href={landingAnchor("#solutions")} onClick={() => setMobileMenuOpen(false)}>Platform</a>
          <a href={landingAnchor("#capabilities")} onClick={() => setMobileMenuOpen(false)}>Resources</a>
          <Link to={user ? "/webinar-service" : "/login"} onClick={() => setMobileMenuOpen(false)}>
            {user ? "Open dashboard" : "Sign in"}
          </Link>
          <Link className="landing-button" to="/virtual-events-platform/book-demo" onClick={() => setMobileMenuOpen(false)}>
            Book a demo
          </Link>
        </nav>
      )}
    </header>
  );
}
