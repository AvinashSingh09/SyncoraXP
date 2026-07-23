import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Cube, TrendUp, Lightbulb, UsersThree } from "@phosphor-icons/react";
import { MarketingHeader } from "../components/MarketingHeader";
import { Footer } from "../components/Footer";
import { apiFetch } from "../api";

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
  "Virtual Events",
  "Hybrid Events",
  "Webinars",
  "Live Streaming",
  "Registration",
  "Mobile Event App",
  "Event Check-In & Badges",
  "Event CRM",
  "Facial Recognition",
  "Others",
];

export function BookDemoPage() {
  const formRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    fullName: "", workEmail: "", countryCode: "+91",
    phone: "", city: "", company: "", category: "", message: "",
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

  const getMaxDigitsForCountry = (cc: string) => {
    if (cc === "+91" || cc === "+1") return 10;
    if (cc === "+971") return 9;
    if (cc === "+65") return 8;
    if (cc === "+61") return 9;
    if (cc === "+44" || cc === "+49") return 11;
    return 12;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    if (name === "phone" || e.target.type === "tel") {
      const maxDigits = getMaxDigitsForCountry(form.countryCode);
      value = value.replace(/\D/g, "").slice(0, maxDigits);
    }
    setForm((p) => {
      const nextForm = { ...p, [name]: value };
      if (name === "countryCode") {
        const max = getMaxDigitsForCountry(value);
        const trimmedPhone = p.phone.replace(/\D/g, "").slice(0, max);
        nextForm.phone = trimmedPhone;
        if (touched["phone"]) {
          const err = validateField("phone", trimmedPhone, value);
          setErrors((prev) => ({ ...prev, phone: err }));
        }
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

    // Mark all required fields as touched and perform validation
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

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const baseInputStyle: React.CSSProperties = {
    width: "100%",
    padding: "16px 18px",
    borderRadius: "14px",
    fontSize: "14px",
    color: "#2e1065",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
  };

  const getInputStyle = (name: string): React.CSSProperties => {
    const hasError = touched[name] && errors[name];
    return {
      ...baseInputStyle,
      border: hasError ? "1.5px solid #dc2626" : "1.5px solid #e9e8ff",
      background: hasError ? "#fff5f5" : "#f3f0ff",
      boxShadow: hasError ? "0 0 0 3px rgba(220, 38, 38, 0.15)" : "none",
    };
  };

  const renderError = (name: string) => {
    if (touched[name] && errors[name]) {
      return (
        <span style={{
          color: "#dc2626",
          fontSize: "11px",
          fontWeight: 700,
          marginTop: "4px",
          marginLeft: "4px",
          display: "block",
          textAlign: "left",
          animation: "fadeIn 0.2s ease",
        }}>
          {errors[name]}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="landing-page book-demo-page" style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Manrope', 'Inter', sans-serif",
      background: "#ffffff",
      color: "#1e1035",
      overflowX: "hidden",
    }}>
      {/* ── TOP HERO HALF (Lavender Purple-Dotted Background) ── */}
      <div style={{
        background: "#eadeff",
        backgroundImage: "radial-gradient(rgba(147, 51, 234, 0.12) 1.5px, transparent 1.5px)",
        backgroundSize: "24px 24px",
        width: "100%",
      }}>
        <MarketingHeader />

        {/* ── MAIN CONTENT (Split Column Layout matching Reference Image) ── */}
        <main style={{
          flex: 1,
          width: "min(1280px, calc(100% - 48px))",
          margin: "0 auto",
          padding: "145px 0 90px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "64px",
          alignItems: "center",
          minHeight: "calc(100vh - 80px)",
          boxSizing: "border-box",
        }}>
        {/* Left Info Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px", justifyContent: "center" }}>
          <h1 style={{
            fontSize: "clamp(38px, 4.4vw, 56px)",
            fontWeight: 850,
            lineHeight: 1.14,
            margin: 0,
            letterSpacing: "-0.03em",
            color: "#1e1035",
          }}>
            Let's Build<br />
            <span style={{
              background: "linear-gradient(135deg, #a855f7 0%, #2563eb 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              display: "inline-block",
            }}>
              Extraordinary
            </span><br />
            Events Together
          </h1>

          <p style={{
            fontSize: "clamp(15.5px, 1.55vw, 18px)",
            color: "#4c1d95",
            margin: 0,
            lineHeight: 1.6,
            fontWeight: 500,
            maxWidth: "560px",
          }}>
            Experience how SyncoraXP's interactive event technology can engage your audience, amplify your brand and deliver measurable results.
          </p>

          {/* In This Demo, You'll Discover Section */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            marginTop: "-4px",
          }}>
            {/* Title Header with subtle ornaments */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
            }}>
              <span style={{ color: "#7c3aed", fontSize: "14px", opacity: 0.65 }}>⟡──────</span>
              <h3 style={{
                fontSize: "clamp(18px, 2.2vw, 22px)",
                fontWeight: 800,
                color: "#1e1035",
                margin: 0,
                textAlign: "center",
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
              }}>
                In This Demo, You'll Discover
              </h3>
              <span style={{ color: "#7c3aed", fontSize: "14px", opacity: 0.65 }}>──────⟡</span>
            </div>

            {/* 4 Cards Row - Compact single horizontal row */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "14px",
              width: "100%",
            }}>
              {[
                {
                  icon: <Cube size={22} weight="fill" color="#7e22ce" />,
                  title: "Interactive Solutions",
                  desc: "Explore cutting-edge event tech built for immersive experiences.",
                  accent: "#7e22ce",
                  glowBg: "#f3e8ff",
                  glowBorder: "rgba(126, 34, 206, 0.25)",
                },
                {
                  icon: <TrendUp size={22} weight="bold" color="#2563eb" />,
                  title: "Smart Analytics",
                  desc: "See real-time data & insights to maximize engagement and ROI.",
                  accent: "#2563eb",
                  glowBg: "#eff6ff",
                  glowBorder: "rgba(37, 99, 235, 0.25)",
                },
                {
                  icon: <Lightbulb size={22} weight="fill" color="#db2777" />,
                  title: "Creative Ideas",
                  desc: "Get inspired with unique concepts tailored to your audience.",
                  accent: "#db2777",
                  glowBg: "#fce7f3",
                  glowBorder: "rgba(219, 39, 119, 0.25)",
                },
                {
                  icon: <UsersThree size={22} weight="fill" color="#0d9488" />,
                  title: "Expert Guidance",
                  desc: "Our event specialists are here to help plan your next big success.",
                  accent: "#0d9488",
                  glowBg: "#ccfbf1",
                  glowBorder: "rgba(13, 148, 136, 0.25)",
                },
              ].map((card, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#ffffff",
                    borderRadius: "14px",
                    borderTop: `4px solid ${card.accent}`,
                    borderLeft: "1.5px solid #000000",
                    borderRight: "1.5px solid #000000",
                    borderBottom: "1.5px solid #000000",
                    padding: "16px 10px 14px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.07)",
                    position: "relative",
                    overflow: "hidden",
                    minHeight: "155px",
                    boxSizing: "border-box",
                  }}
                >
                  {/* Glowing Icon Container */}
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: card.glowBg,
                    border: `1.5px solid ${card.glowBorder}`,
                    display: "grid",
                    placeItems: "center",
                    marginBottom: "10px",
                    flexShrink: 0,
                  }}>
                    {card.icon}
                  </div>

                  {/* Title */}
                  <h4 style={{
                    fontSize: "12px",
                    fontWeight: 900,
                    color: "#000000",
                    margin: "0 0 5px 0",
                    lineHeight: 1.25,
                  }}>
                    {card.title}
                  </h4>

                  {/* Description */}
                  <p style={{
                    fontSize: "10.5px",
                    color: "#1e293b",
                    margin: 0,
                    lineHeight: 1.4,
                    fontWeight: 600,
                  }}>
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Form Column */}
        <div ref={formRef} style={{ display: "flex", justifyContent: "center" }}>
          <div style={{
            background: "#fff",
            borderRadius: "28px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
            width: "100%",
            maxWidth: "520px",
            padding: "40px 36px",
            color: "#1e1b4b",
            boxSizing: "border-box",
          }}>
            {submitted ? (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                gap: "20px",
                padding: "40px 0",
              }}>
                <CheckCircle size={76} weight="fill" color="#7c3aed" />
                <h2 style={{ fontSize: "26px", fontWeight: 850, color: "#1e1b4b", margin: 0 }}>
                  You're All Set!
                </h2>
                <p style={{ color: "#64748b", fontSize: "14.5px", lineHeight: 1.6, margin: 0 }}>
                  Thank you for booking a demo. Our team will contact you within <strong>24 hours</strong> to schedule your personalized product walkthrough.
                </p>
                <Link
                  to="/virtual-events-platform"
                  style={{
                    marginTop: "12px",
                    background: "linear-gradient(135deg, #5b14bd 0%, #7c3aed 100%)",
                    color: "#fff",
                    textDecoration: "none",
                    borderRadius: "12px",
                    padding: "14px 36px",
                    fontWeight: 800,
                    fontSize: "15px",
                    boxShadow: "0 8px 24px rgba(124, 58, 237, 0.3)",
                  }}
                >
                  Back to Home
                </Link>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#1e1b4b", margin: "0 0 4px" }}>
                  Schedule a Demo
                </h2>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 28px", lineHeight: "1.4" }}>
                  Book a live demo and get all your queries resolved with our expert.
                </p>

                {submitError && (
                  <div style={{
                    background: "#fef2f2",
                    border: "1px solid #fee2e2",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    color: "#991b1b",
                    fontSize: "13px",
                    fontWeight: 550,
                    marginBottom: "16px",
                    textAlign: "left"
                  }}>
                    ⚠️ {submitError}
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Full Name */}
                  <div>
                    <input
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      maxLength={60}
                      placeholder="Full Name* (Max 60 chars)"
                      style={getInputStyle("fullName")}
                    />
                    {renderError("fullName")}
                  </div>

                  {/* Work Email */}
                  <div>
                    <input
                      name="workEmail"
                      type="email"
                      value={form.workEmail}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Your Work Email*"
                      style={getInputStyle("workEmail")}
                    />
                    {renderError("workEmail")}
                  </div>

                  {/* Phone Input with Country Code Selector */}
                  <div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <select
                          name="countryCode"
                          value={form.countryCode}
                          onChange={handleChange}
                          style={{
                            ...getInputStyle("phone"),
                            minWidth: "90px",
                            padding: "16px 28px 16px 14px",
                            appearance: "none",
                            cursor: "pointer",
                          }}
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.dial}>
                              {c.code} {c.dial}
                            </option>
                          ))}
                        </select>
                        <span style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: "9px",
                          color: "#6b21a8",
                          pointerEvents: "none",
                        }}>▼</span>
                      </div>
                      <input
                        name="phone"
                        type="tel"
                        value={form.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        maxLength={getMaxDigitsForCountry(form.countryCode)}
                        placeholder="Phone No.*"
                        style={{ ...getInputStyle("phone"), flex: 1 }}
                      />
                    </div>
                    {renderError("phone")}
                  </div>

                  {/* City */}
                  <div>
                    <input
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      maxLength={60}
                      placeholder="City* (Max 60 chars)"
                      style={getInputStyle("city")}
                    />
                    {renderError("city")}
                  </div>

                  {/* Company */}
                  <div>
                    <input
                      name="company"
                      value={form.company}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      maxLength={60}
                      placeholder="Company* (Max 60 chars)"
                      style={getInputStyle("company")}
                    />
                    {renderError("company")}
                  </div>

                  {/* Category of Business */}
                  <div>
                    <div style={{ position: "relative" }}>
                      <select
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        style={{
                          ...getInputStyle("category"),
                          appearance: "none",
                          cursor: "pointer",
                          color: form.category ? "#2e1065" : "#94a3b8",
                          width: "100%",
                          paddingRight: "36px",
                        }}
                      >
                        <option value="" disabled>
                          Category of Business*
                        </option>
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat} style={{ color: "#2e1065" }}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <span style={{
                        position: "absolute",
                        right: "16px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "9px",
                        color: "#6b21a8",
                        pointerEvents: "none",
                      }}>▼</span>
                    </div>
                    {renderError("category")}
                  </div>

                  {/* Message */}
                  <div>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      maxLength={2000}
                      rows={4}
                      placeholder="Message (Max 2000 chars)"
                      style={{
                        ...getInputStyle("message"),
                        resize: "vertical",
                        minHeight: "100px",
                        fontFamily: "inherit",
                        border: "1.5px solid #e9e8ff",
                        background: "#f3f0ff",
                        boxShadow: "none",
                      }}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      background: loading
                        ? "#a78bfa"
                        : "linear-gradient(135deg, #5b14bd 0%, #7c3aed 100%)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "14px",
                      padding: "16px 24px",
                      fontWeight: 800,
                      fontSize: "15px",
                      cursor: loading ? "not-allowed" : "pointer",
                      transition: "all 0.2s ease",
                      marginTop: "8px",
                      boxShadow: loading ? "none" : "0 8px 24px rgba(124, 58, 237, 0.35)",
                    }}
                  >
                    {loading ? "Submitting…" : "Submit"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
      </div>

      {/* ── SECOND HALF: SUPPORT PANEL SECTION (White Dotted Background) ── */}
      <section style={{
        background: "#ffffff",
        backgroundImage: "radial-gradient(rgba(147, 51, 234, 0.12) 1.5px, transparent 1.5px)",
        backgroundSize: "24px 24px",
        padding: "60px 24px 40px",
        color: "#1e1b4b",
        textAlign: "center",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
      }}>
        <style>{`
          .support-container {
            background: #ffffff;
            border-radius: 32px;
            border: 1.5px solid #f1f0ff;
            box-shadow: 0 16px 48px rgba(91, 20, 189, 0.04);
            width: 100%;
            max-width: 1200px;
            margin: 48px auto 0;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
          }
          .support-grid {
            display: grid;
            grid-template-columns: 1fr 380px;
            gap: 32px;
            padding: 48px;
            box-sizing: border-box;
          }
          .support-features {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 28px;
          }
          .support-feature-col {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            text-align: left;
          }
          .icon-circle {
            width: 54px;
            height: 54px;
            border-radius: 50%;
            background: #f3f0ff;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #7c3aed;
            margin-bottom: 20px;
          }
          .feature-title {
            font-size: 17px;
            font-weight: 800;
            color: #1e084a;
            margin: 0 0 8px 0;
          }
          .feature-desc {
            font-size: 13px;
            color: #64748b;
            line-height: 1.5;
            margin: 0 0 16px 0;
          }
          .feature-line {
            width: 32px;
            height: 2px;
            background: #e9e8ff;
            margin-bottom: 18px;
          }
          .feature-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
            list-style-type: none;
            padding: 0;
            margin: 0;
          }
          .feature-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: #4b5563;
            font-weight: 500;
          }
          .support-callout {
            background: linear-gradient(145deg, #f5f3ff 0%, #ede9fe 100%);
            border-radius: 24px;
            padding: 32px;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            text-align: left;
            min-height: 380px;
            box-sizing: border-box;
          }
          .support-callout-content {
            z-index: 2;
            max-width: 170px;
          }
          .support-avatar-stack {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
          }
          .support-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 2px solid #ffffff;
            margin-left: -8px;
            object-fit: cover;
          }
          .support-avatar:first-child {
            margin-left: 0;
          }
          .support-avatar-pill {
            background: #7c3aed;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            padding: 4px 8px;
            border-radius: 12px;
            border: 2px solid #ffffff;
            margin-left: -8px;
          }
          .callout-title {
            font-size: 20px;
            font-weight: 800;
            color: #1e084a;
            margin: 0 0 12px 0;
            line-height: 1.25;
          }
          .callout-title span {
            color: #7c3aed;
            display: block;
          }
          .callout-desc {
            font-size: 12.5px;
            color: #64748b;
            line-height: 1.5;
            margin: 0 0 24px 0;
          }
          .callout-btn {
            background: #ffffff;
            border: 1px solid #e9e8ff;
            border-radius: 12px;
            padding: 12px 18px;
            font-size: 13px;
            font-weight: 800;
            color: #7c3aed;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.05);
          }
          .callout-btn:hover {
            box-shadow: 0 6px 18px rgba(124, 58, 237, 0.12);
            transform: translateY(-1px);
          }
          .callout-agent-img {
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            height: 100%;
            width: 50%;
            object-fit: cover;
            z-index: 1;
            pointer-events: none;
          }
          .callout-badge {
            position: absolute;
            right: 16px;
            bottom: 16px;
            background: #ffffff;
            border-radius: 16px;
            padding: 12px 16px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.06);
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 3;
            max-width: 180px;
          }
          .support-stats-bar {
            background: #faf9ff;
            border-top: 1.5px solid #f1f0ff;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            padding: 24px 12px;
            border-bottom-left-radius: 30px;
            border-bottom-right-radius: 30px;
          }
          .stat-item {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 0 24px;
            box-sizing: border-box;
          }
          .stat-item:not(:last-child) {
            border-right: 1.5px solid #f1f0ff;
          }
          .stat-icon {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #ede9fe;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #7c3aed;
            flex-shrink: 0;
          }
          .stat-value-group {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            text-align: left;
          }
          .stat-value {
            font-size: 16px;
            font-weight: 850;
            color: #7c3aed;
            line-height: 1.2;
          }
          .stat-label {
            font-size: 11px;
            color: #64748b;
            font-weight: 600;
            margin-top: 2px;
          }
          @media (max-width: 1024px) {
            .support-grid {
              grid-template-columns: 1fr;
              padding: 24px;
            }
            .support-callout {
              min-height: 320px;
            }
          }
          @media (max-width: 768px) {
            .support-features {
              grid-template-columns: 1fr;
              gap: 36px;
            }
            .support-stats-bar {
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              padding: 24px;
            }
            .stat-item {
              padding: 0;
              justify-content: flex-start;
            }
            .stat-item:not(:last-child) {
              border-right: none;
            }
          }
          @media (max-width: 480px) {
            .support-stats-bar {
              grid-template-columns: 1fr;
            }
          }
        `}</style>


        <h2 style={{
          fontSize: "clamp(30px, 4vw, 44px)",
          fontWeight: 900,
          color: "#1e084a",
          margin: "0 0 14px 0",
          lineHeight: 1.15,
          letterSpacing: "-0.03em"
        }}>
          Reliable Support,<br />Right When You Need It
        </h2>
        <p style={{
          fontSize: "15px",
          color: "#64748b",
          maxWidth: "540px",
          margin: "0 auto 48px",
          lineHeight: 1.5,
          fontWeight: 500
        }}>
          Our dedicated support team and robust systems ensure your business stays up and running—no matter what.
        </p>

        <div className="support-container">
          <div className="support-grid">
            {/* Left columns */}
            <div className="support-features">

              {/* Column 1 */}
              <div className="support-feature-col">
                <div className="icon-circle">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                  </svg>
                </div>
                <h4 className="feature-title">Round-the-Clock Support</h4>
                <p className="feature-desc">Help available anytime, wherever you operate.</p>
                <div className="feature-line"></div>
                <ul className="feature-list">
                  <li className="feature-item">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    24/7 live support
                  </li>
                  <li className="feature-item">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Multiple channels
                  </li>
                  <li className="feature-item">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Global coverage
                  </li>
                </ul>
              </div>

              {/* Column 2 */}
              <div className="support-feature-col">
                <div className="icon-circle">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h4 className="feature-title">Rapid Issue Resolution</h4>
                <p className="feature-desc">Problems addressed within minutes, not hours.</p>
                <div className="feature-line"></div>
                <ul className="feature-list">
                  <li className="feature-item">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Quick response time
                  </li>
                  <li className="feature-item">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Expert problem solvers
                  </li>
                  <li className="feature-item">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    First-time resolution priority
                  </li>
                </ul>
              </div>

              {/* Column 3 */}
              <div className="support-feature-col">
                <div className="icon-circle">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h4 className="feature-title">Proven System Reliability</h4>
                <p className="feature-desc">Enterprise-grade consistency you can depend on.</p>
                <div className="feature-line"></div>
                <ul className="feature-list">
                  <li className="feature-item">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    99.99% uptime
                  </li>
                  <li className="feature-item">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Proactive monitoring
                  </li>
                  <li className="feature-item">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Regular system updates
                  </li>
                </ul>
              </div>
            </div>

            {/* Right side callout */}
            <div className="support-callout">
              <div className="support-callout-content">
                <div className="support-avatar-stack">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?fit=crop&w=128&h=128&q=80" className="support-avatar" alt="" />
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=128&h=128&q=80" className="support-avatar" alt="" />
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?fit=crop&w=128&h=128&q=80" className="support-avatar" alt="" />
                  <div className="support-avatar-pill">+25</div>
                </div>

                <h4 className="callout-title">
                  We're Here<br /><span>For You!</span>
                </h4>
                <p className="callout-desc">
                  Our support specialists are ready to assist you with any question or challenge.
                </p>

                <button className="callout-btn" onClick={scrollToForm}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                  </svg>
                  Contact Support
                </button>
              </div>

              {/* Agent image */}
              <img
                src="/images/support-agent.jpg"
                className="callout-agent-img"
                alt="Support Agent"
                draggable="false"
              />

              {/* Floating response badge */}
              <div className="callout-badge">
                <div style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  flexShrink: 0
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left" }}>
                  <span style={{ fontSize: "8px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.2px" }}>Average Response Time</span>
                  <span style={{ fontSize: "14px", fontWeight: 900, color: "#1e084a", marginTop: "1px" }}>2.4 mins</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="support-stats-bar">
            {/* Stat 1 */}
            <div className="stat-item">
              <div className="stat-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="stat-value-group">
                <span className="stat-value">24/7</span>
                <span className="stat-label">Support Availability</span>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="stat-item">
              <div className="stat-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <div className="stat-value-group">
                <span className="stat-value">2.4 mins</span>
                <span className="stat-label">Average Response Time</span>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="stat-item">
              <div className="stat-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 11 11 13 15 9" />
                </svg>
              </div>
              <div className="stat-value-group">
                <span className="stat-value">99.99%</span>
                <span className="stat-label">System Uptime</span>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="stat-item">
              <div className="stat-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
              </div>
              <div className="stat-value-group">
                <span className="stat-value">98%</span>
                <span className="stat-label">Customer Satisfaction</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

