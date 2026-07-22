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
  ArrowUpRight
} from "@phosphor-icons/react";
import { MarketingHeader } from "../components/MarketingHeader";

const MILESTONES = [
  {
    year: "2012",
    title: "The Beginning",
    desc: "Started in 2012 with Ashutosh and Ankit Pandey with a vision to transform the event industry through technology and innovation.",
    icon: FlagBanner,
    colorClass: "pink",
    image: "/images/about/founders.png"
  },
  {
    year: "2014",
    title: "Building Foundations",
    desc: "Invested in research and development to build robust event tech solutions tailored for the Indian market.",
    icon: BookOpenText,
    colorClass: "orange",
    image: "/images/about/foundations.png"
  },
  {
    year: "2016",
    title: "Going Live",
    desc: "Launched our live streaming platform and powered 1000+ events across India successfully.",
    icon: Broadcast,
    colorClass: "cyan",
    image: "/images/about/going_live.png"
  },
  {
    year: "2019",
    title: "Expanding Horizons",
    desc: "Integrated ticketing and event management solutions and expanded our services nationwide.",
    icon: Ticket,
    colorClass: "green",
    image: "/images/about/horizons.png"
  },
  {
    year: "2023",
    title: "Hybrid & Virtual Scaling",
    desc: "Scaled virtual event rooms, live interactive webinars, and hybrid event technology across corporate summits.",
    icon: RocketLaunch,
    colorClass: "purple",
    image: "/images/about/future.png"
  },
  {
    year: "2026",
    title: "Sanranchana & SyncoraXP",
    desc: "Unveiling Sanranchana & SyncoraXP — our flagship next-generation platforms powering 3D virtual halls, AI networking, and enterprise stage streaming.",
    icon: Sparkle,
    colorClass: "gold",
    image: "/images/about/sanranchana_2026.png",
    isFlagship: true
  }
];

