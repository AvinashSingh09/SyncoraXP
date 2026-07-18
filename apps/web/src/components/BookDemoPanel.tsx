import { useState } from "react";
import { X, CheckCircle } from "@phosphor-icons/react";

const COUNTRY_CODES = [
  { code: "IN", dial: "+91", flag: "🇮🇳" },
  { code: "US", dial: "+1", flag: "🇺🇸" },
  { code: "GB", dial: "+44", flag: "🇬🇧" },
  { code: "AE", dial: "+971", flag: "🇦🇪" },
  { code: "SG", dial: "+65", flag: "🇸🇬" },
  { code: "AU", dial: "+61", flag: "🇦🇺" },
  { code: "CA", dial: "+1", flag: "🇨🇦" },
  { code: "DE", dial: "+49", flag: "🇩🇪" },
];

const CATEGORIES = [
  "SaaS / Technology",
  "Marketing & Advertising",
  "Education & EdTech",
  "Healthcare",
  "Finance & Banking",
  "Retail & E-commerce",
  "Manufacturing",
  "Non-Profit / NGO",
  "Government",
  "Other",
];

interface BookDemoPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  border: "1.5px solid #e2e8f0",
  borderRadius: "10px",
  fontSize: "13.5px",
  color: "#1e293b",
  background: "#f8fafc",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  transition: "border-color 0.2s",
};

export function BookDemoPanel({ isOpen, onClose }: BookDemoPanelProps) {
  const [form, setForm] = useState({
    fullName: "",
    workEmail: "",
    countryCode: "+91",
    phone: "",
    city: "",
    company: "",
    category: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((res) => setTimeout(res, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSubmitted(false);
      setForm({
        fullName: "",
        workEmail: "",
        countryCode: "+91",
        phone: "",
        city: "",
        company: "",
        category: "",
        message: "",
      });
    }, 400);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(4px)",
          zIndex: 9998,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.35s ease",
        }}
      />

      {/* Slide-in Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100%",
          width: "min(540px, 100vw)",
          background: "#fff",
          zIndex: 9999,
          transform: isOpen ? "translateX(0)" : "translateX(110%)",
          transition: "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 48px rgba(0,0,0,0.18)",
          overflowY: "auto",
        }}
      >
        {/* Purple header strip */}
        <div
          style={{
            background: "linear-gradient(135deg, #4f2de8 0%, #7c3aed 60%, #a855f7 100%)",
            padding: "32px 32px 28px",
            position: "relative",
            flexShrink: 0,
          }}
        >
          <button
            onClick={handleClose}
            aria-label="Close panel"
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "rgba(255,255,255,0.18)",
              border: "none",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.3)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.18)")
            }
          >
            <X size={18} weight="bold" />
          </button>

          <h2
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#fff",
              margin: "0 0 6px",
              letterSpacing: "-0.3px",
              lineHeight: 1.25,
            }}
          >
            Book Your Interactive<br />1:1 Demo
          </h2>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", margin: 0 }}>
            Explore Your Event's Limitless Potential With our Event Tech
          </p>

          {/* Bullet points */}
          <ul
            style={{
              margin: "16px 0 0",
              paddingLeft: "18px",
              color: "rgba(255,255,255,0.82)",
              fontSize: "12px",
              lineHeight: "1.75",
              display: "flex",
              flexDirection: "column",
              gap: "1px",
            }}
          >
            <li>Make the event hosting process simple and easy with our powerful event tech stack.</li>
            <li>Extract maximum value from smart analytics. Boost your event ROI and attendee satisfaction.</li>
            <li>Get detailed industry case studies for insights and creative ideas to make your next event flawless.</li>
            <li>Ask away all that you wish to in a personalised demo plus Q&amp;A session with our team.</li>
          </ul>

          {/* Stars */}
          <div
            style={{
              marginTop: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "rgba(255,255,255,0.9)",
              fontSize: "12px",
            }}
          >
            <span style={{ fontSize: "15px", letterSpacing: "2px", color: "#fbbf24" }}>★★★★★</span>
            <span style={{ fontWeight: 700 }}>Rated 4.8/5</span>
            <span style={{ opacity: 0.7 }}>on G2</span>
          </div>
        </div>

        {/* Form section */}
        <div style={{ padding: "24px 32px 36px", flex: 1 }}>
          {submitted ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                minHeight: "260px",
                gap: "16px",
                textAlign: "center",
              }}
            >
              <CheckCircle size={64} weight="fill" color="#7c3aed" />
              <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#1e1b4b", margin: 0 }}>
                Request Submitted!
              </h3>
              <p style={{ color: "#64748b", fontSize: "14px", maxWidth: "320px", margin: 0 }}>
                Thank you! Our team will reach out to you within 24 hours to schedule your personalised demo.
              </p>
              <button
                onClick={handleClose}
                style={{
                  marginTop: "8px",
                  background: "linear-gradient(135deg, #4f2de8, #7c3aed)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "12px 32px",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "16px" }}>
                <p style={{ fontSize: "15px", fontWeight: 700, color: "#1e1b4b", margin: "0 0 2px" }}>
                  Schedule a Demo
                </p>
                <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                  Book a live demo and get all your queries resolved with our expert.
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                  maxLength={60}
                  placeholder="Full Name* (Max 60 chars)"
                  style={inputStyle}
                />

                <input
                  name="workEmail"
                  type="email"
                  value={form.workEmail}
                  onChange={handleChange}
                  required
                  placeholder="Your Work Email*"
                  style={inputStyle}
                />

                {/* Phone with country code */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <select
                      name="countryCode"
                      value={form.countryCode}
                      onChange={handleChange}
                      style={{
                        ...inputStyle,
                        padding: "13px 30px 13px 12px",
                        appearance: "none",
                        cursor: "pointer",
                        minWidth: "86px",
                      }}
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.dial}>
                          {c.flag} {c.dial}
                        </option>
                      ))}
                    </select>
                    <span
                      style={{
                        position: "absolute",
                        right: "9px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "10px",
                        color: "#94a3b8",
                        pointerEvents: "none",
                      }}
                    >
                      ▼
                    </span>
                  </div>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    placeholder="+91 Phone No.*"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>

                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  required
                  maxLength={60}
                  placeholder="City* (Max 60 chars)"
                  style={inputStyle}
                />

                <input
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  required
                  maxLength={60}
                  placeholder="Company* (Max 60 chars)"
                  style={inputStyle}
                />

                {/* Category dropdown */}
                <div style={{ position: "relative" }}>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                    style={{
                      ...inputStyle,
                      appearance: "none",
                      cursor: "pointer",
                      color: form.category ? "#1e293b" : "#94a3b8",
                      width: "100%",
                      paddingRight: "36px",
                    }}
                  >
                    <option value="" disabled>
                      Category of Business*
                    </option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} style={{ color: "#1e293b" }}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <span
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "10px",
                      color: "#94a3b8",
                      pointerEvents: "none",
                    }}
                  >
                    ▼
                  </span>
                </div>

                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  maxLength={2000}
                  rows={3}
                  placeholder="Message (Max 2000 chars)"
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    minHeight: "80px",
                    fontFamily: "inherit",
                  }}
                />

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: loading
                      ? "#a78bfa"
                      : "linear-gradient(135deg, #4f2de8 0%, #7c3aed 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "15px 24px",
                    fontWeight: 800,
                    fontSize: "15px",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    marginTop: "4px",
                    letterSpacing: "0.2px",
                  }}
                >
                  {loading ? "Submitting…" : "Submit"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
