import { useState, useEffect, useMemo } from "react";
import {
  Sparkle,
  Brain,
  Headphones,
  Globe,
  Translate,
  Wheelchair,
  Planet,
} from "@phosphor-icons/react";

export function GlobalWebinarSection() {
  const [selectedLanguage, setSelectedLanguage] = useState("Español");

  // Word-by-word AI Live Captions Typewriter State
  const captionText = "Welcome everyone to today's session. We're excited to share valuable insights with you all.";
  const words = useMemo(() => captionText.split(" "), [captionText]);
  const [visibleWordCount, setVisibleWordCount] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleWordCount((prev) => {
        if (prev >= words.length) {
          return 1; // restart sequence
        }
        return prev + 1;
      });
    }, 280);

    return () => clearInterval(timer);
  }, [words.length]);

  const languages = [
    { name: "English", sub: "Original", flagUrl: "https://flagcdn.com/w40/gb.png" },
    { name: "Español", sub: "Spanish", flagUrl: "https://flagcdn.com/w40/es.png" },
    { name: "Français", sub: "French", flagUrl: "https://flagcdn.com/w40/fr.png" },
    { name: "हिन्दी", sub: "Hindi", flagUrl: "https://flagcdn.com/w40/in.png" },
    { name: "中文", sub: "Chinese", flagUrl: "https://flagcdn.com/w40/cn.png" },
    { name: "عربي", sub: "Arabic", flagUrl: "https://flagcdn.com/w40/ae.png" },
  ];

  return (
    <section className="global-webinar-section" aria-label="Global Multi-Lingual Webinars">
      <div className="global-webinar-container">
        
        {/* Header Section */}
        <div className="global-webinar-header">

          <h2 className="global-main-headline">
            Built for <span className="gradient-pink-purple">Every Voice,</span><br />
            <span className="gradient-cyan-blue">Understood Everywhere.</span>
          </h2>

          <h3 className="global-section-subtitle">
            Powering Global, Inclusive &amp; Engaging Webinars
          </h3>
        </div>

        {/* 3 Showcase Cards Grid */}
        <div className="global-cards-grid">
          
          {/* Card 1: Live AI Captions & Subtitles */}
          <div className="global-feature-card">
            <div className="global-card-header">
              <div className="card-number-badge">1</div>
              <div className="card-header-text">
                <h3>Live AI Captions &amp; Subtitles</h3>
                <p>Real-time captions for every word, better understanding for all.</p>
              </div>
            </div>

            <div className="card-mockup-stage captions-stage">
              <img
                src="/landing/global-ai-captions-speaker.png"
                alt="Speaker with AI live captions"
                className="stage-speaker-img"
              />

              <div className="stage-top-badge live-badge-red">
                <span className="live-pulse-dot" /> LIVE
              </div>

              <div className="stage-top-badge ai-captions-badge">
                <Brain size={14} weight="fill" />
                <span>AI Captions</span>
              </div>

              <div className="captions-text-overlay">
                <p className="typing-captions-text">
                  {words.slice(0, visibleWordCount).map((word, idx) => (
                    <span key={idx} className="caption-word-span">{word} </span>
                  ))}
                  <span className="typing-cursor">|</span>
                </p>
              </div>
            </div>

            {/* Audio Waveform Equalizer */}
            <div className="audio-waveform-container" aria-hidden="true">
              <div className="waveform-bar h-2" />
              <div className="waveform-bar h-5" />
              <div className="waveform-bar h-8" />
              <div className="waveform-bar h-12" />
              <div className="waveform-bar h-6" />
              <div className="waveform-bar h-14" />
              <div className="waveform-bar h-10" />
              <div className="waveform-bar h-4" />
              <div className="waveform-bar h-16" />
              <div className="waveform-bar h-9" />
              <div className="waveform-bar h-12" />
              <div className="waveform-bar h-7" />
              <div className="waveform-bar h-15" />
              <div className="waveform-bar h-11" />
              <div className="waveform-bar h-5" />
              <div className="waveform-bar h-13" />
              <div className="waveform-bar h-8" />
              <div className="waveform-bar h-16" />
              <div className="waveform-bar h-10" />
              <div className="waveform-bar h-6" />
              <div className="waveform-bar h-14" />
              <div className="waveform-bar h-4" />
              <div className="waveform-bar h-11" />
              <div className="waveform-bar h-7" />
              <div className="waveform-bar h-15" />
              <div className="waveform-bar h-3" />
            </div>
          </div>

          {/* Card 2: Multi-Lingual Audio Interpretation Channels */}
          <div className="global-feature-card">
            <div className="global-card-header">
              <div className="card-number-badge">2</div>
              <div className="card-header-text">
                <h3>Multi-Lingual Audio Interpretation Channels</h3>
                <p>Offer real-time translated audio in multiple languages.</p>
              </div>
            </div>

            <div className="card-mockup-stage interpreter-stage">
              <img
                src="/landing/global-interpreter-speaker.png"
                alt="Interpreter speaking live webinar stream"
                className="stage-speaker-img"
              />

              <div className="stage-top-badge channels-label-badge">
                <Headphones size={14} weight="fill" />
                <span>Interpreter Channels</span>
              </div>

              {/* Floating Flag Language Menu */}
              <div className="flags-language-menu">
                {languages.map((lang) => (
                  <button
                    key={lang.name}
                    className={`lang-option-row ${selectedLanguage === lang.name ? "active" : ""}`}
                    onClick={() => setSelectedLanguage(lang.name)}
                  >
                    <img src={lang.flagUrl} alt={lang.name} className="lang-flag-img" />
                    <div className="lang-text">
                      <span className="lang-name">{lang.name}</span>
                      <span className="lang-sub">{lang.sub}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Active Audio Channel Pill */}
            <div className="active-audio-channel-pill">
              <Headphones size={18} weight="fill" className="headphones-icon" />
              <span>You are listening in: <strong>{selectedLanguage}</strong></span>
              <div className="mini-equalizer-bars">
                <span className="mini-bar b1" />
                <span className="mini-bar b2" />
                <span className="mini-bar b3" />
                <span className="mini-bar b4" />
              </div>
            </div>
          </div>

          {/* Card 3: Global Localization & Accessibility */}
          <div className="global-feature-card">
            <div className="global-card-header">
              <div className="card-number-badge">3</div>
              <div className="card-header-text">
                <h3>Global Localization &amp; Accessibility</h3>
                <p>Make your webinars accessible and relevant to audiences everywhere.</p>
              </div>
            </div>

            {/* World Map Interactive Stage */}
            <div className="card-mockup-stage world-map-stage">
              <div className="map-nodes-container">
                
                {/* Global Avatars & Native Speech Bubbles */}
                <div className="map-node node-1">
                  <div className="speech-bubble">Hello!</div>
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80" alt="User UK" />
                </div>

                <div className="map-node node-2">
                  <div className="speech-bubble">¡Hola!</div>
                  <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80" alt="User Spain" />
                </div>

                <div className="map-node node-3">
                  <div className="speech-bubble">नमस्ते</div>
                  <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80" alt="User India" />
                </div>

                <div className="map-node node-4">
                  <div className="speech-bubble">你好</div>
                  <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80" alt="User China" />
                </div>

                <div className="map-node node-5">
                  <div className="speech-bubble">مرحبا</div>
                  <img src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80" alt="User UAE" />
                </div>

              </div>
            </div>

            {/* Bottom 4 Feature Pills Grid */}
            <div className="global-pills-footer">
              <div className="footer-pill-item">
                <Globe size={18} weight="fill" />
                <span>Multi-Language Support</span>
              </div>
              <div className="footer-pill-item">
                <Translate size={18} weight="fill" />
                <span>Subtitles &amp; Translations</span>
              </div>
              <div className="footer-pill-item">
                <Wheelchair size={18} weight="fill" />
                <span>Accessibility Features</span>
              </div>
              <div className="footer-pill-item">
                <Planet size={18} weight="fill" />
                <span>Global Reach</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
