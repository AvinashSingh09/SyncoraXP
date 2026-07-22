import { useState, useRef, useEffect } from "react";
import { MarketingHeader } from "../components/MarketingHeader";
import { Footer } from "../components/Footer";
import { apiFetch } from "../backend";
import { CheckCircle } from "@phosphor-icons/react";

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
  "Marketing and Advertising",
  "Education and EdTech",
  "Healthcare",
  "Finance and Banking",
  "Retail and e-Commerce",
  "Manufacturing",
  "Non-Profit / NGO",
  "Government",
  "Other",
];

const brandLogoFiles = [
  "1.jfif", "2.jfif", "3.webp", "4.jfif", "5.png", "6.png", "7.png", "8.png",
  "9.png", "10.png", "11.png", "12.png", "13.jpg", "14.png", "15.jfif", "16.avif", "16.jpg",
  "17.png", "18.png", "19.jfif", "20.png", "21.avif", "22.png", "23.png", "24.png",
  "25.svg", "26.png", "27.png", "28.png", "29.png", "30.png", "31.png", "32.png",
  "33-removebg-preview.png", "35.png", "36.png", "37.jfif"
];

const smartSolutions = [
  { name: "Face Recognition Scanner", image: "/virtual-events-assets/event_reg_facial_kiosk.png" },
  { name: "Mobile App Check-in", image: "/virtual-events-assets/event_reg_mobile_app.png" },
  { name: "On-Ground Reception Counter", image: "/virtual-events-assets/event_reg_forbes_desk.png" },
];

