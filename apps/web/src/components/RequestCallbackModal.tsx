import { useState, useEffect, useRef } from "react";
import { X, CheckCircle, User, EnvelopeSimple, Phone, ShieldCheck, CaretDown } from "@phosphor-icons/react";

const ALL_COUNTRIES = [
  { code: "IN", name: "India", dial: "+91" },
  { code: "US", name: "United States", dial: "+1" },
  { code: "GB", name: "United Kingdom", dial: "+44" },
  { code: "AE", name: "United Arab Emirates (UAE)", dial: "+971" },
  { code: "SG", name: "Singapore", dial: "+65" },
  { code: "AU", name: "Australia", dial: "+61" },
  { code: "CA", name: "Canada", dial: "+1" },
  { code: "DE", name: "Germany", dial: "+49" },
  { code: "AC", name: "Ascension", dial: "+247" },
  { code: "AD", name: "Andorra", dial: "+376" },
  { code: "AF", name: "Afghanistan", dial: "+93" },
  { code: "AG", name: "Antigua And Barbuda", dial: "+1268" },
  { code: "AI", name: "Anguilla", dial: "+1264" },
  { code: "AL", name: "Albania", dial: "+355" },
  { code: "AM", name: "Armenia", dial: "+374" },
  { code: "AO", name: "Angola", dial: "+244" },
  { code: "AR", name: "Argentina", dial: "+54" },
  { code: "AS", name: "American Samoa", dial: "+1684" },
  { code: "AT", name: "Austria", dial: "+43" },
  { code: "BR", name: "Brazil", dial: "+55" },
  { code: "FR", name: "France", dial: "+33" },
  { code: "IT", name: "Italy", dial: "+39" },
  { code: "JP", name: "Japan", dial: "+81" },
  { code: "NL", name: "Netherlands", dial: "+31" },
  { code: "NZ", name: "New Zealand", dial: "+64" },
  { code: "SA", name: "Saudi Arabia", dial: "+966" },
  { code: "ZA", name: "South Africa", dial: "+27" },
  { code: "ES", name: "Spain", dial: "+34" },
];

const DEFAULT_COUNTRY = ALL_COUNTRIES[0] as { code: string; name: string; dial: string };

const DELAY_SEQUENCE = [5000, 15000, 30000];