export function AboutPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToCard = (index: number) => {
    const targetIndex = Math.min(MILESTONES.length - 1, Math.max(0, index));
    setActiveIndex(targetIndex);
    isProgrammaticScroll.current = true;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const card = container.children[targetIndex] as HTMLElement;
      if (card) {
        // Calculate exact scroll position with comfortable padding offset
        const targetLeft = card.offsetLeft - container.offsetLeft - 16;
        container.scrollTo({
          left: Math.max(0, targetLeft),
          behavior: "smooth"
        });
      }
    }

    scrollTimeoutRef.current = setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 600);
  };

  const handleScroll = () => {
    if (isProgrammaticScroll.current || !scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const firstCard = container.children[0] as HTMLElement;
    const cardWidth = firstCard ? firstCard.offsetWidth : 340;
    const gap = 24;
    const newIndex = Math.min(
      MILESTONES.length - 1,
      Math.max(0, Math.round(container.scrollLeft / (cardWidth + gap)))
    );
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  return (
    <div className="landing-page about-page">
      <MarketingHeader />

      {/* Hero Section */}
      <section className="about-hero-section">
        <div className="about-hero-container">
          <div className="about-hero-dark-card">
            {/* Top Pill Tag */}
            <div className="about-pill-tag">
              <span className="pill-dot" />
              <span>ABOUT SYNCORAXP</span>
            </div>

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

            {/* 4 Feature Highlights Box */}
            <div className="about-features-card-box">
              <div className="about-features-grid">
                <div className="about-feature-item">
                  <div className="about-feature-3d-icon">
                    <Users size={22} weight="duotone" />
                  </div>
                  <div className="about-feature-info">
                    <div className="about-feature-heading">10+ Years</div>
                    <div className="about-feature-sub">of Experience</div>
                  </div>
                </div>

                <div className="about-feature-item">
                  <div className="about-feature-3d-icon">
                    <ShieldCheck size={22} weight="duotone" />
                  </div>
                  <div className="about-feature-info">
                    <div className="about-feature-heading">Enterprise</div>
                    <div className="about-feature-sub">Grade Security</div>
                  </div>
                </div>

                <div className="about-feature-item">
                  <div className="about-feature-3d-icon">
                    <Gear size={22} weight="duotone" />
                  </div>
                  <div className="about-feature-info">
                    <div className="about-feature-heading">End-to-End</div>
                    <div className="about-feature-sub">Event Solutions</div>
                  </div>
                </div>

                <div className="about-feature-item">
                  <div className="about-feature-3d-icon">
                    <Headset size={22} weight="duotone" />
                  </div>
                  <div className="about-feature-info">
                    <div className="about-feature-heading">24/7</div>
                    <div className="about-feature-sub">Support</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Statistics Box */}
            <div className="about-stats-card-box">
              <div className="about-stats-grid">
                <div className="about-stat-box">
                  <div className="about-stat-3d-icon">
                    <CalendarBlank size={22} weight="duotone" />
                  </div>
                  <div className="about-stat-info">
                    <div className="about-stat-number">20,000+</div>
                    <div className="about-stat-label">Events Powered</div>
                  </div>
                </div>

                <div className="about-stat-box">
                  <div className="about-stat-3d-icon">
                    <Users size={22} weight="duotone" />
                  </div>
                  <div className="about-stat-info">
                    <div className="about-stat-number">1M+</div>
                    <div className="about-stat-label">Attendees Engaged</div>
                  </div>
                </div>

                <div className="about-stat-box">
                  <div className="about-stat-3d-icon">
                    <Smiley size={22} weight="duotone" />
                  </div>
                  <div className="about-stat-info">
                    <div className="about-stat-number">500+</div>
                    <div className="about-stat-label">Happy Clients</div>
                  </div>
                </div>

                <div className="about-stat-box">
                  <div className="about-stat-3d-icon">
                    <Globe size={22} weight="duotone" />
                  </div>
                  <div className="about-stat-info">
                    <div className="about-stat-number">50+</div>
                    <div className="about-stat-label">Countries Served</div>
                  </div>
                </div>
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

          {/* Right Hero Image Wrap with Arc Cutout */}
          <div className="about-hero-image-wrap">
            <img
              src="/images/about_us_control_room.png"
              alt="SyncoraXP Live Event Production Control Center"
              className="about-hero-img"
            />
          </div>
        </div>
      </section>

      {/* OUR JOURNEY - Our Story From India */}
      <section className="our-story-section">
        <div className="our-story-bg-wrap">
          <img src="/images/about/india_bg.png" alt="India Landmarks & Event Stage" className="our-story-bg-img" />
          <div className="our-story-bg-overlay" />
        </div>

        <div className="our-story-container">
          {/* Header text & Year Tabs */}
          <div className="our-story-header-wrap">
            <div className="our-story-header">
              <div className="our-story-journey-tag">
                OUR JOURNEY —
              </div>
              <h2 className="our-story-title">
                Our Story <span className="our-story-gradient">From India</span>
              </h2>
              <p className="our-story-desc">
                From a small idea to powering thousands of events across the country, here's how <strong className="text-white">SyncoraXP</strong> has grown with passion, innovation, and purpose.
              </p>
            </div>

            {/* Nav Arrows */}
            <div className="story-nav-buttons">
              <button
                type="button"
                className="story-nav-btn"
                onClick={() => scrollToCard(Math.max(0, activeIndex - 1))}
                aria-label="Previous milestone"
              >
                <CaretLeft size={20} weight="bold" />
              </button>
              <button
                type="button"
                className="story-nav-btn"
                onClick={() => scrollToCard(Math.min(MILESTONES.length - 1, activeIndex + 1))}
                aria-label="Next milestone"
              >
                <CaretRight size={20} weight="bold" />
              </button>
            </div>
          </div>

          {/* Interactive Year Selector Tabs */}
          <div className="story-year-tabs">
            {MILESTONES.map((m, idx) => (
              <button
                key={m.year}
                type="button"
                className={`story-year-tab tab-${m.colorClass} ${activeIndex === idx ? "is-active" : ""}`}
                onClick={() => scrollToCard(idx)}
              >
                <span className="tab-year">{m.year}</span>
                {m.isFlagship && <span className="tab-flagship-badge">FLAGSHIP</span>}
              </button>
            ))}
          </div>

          {/* Scrollable Timeline Track */}
          <div className="story-timeline-scroll-wrap">
            <div className="story-timeline-line-track">
              <div
                className="story-timeline-line-progress"
                style={{ width: `${((activeIndex + 1) / MILESTONES.length) * 100}%` }}
              />
            </div>

            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="story-timeline-grid-scrollable"
            >
              {MILESTONES.map((m, idx) => {
                const IconComponent = m.icon;
                const isActive = activeIndex === idx;
                return (
                  <div
                    key={m.year}
                    className={`story-card card-${m.colorClass} ${isActive ? "is-active-card" : ""} ${m.isFlagship ? "is-flagship-card" : ""}`}
                    onClick={() => scrollToCard(idx)}
                  >
                    <div className={`story-icon-badge story-badge-${m.colorClass}`}>
                      <IconComponent size={22} weight="bold" />
                    </div>
                    <div className={`story-year story-year-${m.colorClass}`}>
                      {m.year}
                    </div>
                    <h3 className="story-card-title">{m.title}</h3>
                    <p className="story-card-desc">{m.desc}</p>
                    <div className="story-card-img-wrap">
                      <img src={m.image} alt={m.title} />
                      {m.isFlagship && (
                        <div className="flagship-overlay-badge">
                          <Sparkle size={14} weight="fill" />
                          <span>Sanranchana & SyncoraXP</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