export function EventRegistrationPage() {
  const formRef = useRef<HTMLDivElement>(null);
  const [smartIndex, setSmartIndex] = useState(0);
  const [activeFeatureTab, setActiveFeatureTab] = useState(0);
  const [tabProgress, setTabProgress] = useState(0);

  useEffect(() => {
    let progress = 0;
    setTabProgress(0);

    const interval = setInterval(() => {
      progress += 2.5; // 4-second cycle
      if (progress >= 100) {
        clearInterval(interval);
        setActiveFeatureTab((curr) => (curr + 1) % 2);
      } else {
        setTabProgress(progress);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [activeFeatureTab]);
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateField = (name: string, value: string, currentCC = form.countryCode) => {
    let error = "";
    if (name === "fullName") {
      if (!value.trim()) {
        error = "Full name is required";
      } else if (value.trim().length < 2) {
        error = "Name must be at least 2 characters";
      } else if (!/^[A-Za-z\s]+$/.test(value)) {
        error = "Name should only contain letters and spaces";
      }
    } else if (name === "workEmail") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) {
        error = "Work email is required";
      } else if (!emailRegex.test(value)) {
        error = "Please enter a valid email address";
      }
    } else if (name === "phone") {
      const digits = value.replace(/\D/g, "");
      if (!value.trim()) {
        error = "Phone number is required";
      } else if (!/^[0-9\s\-()]+$/.test(value)) {
        error = "Phone number should only contain digits, spaces, or hyphens";
      } else if (currentCC === "+91" || currentCC === "+1") {
        if (digits.length !== 10) {
          error = `Phone number must be exactly 10 digits for ${currentCC === "+91" ? "India" : "US/Canada"}`;
        }
      } else {
        if (digits.length < 8 || digits.length > 12) {
          error = "Phone number must be between 8 and 12 digits";
        }
      }
    } else if (name === "city") {
      if (!value.trim()) {
        error = "City is required";
      } else if (value.trim().length < 2) {
        error = "City must be at least 2 characters";
      }
    } else if (name === "company") {
      if (!value.trim()) {
        error = "Company name is required";
      } else if (value.trim().length < 2) {
        error = "Company must be at least 2 characters";
      }
    } else if (name === "category") {
      if (!value) {
        error = "Please select your business category";
      }
    }
    return error;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((p) => {
      const nextForm = { ...p, [name]: value };
      if (name === "countryCode" && touched["phone"]) {
        const err = validateField("phone", p.phone, value);
        setErrors((prev) => ({ ...prev, phone: err }));
      }
      return nextForm;
    });
    if (touched[name]) {
      const err = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const allTouched: Record<string, boolean> = {};

    Object.keys(form).forEach((key) => {
      if (key !== "countryCode" && key !== "message") {
        const val = form[key as keyof typeof form];
        const err = validateField(key, val);
        if (err) {
          newErrors[key] = err;
        }
        allTouched[key] = true;
      }
    });

    setTouched(allTouched);
    setErrors(newErrors);

    const hasErrors = Object.keys(newErrors).some((k) => newErrors[k]);
    if (hasErrors) {
      return;
    }

    setLoading(true);
    setSubmitError(null);
    try {
      const response = await apiFetch("/api/demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to submit demo request.");
      }

      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (name: string): React.CSSProperties => {
    const hasError = touched[name] && errors[name];
    return {
      width: "100%",
      padding: "14px 16px",
      borderRadius: "10px",
      fontSize: "13.5px",
      color: "#1e1b4b",
      outline: "none",
      boxSizing: "border-box",
      fontFamily: "inherit",
      transition: "all 0.2s ease",
      border: hasError ? "1.5px solid #ef4444" : "1.5px solid rgba(109, 40, 217, 0.15)",
      background: hasError ? "rgba(239, 68, 68, 0.05)" : "#ffffff",
      boxShadow: hasError ? "0 0 0 3px rgba(239, 68, 68, 0.1)" : "none",
    };
  };

  const renderError = (name: string) => {
    if (touched[name] && errors[name]) {
      return (
        <span style={{
          color: "#ef4444",
          fontSize: "11px",
          fontWeight: 700,
          marginTop: "4px",
          marginLeft: "2px",
          display: "block",
          textAlign: "left",
        }}>
          {errors[name]}
        </span>
      );
    }
    return null;
  };

  return (
    <main className="landing-page virtual-events-page event-registration-page">
      <MarketingHeader />

      {/* ── HERO SECTION ── */}
      <section style={{
        padding: "160px 24px 80px",
        width: "100%",
        maxWidth: "1200px",
        margin: "0 auto",
        boxSizing: "border-box",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        <p style={{
          color: "#ffffff",
          fontSize: "clamp(16px, 2.2vw, 22px)",
          fontWeight: 600,
          margin: "0 0 16px 0",
          letterSpacing: "-0.01em",
          opacity: 0.95,
        }}>
          Empower Your Event Growth with SyncoraXP's
        </p>

        <h1 style={{
          fontSize: "clamp(44px, 6.8vw, 78px)",
          fontWeight: 800,
          color: "#ffffff",
          lineHeight: 1.05,
          letterSpacing: "-0.04em",
          maxWidth: "1000px",
          margin: "0 auto 24px",
        }}>
          Event Registration<br />Platform & Solutions
        </h1>

        <p style={{
          fontSize: "clamp(15px, 1.8vw, 18.5px)",
          color: "rgba(255, 255, 255, 0.85)",
          lineHeight: 1.6,
          maxWidth: "900px",
          margin: "0 auto 48px",
        }}>
          With our event registration platform & solution, you can bring convenience to all formats of events. Capture valuable data and deploy easy check-ins with self-check-in kiosks and volunteer-based services to maximize the success and revenue of your events.
        </p>

        {/* ── COLLAGE HERO IMAGE ── */}
        <div style={{
          width: "100%",
          maxWidth: "950px",
          marginTop: "20px",
          boxSizing: "border-box",
        }}>
          <img
            src="/virtual-events-assets/event-registration.png"
            alt="Event Registration Platform & Solutions Collage"
            style={{
              width: "100%",
              height: "auto",
              borderRadius: "20px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
            }}
          />
        </div>
      </section>

      {/* ── WHITE DOT MATRIX BACKGROUND SECTION (Includes Logos & Form) ── */}
      <div style={{
        background: "#faf9ff",
        backgroundImage: "radial-gradient(rgba(109, 40, 217, 0.08) 1.5px, transparent 1.5px)",
        backgroundSize: "24px 24px",
        width: "100%",
      }}>
        {/* ── B2B TRUST LOGOS SECTION ── */}
        <section style={{
          padding: "60px 0 20px",
          textAlign: "center",
          width: "100%",
          boxSizing: "border-box",
          overflow: "hidden",
        }}>
          <div className="webinar-lead-container">
            <div className="brand-logos-wrapper">
              <h3 className="brand-logos-title">
                Trusted by the Biggest Names in B2B
              </h3>

              <div className="brand-marquee-track-outer">
                <div className="brand-marquee-track">
                  <div className="brand-marquee-group">
                    {brandLogoFiles.map((file, i) => (
                      <img
                        key={`1-${i}`}
                        src={`/brands/${file}`}
                        alt={`Brand Logo ${i + 1}`}
                        className="brand-normal-logo-img"
                        loading="eager"
                        height={52}
                      />
                    ))}
                  </div>
                  <div className="brand-marquee-group" aria-hidden="true">
                    {brandLogoFiles.map((file, i) => (
                      <img
                        key={`2-${i}`}
                        src={`/brands/${file}`}
                        alt={`Brand Logo ${i + 1}`}
                        className="brand-normal-logo-img"
                        loading="eager"
                        height={52}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CONTACT/DEMO FORM CARD ── */}
        <section ref={formRef} style={{
          padding: "80px 24px 140px",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          boxSizing: "border-box",
        }}>
          <div className="webinar-form-card">
            {/* Watermark Backdrop Favicon Logo */}
            <div style={{
              position: "absolute",
              right: "4%",
              bottom: "4%",
              width: "250px",
              height: "250px",
              backgroundImage: "url('/favicon_io/android-chrome-192x192.png')",
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              opacity: 0.08,
              pointerEvents: "none",
              zIndex: 1,
              filter: "drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3))",
            }} />

            {/* Left Column Info */}
            <div className="form-card-left" style={{ zIndex: 2 }}>
              <h2 className="form-headline">
                Let's Get<br />Your Event Going!
              </h2>
              <p className="form-subheadline">
                Connect With Us Today!
              </p>

              <div style={{
                marginTop: "24px",
                borderTop: "1px solid rgba(255, 255, 255, 0.15)",
                paddingTop: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}>
                <span style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.6)", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>Let's talk!</span>
                <a href="tel:+9190000000000" style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", textDecoration: "none" }}>
                  +91 90000000000
                </a>
              </div>
            </div>

            {/* Right Column Form */}
            <div className="form-card-right" style={{ zIndex: 2 }}>
              {submitted ? (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  gap: "16px",
                  padding: "24px 0",
                }}>
                  <div style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.15)",
                    border: "2px solid #ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    marginBottom: "8px",
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", margin: 0 }}>
                    Demo Request Received!
                  </h3>
                  <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "14px", lineHeight: 1.5, margin: 0, maxWidth: "340px" }}>
                    Thank you! Our event specialists will get in touch with you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="webinar-contact-form" noValidate>
                  {submitError && (
                    <div style={{
                      background: "rgba(239, 68, 68, 0.2)",
                      border: "1px solid rgba(239, 68, 68, 0.4)",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      color: "#fca5a5",
                      fontSize: "13px",
                      fontWeight: 600,
                      textAlign: "left"
                    }}>
                      ⚠️ {submitError}
                    </div>
                  )}

                  {/* Form Row 1 */}
                  <div className="form-row two-cols">
                    {/* Full Name */}
                    <div className="form-field">
                      <input
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        maxLength={60}
                        placeholder="Full Name* (Max 60 chars)"
                      />
                      {renderError("fullName")}
                    </div>

                    {/* Work Email */}
                    <div className="form-field">
                      <input
                        name="workEmail"
                        type="email"
                        value={form.workEmail}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Your Work Email*"
                      />
                      {renderError("workEmail")}
                    </div>

                    {/* Phone */}
                    <div className="form-field">
                      <div className="phone-combo-field">
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <select
                            name="countryCode"
                            value={form.countryCode}
                            onChange={handleChange}
                            style={{
                              height: "100%",
                              padding: "0 28px 0 12px",
                              borderRadius: "14px",
                              fontSize: "15px",
                              color: "#0f172a",
                              background: "#ffffff",
                              border: "none",
                              outline: "none",
                              cursor: "pointer",
                              appearance: "none",
                              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                              backgroundRepeat: "no-repeat",
                              backgroundPosition: "right 10px center",
                              backgroundSize: "14px",
                            }}
                          >
                            {COUNTRY_CODES.map((c) => (
                              <option key={c.code} value={c.dial}>
                                {c.code} {c.dial}
                              </option>
                            ))}
                          </select>
                        </div>
                        <input
                          name="phone"
                          type="tel"
                          value={form.phone}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Phone No.*"
                          style={{ border: "none", paddingLeft: "10px" }}
                        />
                      </div>
                      {renderError("phone")}
                    </div>
                  </div>

                  {/* Form Row 2 */}
                  <div className="form-row three-cols">
                    {/* City */}
                    <div className="form-field">
                      <input
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        maxLength={60}
                        placeholder="City* (Max 60 chars)"
                      />
                      {renderError("city")}
                    </div>

                    {/* Company */}
                    <div className="form-field">
                      <input
                        name="company"
                        value={form.company}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        maxLength={60}
                        placeholder="Company* (Max 60 chars)"
                      />
                      {renderError("company")}
                    </div>

                    {/* Category */}
                    <div className="form-field">
                      <select
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        style={{
                          appearance: "none",
                          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 16px center",
                          backgroundSize: "16px",
                        }}
                      >
                        <option value="" disabled>Category of Business*</option>
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      {renderError("category")}
                    </div>
                  </div>

                  {/* Form Row 3 */}
                  <div className="form-row single-col">
                    {/* Message */}
                    <div className="form-field">
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        maxLength={2000}
                        placeholder="Message (Max 2000 chars)"
                        rows={3}
                        style={{
                          height: "100px",
                          resize: "none",
                        }}
                      />
                    </div>
                  </div>

                  {/* Form Row 4: Submit Button */}
                  <div className="form-row button-row">
                    <button
                      type="submit"
                      disabled={loading}
                      className="form-submit-btn"
                      style={{
                        background: loading ? "rgba(255, 255, 255, 0.5)" : "#ffffff",
                        color: "#6d28d9",
                        border: "none",
                        borderRadius: "10px",
                        padding: "14px 20px",
                        fontWeight: 800,
                        fontSize: "14.5px",
                        cursor: loading ? "not-allowed" : "pointer",
                      }}
                    >
                      {loading ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* ── SMART FUNCTIONALITIES CAROUSEL ── */}
        <section style={{
          padding: "0 24px 100px",
          width: "100%",
          maxWidth: "1400px",
          margin: "0 auto",
          boxSizing: "border-box",
          textAlign: "left",
        }}>
          {/* Header Row */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "40px",
            width: "100%",
          }}>
            <div>
              <p style={{
                fontSize: "clamp(15px, 2.2vw, 22px)",
                fontWeight: 600,
                color: "#1e1b4b",
                margin: "0 0 12px 0",
                letterSpacing: "-0.01em",
              }}>
                Ensure Secure and Seamless Game Management
              </p>
              <h2 style={{
                fontSize: "clamp(32px, 5.2vw, 54px)",
                fontWeight: 800,
                color: "#1e1b4b",
                margin: 0,
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
              }}>
                A Solution Built<br />With Smart Functionalities
              </h2>
            </div>

            {/* Navigation Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setSmartIndex((prev) => (prev - 1 + smartSolutions.length) % smartSolutions.length)}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "rgba(109, 40, 217, 0.05)",
                  border: "1px solid rgba(109, 40, 217, 0.15)",
                  color: "#6d28d9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(109, 40, 217, 0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(109, 40, 217, 0.05)"; }}
              >
                ←
              </button>
              <button
                onClick={() => setSmartIndex((prev) => (prev + 1) % smartSolutions.length)}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "rgba(109, 40, 217, 0.05)",
                  border: "1px solid rgba(109, 40, 217, 0.15)",
                  color: "#6d28d9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(109, 40, 217, 0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(109, 40, 217, 0.05)"; }}
              >
                →
              </button>
            </div>
          </div>

          {/* Carousel Viewport */}
          <div style={{
            width: "calc(100% + 48px)",
            margin: "0 -24px",
            overflow: "hidden",
            position: "relative",
            padding: "10px 24px",
            boxSizing: "border-box",
          }}>
            <div style={{
              display: "flex",
              gap: "24px",
              transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
              transform: `translateX(-${smartIndex * 504}px)`,
            }}>
              {smartSolutions.map((space, idx) => (
                <div
                  key={idx}
                  style={{
                    minWidth: "480px",
                    width: "480px",
                    height: "360px",
                    borderRadius: "20px",
                    overflow: "hidden",
                    position: "relative",
                    boxShadow: "0 10px 30px rgba(109, 40, 217, 0.1)",
                    border: "1px solid rgba(109, 40, 217, 0.08)",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "rgba(109, 40, 217, 0.2)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(109, 40, 217, 0.08)"; }}
                >
                  <img
                    src={space.image}
                    alt={space.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  {/* Space Label Badge */}
                  <div style={{
                    position: "absolute",
                    bottom: "20px",
                    right: "20px",
                    background: "rgba(30, 27, 75, 0.85)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    color: "#ffffff",
                    fontSize: "12.5px",
                    fontWeight: 700,
                  }}>
                    {space.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ROBUST OUTDOOR & INDOOR SOLUTIONS TABS ── */}
        <section style={{
          padding: "60px 24px 100px",
          width: "100%",
          maxWidth: "1100px",
          margin: "0 auto",
          boxSizing: "border-box",
          textAlign: "center",
        }}>
          <p style={{
            fontSize: "clamp(15px, 2.2vw, 22px)",
            fontWeight: 600,
            color: "#1e1b4b",
            margin: "0 0 16px 0",
            letterSpacing: "-0.01em",
          }}>
            Experience Timeless Convenience with SyncoraXP's
          </p>
          <h2 style={{
            fontSize: "clamp(32px, 5.2vw, 54px)",
            fontWeight: 800,
            color: "#1e1b4b",
            maxWidth: "1000px",
            margin: "0 auto 48px",
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
          }}>
            Robust Outdoor and Indoor <br />Event Registration Solutions
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "48px",
            alignItems: "center",
            textAlign: "left",
          }}>
            {/* Left Column: Interactive Tabs List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                {
                  title: "Registrations & Ticketing",
                  desc: "Frictionless form builders, ticket tier configurations, instant badge generation, and  built to manage attendee registration smoothly.",
                },
                {
                  title: "Event CRM",
                  desc: "Track attendee data, monitor check-in statistics, manage registration databases, and build targeted marketing workflows all from one centralized console.",
                },
              ].map((tab, idx) => {
                const isActive = activeFeatureTab === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => { setActiveFeatureTab(idx); setTabProgress(0); }}
                    style={{
                      padding: "20px 24px 28px",
                      borderRadius: "16px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      border: isActive ? "1px solid rgba(109, 40, 217, 0.12)" : "1px solid transparent",
                      background: isActive ? "#ffffff" : "transparent",
                      boxShadow: isActive ? "0 10px 30px -10px rgba(109, 40, 217, 0.12)" : "none",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Individual Loader Bar */}
                    <div style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      width: "100%",
                      height: "4px",
                      background: isActive ? "rgba(109, 40, 217, 0.1)" : "transparent",
                    }}>
                      {isActive && (
                        <div style={{
                          height: "100%",
                          width: `${tabProgress}%`,
                          background: "#6d28d9",
                          transition: "width 0.1s linear",
                        }} />
                      )}
                    </div>

                    <h3 style={{
                      fontSize: "20px",
                      fontWeight: 750,
                      color: isActive ? "#6d28d9" : "#1e1b4b",
                      margin: "0 0 8px 0",
                      transition: "color 0.2s ease",
                    }}>
                      {tab.title}
                    </h3>
                    {isActive && (
                      <p style={{
                        fontSize: "14px",
                        color: "#475569",
                        margin: 0,
                        lineHeight: 1.6,
                      }}>
                        {tab.desc}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Column: Visual Mockup Showcase */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                background: "#ffffff",
                borderRadius: "24px",
                height: "340px",
                width: "100%",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 20px 45px rgba(109, 40, 217, 0.06)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                boxSizing: "border-box",
                border: "1px solid rgba(109, 40, 217, 0.05)",
              }}>
                {activeFeatureTab === 0 && (
                  <div style={{ width: "90%", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#1e1b4b", marginBottom: "4px" }}>Event Feedback Survey</div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>We value your participation! Please fill out the form.</div>
                    <input type="text" disabled placeholder="Rate your experience (1-5)" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", outline: "none", background: "#f8fafc" }} />
                    <textarea disabled placeholder="Any additional comments..." style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", outline: "none", background: "#f8fafc", height: "60px", resize: "none" }} />
                    <div style={{ height: "38px", background: "#6d28d9", borderRadius: "8px", display: "grid", placeItems: "center", color: "#ffffff", fontWeight: 800, fontSize: "12px", marginTop: "4px" }}>
                      Submit Feedback
                    </div>
                  </div>
                )}

                {activeFeatureTab === 1 && (
                  <div style={{ width: "95%", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "#1e1b4b" }}>Event Registration Dashboard</span>
                      <span style={{ fontSize: "11px", background: "#ecfdf5", color: "#059669", padding: "2px 8px", borderRadius: "12px", fontWeight: 700 }}>Live Update</span>
                    </div>
                    {/* Tiny Dashboard Table */}
                    <div style={{ border: "1px solid #f1f5f9", borderRadius: "10px", overflow: "hidden" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", background: "#f8fafc", padding: "8px 12px", fontSize: "10px", fontWeight: 850, color: "#64748b", borderBottom: "1px solid #f1f5f9" }}>
                        <span>ATTENDEE</span>
                        <span>TICKET</span>
                        <span>STATUS</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", padding: "8px 12px", fontSize: "11px", color: "#1e1b4b", borderBottom: "1px solid #f1f5f9" }}>
                        <span style={{ fontWeight: 650 }}>Sarah K.</span>
                        <span style={{ color: "#6d28d9" }}>VIP Pass</span>
                        <span style={{ color: "#10b981", fontWeight: 700 }}>Checked In</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", padding: "8px 12px", fontSize: "11px", color: "#1e1b4b" }}>
                        <span style={{ fontWeight: 650 }}>James L.</span>
                        <span style={{ color: "#6b7280" }}>Standard</span>
                        <span style={{ color: "#3b82f6", fontWeight: 700 }}>Registered</span>
                      </div>
                    </div>
                    {/* Mini Stats Bar */}
                    <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                      <div style={{ flex: 1, padding: "8px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "9px", color: "#64748b", fontWeight: 700 }}>TOTAL</span>
                        <span style={{ fontSize: "14px", fontWeight: 800, color: "#1e1b4b" }}>1,480</span>
                      </div>
                      <div style={{ flex: 1, padding: "8px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "9px", color: "#64748b", fontWeight: 700 }}>CHECK-INS</span>
                        <span style={{ fontSize: "14px", fontWeight: 800, color: "#10b981" }}>912</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── KEY USPS OF EVENT REGISTRATION SUITE ── */}
      <div style={{
        background: "linear-gradient(180deg, #1e0b36 0%, #0d061f 100%)",
        padding: "100px 24px",
        width: "100%",
        boxSizing: "border-box",
      }}>
        <section style={{
          maxWidth: "1200px",
          margin: "0 auto",
          textAlign: "center",
        }}>
          <h2 style={{
            fontSize: "clamp(28px, 4.5vw, 44px)",
            fontWeight: 800,
            color: "#ffffff",
            margin: "0 auto 16px",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            maxWidth: "800px",
          }}>
            Key USP's of Event Registration Suite
          </h2>
          <p style={{
            fontSize: "clamp(14px, 1.8vw, 16px)",
            color: "rgba(255, 255, 255, 0.7)",
            maxWidth: "750px",
            margin: "0 auto 60px",
            lineHeight: 1.6,
          }}>
            Ensure smooth event execution with SyncoraXP's robust tech, facial recognition check-in, on-spot registration, and instant badge printing.
          </p>

          {/* Cards Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "32px",
            width: "100%",
          }}>
            {/* Card 1: Facial Recognition */}
            <div style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "24px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              transition: "transform 0.3s ease, border-color 0.3s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.borderColor = "rgba(109, 40, 217, 0.3)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)"; }}
            >
              <div style={{ width: "100%", height: "360px", overflow: "hidden" }}>
                <img
                  src="/virtual-events-assets/event_reg_facial_kiosk.png"
                  alt="Facial Recognition Check-in"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", margin: "24px 0" }}>
                Facial Recognition Check-in
              </h3>
            </div>

            {/* Card 2: On-Spot Registration */}
            <div style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "24px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              transition: "transform 0.3s ease, border-color 0.3s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.borderColor = "rgba(109, 40, 217, 0.3)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)"; }}
            >
              <div style={{ width: "100%", height: "360px", overflow: "hidden" }}>
                <img
                  src="/virtual-events-assets/event_reg_forbes_desk.png"
                  alt="On-Spot Registration"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", margin: "24px 0" }}>
                On-Spot Registration
              </h3>
            </div>

            {/* Card 3: Badge Printing */}
            <div style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "24px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              transition: "transform 0.3s ease, border-color 0.3s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.borderColor = "rgba(109, 40, 217, 0.3)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)"; }}
            >
              <div style={{ width: "100%", height: "360px", overflow: "hidden" }}>
                <img
                  src="/virtual-events-assets/event_reg_badge_printing.png"
                  alt="Badge Printing Solutions"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", margin: "24px 0" }}>
                Badge Printing Solutions
              </h3>
            </div>
          </div>
        </section>
      </div>

      {/* ── MANAGE EVERY STEP SOLUTIONS SECTION ── */}
      <div style={{
        background: "#faf9ff",
        backgroundImage: "radial-gradient(rgba(109, 40, 217, 0.08) 1.5px, transparent 1.5px)",
        backgroundSize: "24px 24px",
        padding: "80px 24px",
        width: "100%",
        boxSizing: "border-box",
        borderTop: "1px solid rgba(109, 40, 217, 0.05)",
      }}>
        <section style={{
          maxWidth: "1100px",
          margin: "0 auto",
          textAlign: "center",
        }}>
          <p style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#6d28d9",
            textTransform: "uppercase",
            letterSpacing: "1px",
            marginBottom: "12px",
          }}>
            On-Ground Event Solutions for Smooth Operations
          </p>
          <style>{`
            @keyframes event-reg-on-ground-marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .event-reg-marquee-container:hover .event-reg-marquee-content {
              animation-play-state: paused !important;
            }
          `}</style>

          <h2 style={{
            fontSize: "clamp(24px, 3.8vw, 38px)",
            fontWeight: 850,
            color: "#1e1b4b",
            margin: "0 auto 48px",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}>
            Manage Every Step with Us
          </h2>

          {/* Marquee Wrapper */}
          <div 
            className="event-reg-marquee-container"
            style={{
              overflow: "hidden",
              width: "100%",
              display: "flex",
              position: "relative",
              maskImage: "linear-gradient(to right, transparent, white 10%, white 90%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, white 10%, white 90%, transparent)",
            }}
          >
            <div 
              className="event-reg-marquee-content"
              style={{
                display: "flex",
                gap: "24px",
                width: "max-content",
                animation: "event-reg-on-ground-marquee 25s linear infinite",
                padding: "10px 0",
              }}
            >
              {/* Main List & Duplicated List to create infinite loop */}
              {[
                { title: "Event Ticketing Platform", bg: "#fce7f3", stroke: "#db2777", icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                    <line x1="13" x2="13" y1="5" y2="19" strokeDasharray="3 3"/>
                  </svg>
                )},
                { title: "Mobile Event App", bg: "#ccfbf1", stroke: "#0d9488", icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                    <line x1="12" x2="12" y1="18" y2="18.01"/>
                    <path d="M12 6a3 3 0 0 1 3 3v1"/>
                  </svg>
                )},
                { title: "Event Check-In & Badge Printing", bg: "#ffedd5", stroke: "#ea580c", icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="16" rx="2"/>
                    <circle cx="12" cy="10" r="3"/>
                    <path d="M6 20a6 6 0 0 1 12 0"/>
                  </svg>
                )},
                { title: "Event Reg Platform", bg: "#eedffc", stroke: "#7c3aed", icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                )},
              ].concat([
                { title: "Event Ticketing Platform", bg: "#fce7f3", stroke: "#db2777", icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                    <line x1="13" x2="13" y1="5" y2="19" strokeDasharray="3 3"/>
                  </svg>
                )},
                { title: "Mobile Event App", bg: "#ccfbf1", stroke: "#0d9488", icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                    <line x1="12" x2="12" y1="18" y2="18.01"/>
                    <path d="M12 6a3 3 0 0 1 3 3v1"/>
                  </svg>
                )},
                { title: "Event Check-In & Badge Printing", bg: "#ffedd5", stroke: "#ea580c", icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="16" rx="2"/>
                    <circle cx="12" cy="10" r="3"/>
                    <path d="M6 20a6 6 0 0 1 12 0"/>
                  </svg>
                )},
                { title: "Event Reg Platform", bg: "#eedffc", stroke: "#7c3aed", icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                )},
              ]).map((card, idx) => (
                <div 
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    background: "#ffffff",
                    border: "1px solid rgba(109, 40, 217, 0.08)",
                    padding: "16px 28px",
                    borderRadius: "20px",
                    boxShadow: "0 10px 25px -5px rgba(109, 40, 217, 0.03)",
                    width: "310px",
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: card.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {card.icon}
                  </div>
                  <span style={{ fontSize: "15px", fontWeight: 800, color: "#1e1b4b" }}>
                    {card.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
