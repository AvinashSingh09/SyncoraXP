import {
  ArrowRight,
  Broadcast,
  CaretDown,
  GlobeHemisphereWest,
  MicrophoneStage,
  ShieldCheck,
  Translate,
  VideoCamera,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Brand } from "../components/Brand";

export function LandingPage() {
  const { user } = useAuth();

  return (
    <main className="landing-page">
      <header className="landing-header">
        <Brand />

        <nav className="landing-nav" aria-label="Primary navigation">
          <details className="solutions-menu">
            <summary>
              Solutions <CaretDown size={15} weight="bold" aria-hidden="true" />
            </summary>
            <div className="solutions-dropdown">
              <Link to="/virtual-events-platform">
                <span><Broadcast size={21} weight="duotone" /></span>
                <span><strong>Virtual Events Platform</strong><small>Build memorable online experiences</small></span>
              </Link>
              <Link to="/webinar-service">
                <span><MicrophoneStage size={21} weight="duotone" /></span>
                <span><strong>Webinar service</strong><small>Host and manage live meetings</small></span>
              </Link>
            </div>
          </details>
          <a href="#features">Features</a>
        </nav>

        <div className="landing-header-actions">
          <Link className="landing-sign-in" to={user ? "/webinar-service" : "/login"}>
            {user ? "Dashboard" : "Sign in"}
          </Link>
          <Link className="landing-button compact" to="/webinar-service">
            Start a webinar
          </Link>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow"><span /> Conversations without borders</p>
          <h1>Bring every voice into the room.</h1>
          <p>
            Run engaging webinars and global meetings with one secure platform built
            for clear, inclusive conversation.
          </p>
          <div className="landing-hero-actions">
            <Link className="landing-button" to="/webinar-service">
              Explore webinar service <ArrowRight size={18} weight="bold" />
            </Link>
            <Link className="landing-secondary-button" to="/virtual-events-platform">
              Virtual events platform
            </Link>
          </div>
          <div className="landing-trust-row">
            <span><ShieldCheck size={18} weight="fill" /> Secure rooms</span>
            <span><GlobeHemisphereWest size={18} weight="fill" /> Global reach</span>
          </div>
        </div>

        <div className="landing-product-preview" aria-label="Webinar product preview">
          <div className="preview-window-bar">
            <span className="preview-window-dots"><i /><i /><i /></span>
            <span>Live product briefing</span>
            <span className="preview-live-badge">Live</span>
          </div>
          <div className="preview-stage">
            <div className="preview-speaker">
              <span className="preview-avatar">AR</span>
              <div><strong>Asha Rao</strong><small>Keynote speaker</small></div>
            </div>
            <div className="preview-audience" aria-hidden="true">
              <span>MK</span><span>JL</span><span>SB</span>
            </div>
            <div className="preview-transcript">
              <Translate size={21} weight="duotone" />
              <div><small>Live translation</small><strong>Everyone can follow the conversation.</strong></div>
            </div>
          </div>
          <div className="preview-controls-bar">
            <span><VideoCamera size={18} weight="fill" /> Camera on</span>
            <span><MicrophoneStage size={18} weight="fill" /> Microphone on</span>
            <span className="preview-end-session">End session</span>
          </div>
        </div>
      </section>

      <section className="landing-features" id="features" aria-labelledby="features-heading">
        <div>
          <p className="landing-eyebrow">One platform</p>
          <h2 id="features-heading">Made for meaningful live moments.</h2>
        </div>
        <div className="landing-feature-grid">
          <article><VideoCamera size={25} weight="duotone" /><strong>Reliable live rooms</strong><p>Bring hosts and guests together in a focused, high-quality meeting space.</p></article>
          <article><Translate size={25} weight="duotone" /><strong>Inclusive conversations</strong><p>Make sessions easier to follow for audiences joining from around the world.</p></article>
          <article><ShieldCheck size={25} weight="duotone" /><strong>Host controls</strong><p>Manage invitations, waiting guests, and every part of the live experience.</p></article>
        </div>
      </section>
    </main>
  );
}
