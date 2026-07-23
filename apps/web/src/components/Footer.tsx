import {
  FacebookLogo,
  InstagramLogo,
  LinkedinLogo,
  TwitterLogo,
  YoutubeLogo,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { Brand } from "./Brand";

export function Footer() {
  return (
    <footer style={{
      width: "100%",
      background: "#07091e",
      color: "#94a3b8",
      borderTop: "1px solid rgba(255, 255, 255, 0.08)",
      padding: "80px 0 32px",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Manrope', sans-serif",
    }}>
      <div style={{
        position: "absolute",
        top: "-120px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "600px",
        height: "300px",
        background: "radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, rgba(7, 9, 30, 0) 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        width: "min(1280px, calc(100% - 48px))",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "64px",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "48px 32px",
        }}>
          {/* Brand & Socials */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <Brand theme="light" />
            <p style={{
              fontSize: "14px",
              lineHeight: "1.65",
              color: "#94a3b8",
              margin: 0,
              maxWidth: "280px",
            }}>
              The enterprise live event platform built for webinars, virtual summits, and seamless guest registration.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="SyncoraXP on LinkedIn"
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  display: "grid",
                  placeItems: "center",
                  transition: "all 0.2s ease",
                }}
              >
                <LinkedinLogo size={18} weight="bold" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="SyncoraXP on Twitter"
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  display: "grid",
                  placeItems: "center",
                  transition: "all 0.2s ease",
                }}
              >
                <TwitterLogo size={18} weight="bold" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="SyncoraXP on YouTube"
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  display: "grid",
                  placeItems: "center",
                  transition: "all 0.2s ease",
                }}
              >
                <YoutubeLogo size={18} weight="bold" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="SyncoraXP on Instagram"
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  display: "grid",
                  placeItems: "center",
                  transition: "all 0.2s ease",
                }}
              >
                <InstagramLogo size={18} weight="bold" />
              </a>
            </div>
          </div>

          {/* Solutions Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h4 style={{ font: "800 16px 'Manrope', sans-serif", color: "#ffffff", margin: 0, letterSpacing: "-0.01em" }}>
              Solutions
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
              <li>
                <Link to="/webinar-service" style={{ color: "#94a3b8", textDecoration: "none" }}>
                  Webinar Service
                </Link>
              </li>
              <li>
                <Link to="/virtual-events-platform" style={{ color: "#94a3b8", textDecoration: "none" }}>
                  Virtual Events Platform
                </Link>
              </li>
              <li>
                <Link to="/event-registration" style={{ color: "#94a3b8", textDecoration: "none" }}>
                  Event Registration & Check-in
                </Link>
              </li>
              <li>
                <Link to="/webinar-service" style={{ color: "#94a3b8", textDecoration: "none" }}>
                  Hybrid Event Solutions
                </Link>
              </li>
            </ul>
          </div>

          {/* Capabilities Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h4 style={{ font: "800 16px 'Manrope', sans-serif", color: "#ffffff", margin: 0, letterSpacing: "-0.01em" }}>
              Capabilities
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
              <li><span style={{ color: "#cbd5e1" }}>HD Live Broadcast Rooms</span></li>
              {/* <li><span style={{ color: "#cbd5e1" }}>Audience Q&A & Polls</span></li> */}
              <li><span style={{ color: "#cbd5e1" }}>Instant QR Ticket Badges</span></li>
              <li><span style={{ color: "#cbd5e1" }}>Real-time Live Translation</span></li>
              <li><span style={{ color: "#cbd5e1" }}>Analytics & Lead Capture</span></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h4 style={{ font: "800 16px 'Manrope', sans-serif", color: "#ffffff", margin: 0, letterSpacing: "-0.01em" }}>
              Get in Touch
            </h4>
            <p style={{ fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
              Need help organizing your next big live event?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a
                href="mailto:support@syncoraxp.com"
                style={{
                  color: "#a855f7",
                  fontSize: "14px",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                support@syncoraxp.com
              </a>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                Available 24x7 for Support
              </span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          paddingTop: "28px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          fontSize: "13.5px",
        }}>
          <p style={{ margin: 0, color: "#64748b" }}>
            © {new Date().getFullYear()} SyncoraXP Inc. All rights reserved.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <a href="#privacy" style={{ color: "#64748b", textDecoration: "none" }}>Privacy Policy</a>
            <a href="#terms" style={{ color: "#64748b", textDecoration: "none" }}>Terms of Service</a>
            <a href="#security" style={{ color: "#64748b", textDecoration: "none" }}>Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}