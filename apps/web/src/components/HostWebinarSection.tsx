import { useState } from "react";
import {
  VideoCamera,
  Palette,
  SquaresFour,
  PencilSimple,
  Users,
  User,
  Gear,
  Sparkle,
  ArrowRight,
  MagicWand,
  Desktop,
  ChatTeardropText,
  Record,
  TrendUp,
  Lightning,
  ChartBar,
  ShieldCheck,
  Cloud,
  ThumbsUp,
  HandsClapping,
  Heart,
  Eye,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";

export function HostWebinarSection() {
  const [activeTab, setActiveTab] = useState<"themes" | "layouts" | "branding" | "engagement">("themes");
  const [activeControl, setActiveControl] = useState<string | null>("hd");

  return (
    <section className="host-webinar-section" aria-label="Host A Webinar Showcase">
      <div className="host-webinar-container">
        
        {/* Top Section Header */}
        <div className="host-webinar-top-bar">
          <div className="host-webinar-label">
            <VideoCamera size={18} weight="fill" />
            <span>Host A Webinar</span>
          </div>
        </div>

        {/* 3-Column Main Showcase Grid */}
        <div className="host-webinar-grid">
          
          {/* Column 1: Left Customizer & Hero Info */}
          <div className="host-webinar-left-col">
            <h2 className="host-webinar-title">
              Your Audience <br />
              <span className="gradient-text-cyan-pink">Your Way</span>
            </h2>

            <p className="host-webinar-subtext">
              Engage, interact and inspire with next-gen webinars built for everyone.
            </p>

            {/* Customizer Card (Fully Customizable Showcase) */}
            <div className="host-customizer-card fully-customizable-card">
              {/* Header Row */}
              <div className="customizer-card-top">
                <div className="customizer-title-group">
                  <div className="customizer-purple-hexagon">
                    <PencilSimple size={18} weight="fill" />
                  </div>
                  <h3>Fully Customizable</h3>
                </div>
                <button className="customizer-sparkle-btn" aria-label="Customize options">
                  <Sparkle size={18} weight="fill" />
                </button>
              </div>

              {/* Main Content Stage: 2x2 Grid + Vertical Control Strip */}
              <div className="customizer-stage-wrapper">
                {/* 2x2 Video Participants Grid */}
                <div className="customizer-video-grid">
                  <div className="grid-user-card">
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80"
                      alt="Professional Executive 1"
                    />
                  </div>
                  <div className="grid-user-card">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
                      alt="Professional Executive 2"
                    />
                  </div>
                  <div className="grid-user-card">
                    <img
                      src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80"
                      alt="Professional Executive 3"
                    />
                  </div>
                  <div className="grid-user-card">
                    <img
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80"
                      alt="Professional Executive 4"
                    />
                  </div>
                </div>

                {/* Right Vertical Control Toolbar Strip */}
                <div className="vertical-toolbar-strip">
                  <button className="toolbar-btn">
                    <User size={18} weight="bold" />
                  </button>
                  <button className="toolbar-btn">
                    <Users size={18} weight="bold" />
                  </button>
                  <button className="toolbar-btn">
                    <ChatTeardropText size={18} weight="bold" />
                  </button>
                  <button className="toolbar-btn active">
                    <SquaresFour size={18} weight="fill" />
                  </button>
                  <button className="toolbar-btn">
                    <Gear size={18} weight="bold" />
                  </button>
                </div>
              </div>

              {/* Bottom Capsule Tag */}
              <div className="customizer-bottom-capsule">
                <Palette size={18} weight="fill" />
                <span>Design. Brand. Personalize.</span>
              </div>
            </div>
          </div>

          {/* Column 2: Center Live Webinar Player Card */}
          <div className="host-webinar-center-col">
            <div className="live-player-card">
              {/* Speaker Main Background Video/Photo */}
              <img
                src="/landing/webinar-audience-speaker-v2.png"
                alt="Webinar Host presenting live"
                className="live-speaker-photo"
              />

              {/* Top Badges */}
              <div className="live-top-badges">
                <div className="live-badge-red">
                  <span className="live-pulse-dot" />
                  <span>LIVE</span>
                </div>
                <div className="live-viewers-badge">
                  <Eye size={14} weight="bold" />
                  <span>2.4K</span>
                </div>
              </div>

              {/* Integrated Control Bar */}
              <div className="live-control-bar">
                <button
                  className={`control-pill hd-pill ${activeControl === "hd" ? "active" : ""}`}
                  onClick={() => setActiveControl(activeControl === "hd" ? null : "hd")}
                >
                  <div className="icon-badge-box hd-box">
                    <span>HD</span>
                  </div>
                  <span className="control-label">HD Quality</span>
                </button>

                <button
                  className={`control-pill screen-pill ${activeControl === "screen" ? "active" : ""}`}
                  onClick={() => setActiveControl(activeControl === "screen" ? null : "screen")}
                >
                  <div className="icon-badge-box screen-box">
                    <Desktop size={15} weight="bold" />
                  </div>
                  <span className="control-label">Screen Share</span>
                </button>

                <button
                  className={`control-pill chat-pill ${activeControl === "chat" ? "active" : ""}`}
                  onClick={() => setActiveControl(activeControl === "chat" ? null : "chat")}
                >
                  <div className="icon-badge-box chat-box">
                    <ChatTeardropText size={15} weight="bold" />
                  </div>
                  <span className="control-label">Live Chat</span>
                </button>

                <button
                  className={`control-pill record-pill ${activeControl === "record" ? "active" : ""}`}
                  onClick={() => setActiveControl(activeControl === "record" ? null : "record")}
                >
                  <div className="icon-badge-box record-box">
                    <Record size={15} weight="fill" />
                  </div>
                  <span className="control-label">Record</span>
                </button>
              </div>
            </div>
          </div>

          {/* Column 3: Right Audience Engagement Card */}
          <div className="host-webinar-right-col">
            <div className="engagement-card">
              
              {/* Card Header */}
              <div className="engagement-card-header">
                <div className="engagement-hexagon-badge">
                  <Users size={18} weight="fill" />
                </div>
                <div className="engagement-header-title">
                  <h3>Engage Your Audience</h3>
                  <p>Live reactions, polls, Q&A and more.</p>
                </div>
                <div className="engagement-trend-icon">
                  <TrendUp size={20} weight="bold" />
                </div>
              </div>

              {/* Main Participant Photo & Animated Reactions */}
              <div className="audience-photo-stage">
                <img
                  src="/landing/professional-speaker-green.jpg"
                  alt="Professional businesswoman webinar speaker"
                  className="audience-photo"
                />

                {/* Floating Emojis / Live Reactions */}
                <div className="floating-reaction reaction-love">
                  <span className="emoji-icon">😍</span>
                </div>

                <div className="floating-reaction reaction-thumbs">
                  <ThumbsUp size={16} weight="fill" />
                </div>

                <div className="floating-reaction reaction-heart">
                  <Heart size={16} weight="fill" />
                </div>

                <div className="floating-reaction reaction-clap">
                  <HandsClapping size={16} weight="fill" />
                </div>
              </div>

              {/* Bottom Gauge Widget */}
              <div className="engagement-gauge-widget">
                <div className="gauge-circle-container">
                  <svg className="gauge-svg" viewBox="0 0 36 36">
                    <path
                      className="gauge-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="gauge-fill"
                      strokeDasharray="92, 100"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="gauge-text">92%</span>
                </div>
                <div className="gauge-info">
                  <h4>Audience Engagement</h4>
                  <p className="gauge-status">Highly Engaged</p>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Bottom Horizontal Feature Pills Strip */}
        <div className="host-webinar-bottom-strip">
          <div className="feature-pill-card">
            <div className="feature-pill-icon purple-bolt">
              <Lightning size={20} weight="fill" />
            </div>
            <div className="feature-pill-content">
              <h4>Interactive Sessions</h4>
              <p>Real-time interaction that drives results.</p>
            </div>
          </div>

          <div className="feature-pill-card">
            <div className="feature-pill-icon purple-chart">
              <ChartBar size={20} weight="fill" />
            </div>
            <div className="feature-pill-content">
              <h4>Advanced Analytics</h4>
              <p>Track engagement and performance live.</p>
            </div>
          </div>

          <div className="feature-pill-card">
            <div className="feature-pill-icon blue-shield">
              <ShieldCheck size={20} weight="fill" />
            </div>
            <div className="feature-pill-content">
              <h4>Secure & Reliable</h4>
              <p>Enterprise-grade security you can trust.</p>
            </div>
          </div>

          <div className="feature-pill-card">
            <div className="feature-pill-icon blue-cloud">
              <Cloud size={20} weight="fill" />
            </div>
            <div className="feature-pill-content">
              <h4>Unlimited Possibilities</h4>
              <p>Scale webinars of any size with ease.</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
