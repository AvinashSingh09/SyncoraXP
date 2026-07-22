import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  ShieldCheck,
  Gear,
  Headset,
  FlagBanner,
  BookOpenText,
  Broadcast,
  Ticket,
  RocketLaunch,
  Sparkle,
  CaretLeft,
  CaretRight,
  CalendarBlank,
  Smiley,
  Globe,
  ArrowRight,
  ArrowUpRight,
  Buildings,
  MapPinLine,
  ShoppingBag,
  Diamond,
  FilmStrip,
  Waves,
  CookingPot
} from "@phosphor-icons/react";
import { MarketingHeader } from "../components/MarketingHeader";

const AWARDS = [
  {
    id: "brand-storyz",
    title: "afaqs! Brand Storyz Awards 2025",
    image: "/images/awards/brand_storyz_2025.jpg"
  },
  {
    id: "creative-engine",
    title: "Creative Engine Expo Awards 2025",
    image: "/images/awards/creative_engine_expo_2025.jpg",
    objectFit: "contain" as const,
    objectPosition: "center"
  },
  {
    id: "communicon",
    title: "afaqs! Communicon Awards 2025",
    image: "/images/awards/communicon_2025.jpg"
  },
  {
    id: "communicon-team",
    title: "Communicon Team Excellence Awards",
    image: "/images/awards/communicon_team.jpg"
  },
  {
    id: "realtime",
    title: "Real Time Advertising Awards 2024",
    image: "/images/awards/realtime_ad_2024.jpg"
  },
  {
    id: "exhibition",
    title: "Exhibition Excellence Awards 2025 (EEA)",
    image: "/images/awards/exhibition_excellence_2025.jpg"
  }
];

function AwardCardItem({ award }: { award: { id: string; title: string; image: string; objectFit?: "cover" | "contain"; objectPosition?: string } }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="award-card">
      <div className="award-card-img-wrap">
        {!imgError ? (
          <img
            src={award.image}
            alt={award.title}
            style={{
              objectFit: award.objectFit || "cover",
              objectPosition: award.objectPosition || "center 30%"
            }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="award-card-placeholder-text">
            <Sparkle size={32} weight="duotone" />
            <span>Upload {award.title} Photo</span>
          </div>
        )}
      </div>
      <h3 className="award-card-title">{award.title}</h3>
    </div>
  );
}

