import {
  ArrowRight,
  Broadcast,
  CaretDown,
  ChartLineUp,
  ChatCircleDots,
  CheckCircle,
  PlayCircle,
  UsersThree,
  VideoCamera,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";

const eventArtwork = "/virtual-events/syncoraxp-virtual-events-hero.png";
const hostArtwork = "/virtual-events/host-live-v1.png";
const keynoteArtwork = "/virtual-events/keynote-audience-v1.png";
const attendeeArtwork = "/virtual-events/attendee-grid-v1.png";

const capabilities = [
  { icon: VideoCamera, title: "Broadcast with impact", text: "Studio-quality sessions that engage every attendee, anywhere." },
  { icon: UsersThree, title: "Connect naturally", text: "Turn passive watching into conversations that continue beyond the session." },
  { icon: ChartLineUp, title: "Measure what matters", text: "See the signals behind attendance, participation, and event outcomes." },
];

function EventPhoto({ className, alt, src = eventArtwork }: { className: string; alt: string; src?: string }) {
  return <img className={`event-stage-photo ${className}`} src={src} alt={alt} />;
}

export function VirtualEventsPage() {
  return (
    <main className="virtual-events-page">
      <header className="virtual-events-header">
        <Link className="virtual-events-brand" to="/" aria-label="SyncoraXP home">
          <img src="/SyncoraXP_Logo.png" alt="" />
          <span>SyncoraXP</span>
        </Link>
        <nav className="virtual-events-nav" aria-label="Virtual events navigation">
          <a href="#platform">Platform <CaretDown size={14} weight="bold" /></a>
          <a href="#capabilities">Solutions <CaretDown size={14} weight="bold" /></a>
          <a href="#experience">Resources <CaretDown size={14} weight="bold" /></a>
        </nav>
        <a className="virtual-events-demo" href="mailto:hello@syncoraxp.com?subject=Virtual%20events%20demo">Book a demo</a>
      </header>

      <section className="virtual-events-hero" id="platform" aria-labelledby="virtual-events-title">
        <p className="virtual-events-kicker"><span /> Your virtual events, elevated</p>
        <h1 id="virtual-events-title">Virtual events that<br />feel truly together.</h1>
        <p className="virtual-events-intro">Create branded live experiences that bring every session, conversation, and connection into one seamless place.</p>
        <div className="virtual-events-actions">
          <Link className="virtual-events-primary" to="/virtual-events-platform/app/login">Explore the platform <ArrowRight size={18} weight="bold" /></Link>
          <a className="virtual-events-watch" href="#capabilities"><PlayCircle size={22} weight="fill" /> Watch overview</a>
        </div>

        <section className="event-stage" id="experience" aria-label="A live SyncoraXP virtual event experience">
          <article className="event-stage-keynote">
            <EventPhoto className="event-stage-keynote-photo" src={keynoteArtwork} alt="A keynote speaker addressing an online event audience" />
            <span className="event-stage-label"><i /> Launch Keynote</span>
          </article>

          <div className="event-stage-left-lower">
            <article className="event-stage-chat">
              <header><ChatCircleDots size={17} weight="fill" /> Event chat</header>
              <div><EventPhoto className="event-stage-avatar avatar-one" alt="Alex R. attending the event" /><p><b>Alex R.</b><span>Great insights!</span></p><time>10:24 AM</time></div>
              <div><EventPhoto className="event-stage-avatar avatar-two" alt="Maya S. attending the event" /><p><b>Maya S.</b><span>Loving this session ✨</span></p></div>
              <div><EventPhoto className="event-stage-avatar avatar-three" alt="Jordan K. attending the event" /><p><b>Jordan K.</b><span>Thanks for sharing!</span></p></div>
            </article>
            <article className="event-stage-attendance">
              <UsersThree size={25} weight="fill" />
              <strong>1,256</strong><span>Attendees online</span>
              <div className="event-stage-sparkline" aria-hidden="true"><i /><i /><i /><i /><i /></div>
            </article>
          </div>

          <article className="event-stage-host">
            <EventPhoto className="event-stage-host-photo" src={hostArtwork} alt="A live event host presenting to attendees" />
            <span className="event-stage-live"><Broadcast size={14} weight="fill" /> Live</span>
            <span className="event-stage-viewers"><UsersThree size={14} weight="fill" /> 1,256</span>
          </article>

          <article className="event-stage-audience">
            <EventPhoto className="event-stage-audience-photo" src={keynoteArtwork} alt="An engaged virtual event audience" />
            <span><i /> Connected</span>
          </article>

          <section className="event-stage-speakers" aria-label="Connected attendees">
            <img className="event-stage-attendee-grid" src={attendeeArtwork} alt="Four virtual event attendees connected live" />
          </section>

          <article className="event-stage-networking">
            <div><UsersThree size={19} weight="fill" /><b>Networking</b><span>Find and connect<br />with the right people.</span></div>
            <div className="event-stage-mini-avatars"><EventPhoto className="avatar-one" alt="" /><EventPhoto className="avatar-two" alt="" /><EventPhoto className="avatar-three" alt="" /><b>+32</b></div>
            <ArrowRight size={19} weight="bold" />
          </article>

          <article className="event-stage-engagement">
            <div><span>Engagement score</span><strong>92%</strong><b>Excellent</b></div>
            <div className="event-stage-engagement-line" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
          </article>
        </section>
      </section>

      <section className="virtual-events-capabilities" id="capabilities" aria-labelledby="virtual-events-capabilities-title">
        <div className="virtual-events-capability-intro"><p>Built for powerful experiences</p><h2 id="virtual-events-capabilities-title">Everything you need to run remarkable virtual events.</h2></div>
        <div className="virtual-events-capability-list">
          {capabilities.map(({ icon: Icon, title, text }) => <article key={title}><Icon size={29} weight="duotone" aria-hidden="true" /><h3>{title}</h3><p>{text}</p></article>)}
        </div>
        <Link className="virtual-events-join" to="/register">Create your event <CheckCircle size={19} weight="fill" /></Link>
      </section>
    </main>
  );
}