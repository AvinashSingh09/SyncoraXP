import {
  Users,
  ShieldCheck,
  Globe,
  Microphone,
  VideoCamera,
  ChatTeardrop,
  ChartBar,
  DotsThree,
  ThumbsUp,
  HandsClapping,
  ArrowRight,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { MarketingHeader } from "../components/MarketingHeader";
import { HostWebinarSection } from "../components/HostWebinarSection";
import { GlobalWebinarSection } from "../components/GlobalWebinarSection";
import { WebinarLeadFormSection } from "../components/WebinarLeadFormSection";
import { Footer } from "../components/Footer";

export function WebinarServicePage() {
  return (
    <main className="landing-page webinar-service-page">
      <MarketingHeader />

      <section className="webinar-hero" aria-labelledby="webinar-title">
        <div className="webinar-hero-container">
          
          {/* Left Column: Information & Details */}
          <div className="webinar-hero-info">
            <div className="webinar-badge">
              <span className="webinar-badge-dot" />
              All-in-One Webinar Platform
            </div>

            <h1 id="webinar-title">
              Deliver World-Class<br />
              <span className="webinar-highlight">Webinar Experiences</span>
            </h1>

            <p className="webinar-description">
              Host highly interactive &amp; informative live webinars – the ultimate webinar platform. 
              Unleash the true potential of your organization and reach the set objective by 
              conceptualizing webinars in no time with the world's best webinar services &amp; solutions!
            </p>

            <Link to="/login" className="webinar-cta-button">
              Get Started <ArrowRight size={18} weight="bold" />
            </Link>

            <div className="webinar-features">
              <div className="webinar-feature-col">
                <div className="webinar-feature-icon-wrapper">
                  <Users size={22} weight="regular" />
                </div>
                <h3>Highly Interactive</h3>
                <p>Engage your audience in real-time</p>
              </div>

              <div className="webinar-feature-col">
                <div className="webinar-feature-icon-wrapper">
                  <ShieldCheck size={22} weight="regular" />
                </div>
                <h3>Enterprise Ready</h3>
                <p>Secure, scalable &amp; reliable platform</p>
              </div>

              <div className="webinar-feature-col">
                <div className="webinar-feature-icon-wrapper">
                  <Globe size={22} weight="regular" />
                </div>
                <h3>Global Reach</h3>
                <p>Connect audiences worldwide</p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Video Showcase */}
          <div className="webinar-showcase">
            <div className="webinar-video-card">
              {/* Presenter Background Image */}
              <img 
                src="/landing/webinar-speaker.png" 
                alt="Webinar live speaker hosting session" 
                className="webinar-speaker-img"
              />

              {/* Top Left Status Badges */}
              <div className="webinar-status-badges">
                <span className="webinar-badge-live">
                  <span className="live-dot" /> LIVE
                </span>
                <span className="webinar-badge-viewers">
                  <Users size={12} weight="fill" /> 1,248
                </span>
              </div>

              {/* Floating Chat Messages on Right */}
              <div className="webinar-floating-chats">
                <div className="webinar-chat-bubble">
                  <div className="chat-avatar-wrapper">
                    <img src="/landing/syncoraxp-webinar-preview.png" alt="User avatar" />
                  </div>
                  <span>Great session!</span>
                </div>

                <div className="webinar-chat-bubble">
                  <div className="chat-avatar-wrapper">
                    <img src="/landing/syncoraxp-live-stage.png" alt="User avatar" />
                  </div>
                  <span>Very informative</span>
                </div>
              </div>

              {/* Floating Reactions on Right */}
              <div className="webinar-floating-reactions">
                <div className="reaction-bubble thumbs-up">
                  <ThumbsUp size={14} weight="fill" />
                  <span>120</span>
                </div>
                <div className="reaction-bubble clap">
                  <HandsClapping size={14} weight="fill" />
                </div>
              </div>

              {/* Bottom Control Bar */}
              <div className="webinar-control-bar-wrapper">
                <div className="webinar-control-bar">
                  <div className="control-btn"><Microphone size={18} /></div>
                  <div className="control-btn"><VideoCamera size={18} /></div>
                  <div className="control-btn"><Users size={18} /></div>
                  <div className="control-btn"><ChatTeardrop size={18} /></div>
                  <div className="control-btn"><ChartBar size={18} /></div>
                  <div className="control-btn active"><DotsThree size={18} weight="bold" /></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Host A Webinar Showcase Section */}
      <HostWebinarSection />

      {/* Global Multi-Lingual Showcase Section */}
      <GlobalWebinarSection />

      {/* Brands Marquee & "Let's Get Your Event Going!" Contact Lead Form Section */}
      <WebinarLeadFormSection />

      <Footer />
    </main>
  );
}