export function RequestCallbackModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [delayIndex, setDelayIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    fullName: "",
    workEmail: "",
    countryCode: "+91",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Close dropdown on outside click
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // If user has already submitted the form, do not pop up again
    const isSubmitted = localStorage.getItem("syncora_callback_submitted");
    if (isSubmitted === "true") return;

    if (isOpen) return;

    // Get current delay from sequence: 5s -> 15s -> 30s
    const currentDelay = DELAY_SEQUENCE[Math.min(delayIndex, DELAY_SEQUENCE.length - 1)];

    const timer = setTimeout(() => {
      const checkSubmitted = localStorage.getItem("syncora_callback_submitted");
      if (checkSubmitted !== "true") {
        setIsOpen(true);
      }
    }, currentDelay);

    return () => clearTimeout(timer);
  }, [isOpen, delayIndex]);

  const handleClose = () => {
    setIsOpen(false);
    setDropdownOpen(false);
    setDelayIndex((prev) => prev + 1);
    setTimeout(() => {
      setSubmitted(false);
    }, 400);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!form.fullName.trim()) {
      setErrorMessage("Please enter your full name");
      return;
    }
    if (!form.workEmail.trim() || !form.workEmail.includes("@")) {
      setErrorMessage("Please enter a valid work email");
      return;
    }
    if (!form.phone.trim()) {
      setErrorMessage("Please enter your phone number");
      return;
    }

    setLoading(true);

    try {
      await fetch("/api/demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          workEmail: form.workEmail.trim(),
          phone: form.phone.trim(),
          countryCode: selectedCountry.dial,
          city: "N/A",
          company: "N/A",
          category: "Call Back Request",
          message: "Request A Call Back pop-up lead submission",
        }),
      }).catch((err) => {
        console.warn("API submission background notice:", err);
      });
    } catch (err: any) {
      console.warn("Submission handler notice:", err);
    } finally {
      localStorage.setItem("syncora_callback_submitted", "true");
      if (form.workEmail.trim()) {
        localStorage.setItem("syncora_callback_submitted_email", form.workEmail.trim().toLowerCase());
      }
      setSubmitted(true);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputContainerStyle: React.CSSProperties = {
    background: "#ffffff",
    border: "1.5px solid #e2e8f0",
    borderRadius: "12px",
    padding: "4px 14px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 0",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "14px",
    color: "#1e293b",
    fontFamily: "inherit",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "transparent",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          pointerEvents: "auto",
          position: "relative",
          width: "100%",
          maxWidth: "460px",
          background: "#ffffff",
          borderRadius: "24px",
          padding: "36px 32px 28px",
          boxShadow: "0 20px 60px -10px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.08)",
          boxSizing: "border-box",
          animation: "slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            background: "#f8fafc",
            border: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#334155",
            transition: "background 0.2s, transform 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f1f5f9";
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#f8fafc";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <X size={18} weight="bold" />
        </button>

        {submitted ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "16px 8px 8px",
              gap: "16px",
            }}
          >
            <CheckCircle size={64} weight="fill" color="#6d28d9" />
            <div>
              <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#2e0854", margin: "0 0 8px" }}>
                Request Submitted!
              </h3>
              <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.5", margin: 0 }}>
                Thank you! Our sales team has received your details and will call you back shortly.
              </p>
            </div>
            <button
              onClick={handleClose}
              style={{
                marginTop: "12px",
                width: "100%",
                background: "#7056ff",
                color: "#ffffff",
                border: "none",
                borderRadius: "14px",
                padding: "14px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(112, 86, 255, 0.35)",
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Header Section */}
            <div style={{ textAlign: "center", marginBottom: "22px" }}>
              <h2
                style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  color: "#2e0854",
                  margin: "0 0 6px",
                  letterSpacing: "-0.02em",
                }}
              >
                Request a Call Back
              </h2>
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#1e293b",
                  margin: "0 0 0",
                }}
              >
                Connect with Our Sales Team Today!
              </h4>
              <div
                style={{
                  width: "36px",
                  height: "2.5px",
                  background: "#7056ff",
                  borderRadius: "2px",
                  margin: "10px auto 12px",
                }}
              />
              <p
                style={{
                  fontSize: "13.5px",
                  color: "#64748b",
                  margin: 0,
                  lineHeight: "1.45",
                  maxWidth: "340px",
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                Fill in your details and our team will get back to you shortly.
              </p>
            </div>

            {errorMessage && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  color: "#991b1b",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "16px",
                  textAlign: "center",
                }}
              >
                {errorMessage}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Full Name */}
              <div style={inputContainerStyle}>
                <User size={18} color="#7056ff" weight="regular" />
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  maxLength={60}
                  placeholder="Full Name* (Max 60 chars)"
                  required
                  style={inputStyle}
                />
              </div>

              {/* Work Email */}
              <div style={inputContainerStyle}>
                <EnvelopeSimple size={18} color="#7056ff" weight="regular" />
                <input
                  name="workEmail"
                  type="email"
                  value={form.workEmail}
                  onChange={handleChange}
                  placeholder="Your Work Email*"
                  required
                  style={inputStyle}
                />
              </div>

              {/* Phone with Country Code */}
              <div style={inputContainerStyle}>
                <div ref={dropdownRef} style={{ position: "relative", flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    style={{
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      fontSize: "13.5px",
                      fontWeight: 700,
                      color: "#1e293b",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "6px 4px",
                      fontFamily: "inherit",
                    }}
                  >
                    <span>{selectedCountry.code}</span>
                    <CaretDown size={13} color="#64748b" weight="bold" />
                  </button>

                  {dropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        left: "-14px",
                        width: "280px",
                        maxHeight: "240px",
                        overflowY: "auto",
                        background: "#ffffff",
                        borderRadius: "12px",
                        boxShadow: "0 12px 36px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.08)",
                        zIndex: 1000,
                        padding: "6px 0",
                      }}
                    >
                      {ALL_COUNTRIES.map((c) => {
                        const isSelected = c.code === selectedCountry.code && c.dial === selectedCountry.dial;
                        return (
                          <div
                            key={`${c.code}-${c.dial}`}
                            onClick={() => {
                              setSelectedCountry(c);
                              setDropdownOpen(false);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "10px 16px",
                              cursor: "pointer",
                              fontSize: "13.5px",
                              background: isSelected ? "#2563eb" : "transparent",
                              color: isSelected ? "#ffffff" : "#1e293b",
                              transition: "background 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.background = "#f1f5f9";
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 800,
                                letterSpacing: "0.5px",
                                color: isSelected ? "#ffffff" : "#64748b",
                                minWidth: "22px",
                                textTransform: "uppercase",
                              }}
                            >
                              {c.code}
                            </span>
                            <span style={{ fontWeight: isSelected ? 700 : 500, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {c.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={{ width: "1px", height: "22px", background: "#cbd5e1", marginRight: "4px" }} />
                <Phone size={18} color="#7056ff" weight="regular" />
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder={`${selectedCountry.dial} Phone number*`}
                  required
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: "8px",
                  width: "100%",
                  background: loading ? "#a78bfa" : "#7056ff",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "16px",
                  padding: "15px 24px",
                  fontSize: "16px",
                  fontWeight: 800,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 8px 24px rgba(112, 86, 255, 0.35)",
                  transition: "all 0.2s ease",
                  letterSpacing: "0.2px",
                }}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>

              {/* Security footnote */}
              <div
                style={{
                  marginTop: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  color: "#94a3b8",
                  fontSize: "12px",
                }}
              >
                <ShieldCheck size={16} color="#c084fc" weight="fill" />
                <span>Your information is secure and will not be shared.</span>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