export function AboutPage() {
  const awardsScrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="landing-page about-page">
      <MarketingHeader />

      {/* Hero Section */}
      <section className="about-hero-section">
        <div className="about-hero-container">
          <div className="about-hero-dark-card">


            {/* Headline */}
            <h1 className="about-hero-title">
              Creating Technology That Makes Every Event <span className="about-purple-gradient">Exceptional</span>
            </h1>

            {/* Sub-paragraph */}
            <p className="about-hero-desc">
              At <strong className="text-purple-highlight">SyncoraXP</strong>, we believe great events deserve exceptional technology.
              We design intelligent, scalable, and secure event solutions that simplify operations,
              enhance attendee engagement, and empower organizations to deliver unforgettable
              experiences—whether in-person, virtual, or hybrid.
            </p>

            {/* Hero Inline Stats Bar */}
            <div className="about-hero-stats-strip">
              <div className="about-hero-stat-pill">
                <span className="stat-pill-num">10+ Years</span>
                <span className="stat-pill-label">Event Tech Leadership</span>
              </div>
              <div className="stat-pill-divider" />
              <div className="about-hero-stat-pill">
                <span className="stat-pill-num">20,000+</span>
                <span className="stat-pill-label">Events Powered</span>
              </div>
              <div className="stat-pill-divider" />
              <div className="about-hero-stat-pill">
                <span className="stat-pill-num">1M+</span>
                <span className="stat-pill-label">Attendees Engaged</span>
              </div>
              <div className="stat-pill-divider" />
              <div className="about-hero-stat-pill">
                <span className="stat-pill-num">50+</span>
                <span className="stat-pill-label">Countries Served</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="about-hero-actions">
              <Link to="/virtual-events-platform" className="about-btn-primary">
                <span>Discover Our Solutions</span>
                <span className="about-btn-arrow-circle">
                  <ArrowRight size={14} weight="bold" />
                </span>
              </Link>

              <Link to="/book-demo" className="about-btn-text-link">
                <span>Talk to Our Experts</span>
                <ArrowUpRight size={16} weight="bold" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* RECOGNIZED FOR EXCELLENCE SECTION */}
      <section className="awards-section">
        <div className="awards-container">
          <div className="awards-header-wrap">
            <div className="awards-header-text">
              <h2 className="awards-title">
                Recognized for <span className="awards-title-gradient">Excellence</span>
              </h2>
              <p className="awards-subtitle">
                Awards that highlight our dedication to innovation, performance, and delivering world-class solutions.
              </p>
            </div>

            <div className="awards-nav-buttons">
              <button
                type="button"
                className="awards-nav-btn"
                onClick={() => {
                  if (awardsScrollRef.current) {
                    const scrollAmount = (awardsScrollRef.current.offsetWidth - 72) / 4 + 24;
                    awardsScrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
                  }
                }}
                aria-label="Previous award"
              >
                <CaretLeft size={18} weight="bold" />
              </button>
              <button
                type="button"
                className="awards-nav-btn"
                onClick={() => {
                  if (awardsScrollRef.current) {
                    const scrollAmount = (awardsScrollRef.current.offsetWidth - 72) / 4 + 24;
                    awardsScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
                  }
                }}
                aria-label="Next award"
              >
                <CaretRight size={18} weight="bold" />
              </button>
            </div>
          </div>

          <div ref={awardsScrollRef} className="awards-grid-scrollable">
            {AWARDS.map((award) => (
              <AwardCardItem key={award.id} award={award} />
            ))}
          </div>
        </div>
      </section>

      {/* OUR PRESENCE SECTION - DELHI, MUMBAI, DUBAI */}
      <section className="presence-section">
        <div className="presence-container">
          <div className="presence-header">
            <h2 className="presence-title">
              Our Presence Across <span className="presence-gradient">Delhi, Mumbai & Dubai</span>
            </h2>
            <p className="presence-subtitle">
              Powering exceptional event experiences with dedicated hubs across key international capitals.
            </p>
          </div>

          <div className="presence-grid">
            {/* DELHI CARD */}
            <div className="presence-city-card city-card-delhi">
              <div className="presence-card-bg-wrap">
                <img src="/images/cities/delhi.jpg" alt="Delhi India Gate Landmark" className="presence-card-bg-img" />
                <div className="presence-card-gradient-overlay" />
              </div>

              <div className="presence-card-content">
                {/* Top Badge */}
                <div className="city-country-badge">
                  <Buildings size={13} weight="bold" />
                  <span>INDIA</span>
                </div>

                {/* Main Name Only */}
                <div className="city-title-block">
                  <h3 className="city-main-name">DELHI</h3>
                </div>
              </div>
            </div>

            {/* MUMBAI CARD */}
            <div className="presence-city-card city-card-mumbai">
              <div className="presence-card-bg-wrap">
                <img src="/images/cities/mumbai.jpg" alt="Mumbai Marine Drive Skyline" className="presence-card-bg-img" />
                <div className="presence-card-gradient-overlay" />
              </div>

              <div className="presence-card-content">
                {/* Top Badge */}
                <div className="city-country-badge">
                  <Buildings size={13} weight="bold" />
                  <span>INDIA</span>
                </div>

                {/* Main Name Only */}
                <div className="city-title-block">
                  <h3 className="city-main-name">MUMBAI</h3>
                </div>
              </div>
            </div>

            {/* DUBAI CARD */}
            <div className="presence-city-card city-card-dubai">
              <div className="presence-card-bg-wrap">
                <img src="/images/cities/dubai.jpg" alt="Dubai Burj Khalifa Skyline" className="presence-card-bg-img" />
                <div className="presence-card-gradient-overlay" />
              </div>

              <div className="presence-card-content">
                {/* Top Badge */}
                <div className="city-country-badge">
                  <Globe size={13} weight="bold" />
                  <span>UAE</span>
                </div>

                {/* Main Name Only */}
                <div className="city-title-block">
                  <h3 className="city-main-name">DUBAI</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
