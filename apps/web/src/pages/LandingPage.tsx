import {
  ArrowRight,
  Broadcast,
  ChartLineUp,
  ChatTeardropText,
  GlobeHemisphereWest,
  MicrophoneStage,
  ShieldCheck,
  Sparkle,
  Translate,
  VideoCamera,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { MarketingHeader } from "../components/MarketingHeader";

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
  const [activeSolution, setActiveSolution] = useState<SolutionKey>("webinar");
  const solution = solutionContent[activeSolution];

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
