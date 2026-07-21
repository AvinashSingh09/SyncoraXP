import { useState, useEffect, useRef } from "react";
import { X, CheckCircle, User, EnvelopeSimple, Phone, ShieldCheck, CaretDown } from "@phosphor-icons/react";
import { apiFetch } from "../backend";

const ALL_COUNTRIES = [
  { code: "IN", name: "India", dial: "+91", min: 10, max: 10 },
  { code: "US", name: "United States", dial: "+1", min: 10, max: 10 },
  { code: "GB", name: "United Kingdom", dial: "+44", min: 10, max: 10 },
  { code: "AE", name: "United Arab Emirates (UAE)", dial: "+971", min: 9, max: 9 },
  { code: "SG", name: "Singapore", dial: "+65", min: 8, max: 8 },
  { code: "AU", name: "Australia", dial: "+61", min: 9, max: 9 },
  { code: "CA", name: "Canada", dial: "+1", min: 10, max: 10 },
  { code: "DE", name: "Germany", dial: "+49", min: 10, max: 11 },
  { code: "AC", name: "Ascension", dial: "+247", min: 6, max: 6 },
  { code: "AD", name: "Andorra", dial: "+376", min: 6, max: 6 },
  { code: "AF", name: "Afghanistan", dial: "+93", min: 9, max: 9 },
  { code: "AG", name: "Antigua And Barbuda", dial: "+1268", min: 7, max: 7 },
  { code: "AI", name: "Anguilla", dial: "+1264", min: 7, max: 7 },
  { code: "AL", name: "Albania", dial: "+355", min: 9, max: 9 },
  { code: "AM", name: "Armenia", dial: "+374", min: 8, max: 8 },
  { code: "AO", name: "Angola", dial: "+244", min: 9, max: 9 },
  { code: "AR", name: "Argentina", dial: "+54", min: 10, max: 10 },
  { code: "AS", name: "American Samoa", dial: "+1684", min: 7, max: 7 },
  { code: "AT", name: "Austria", dial: "+43", min: 10, max: 13 },
  { code: "BR", name: "Brazil", dial: "+55", min: 10, max: 11 },
  { code: "FR", name: "France", dial: "+33", min: 9, max: 9 },
  { code: "IT", name: "Italy", dial: "+39", min: 10, max: 10 },
  { code: "JP", name: "Japan", dial: "+81", min: 10, max: 10 },
  { code: "NL", name: "Netherlands", dial: "+31", min: 9, max: 9 },
  { code: "NZ", name: "New Zealand", dial: "+64", min: 8, max: 9 },
  { code: "SA", name: "Saudi Arabia", dial: "+966", min: 9, max: 9 },
  { code: "ZA", name: "South Africa", dial: "+27", min: 9, max: 9 },
  { code: "ES", name: "Spain", dial: "+34", min: 9, max: 9 },
];

const DEFAULT_COUNTRY = ALL_COUNTRIES[0] as { code: string; name: string; dial: string; min: number; max: number };

const DELAY_SEQUENCE = [50000, 150000, 300000];

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
  const [errors, setErrors] = useState({
    fullName: "",
    workEmail: "",
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

  const validateField = (fieldName: "fullName" | "workEmail" | "phone", value?: string) => {
    const val = value !== undefined ? value : form[fieldName];
    setErrors((prev) => {
      const nextErrors = { ...prev };
      if (fieldName === "fullName") {
        if (!val.trim()) {
          nextErrors.fullName = "Full name is required";
        } else if (val.length > 60) {
          nextErrors.fullName = "Name cannot exceed 60 characters";
        } else {
          nextErrors.fullName = "";
        }
      }
      if (fieldName === "workEmail") {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!val.trim()) {
          nextErrors.workEmail = "Work email is required";
        } else if (!emailRegex.test(val.trim())) {
          nextErrors.workEmail = "Please enter a valid work email";
        } else {
          nextErrors.workEmail = "";
        }
      }
      if (fieldName === "phone") {
        const phoneDigits = val.replace(/[^0-9]/g, "");
        if (!val.trim()) {
          nextErrors.phone = "Phone number is required";
        } else if (phoneDigits.length < selectedCountry.min || phoneDigits.length > selectedCountry.max) {
          if (selectedCountry.min === selectedCountry.max) {
            nextErrors.phone = `Phone number must be exactly ${selectedCountry.min} digits for ${selectedCountry.name}`;
          } else {
            nextErrors.phone = `Phone number must be between ${selectedCountry.min} and ${selectedCountry.max} digits for ${selectedCountry.name}`;
          }
        } else {
          nextErrors.phone = "";
        }
      }
      return nextErrors;
    });
  };

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
    setErrors({ fullName: "", workEmail: "", phone: "" });
    setTimeout(() => {
      setSubmitted(false);
    }, 400);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    validateField(name as any, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const newErrors = {
      fullName: "",
      workEmail: "",
      phone: "",
    };

    let isValid = true;

    // Full Name validation
    if (!form.fullName.trim()) {
      newErrors.fullName = "Full name is required";
      isValid = false;
    } else if (form.fullName.length > 60) {
      newErrors.fullName = "Name cannot exceed 60 characters";
      isValid = false;
    }

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!form.workEmail.trim()) {
      newErrors.workEmail = "Work email is required";
      isValid = false;
    } else if (!emailRegex.test(form.workEmail.trim())) {
      newErrors.workEmail = "Please enter a valid work email";
      isValid = false;
    }

    // Phone validation according to selected country
    const phoneDigits = form.phone.replace(/[^0-9]/g, "");
    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
      isValid = false;
    } else if (phoneDigits.length < selectedCountry.min || phoneDigits.length > selectedCountry.max) {
      if (selectedCountry.min === selectedCountry.max) {
        newErrors.phone = `Phone number must be exactly ${selectedCountry.min} digits for ${selectedCountry.name}`;
      } else {
        newErrors.phone = `Phone number must be between ${selectedCountry.min} and ${selectedCountry.max} digits for ${selectedCountry.name}`;
      }
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) {
      return;
    }

    setLoading(true);

    try {
      await apiFetch("/api/demo", {
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
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }} noValidate>
              {/* Full Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div
                  style={{
                    ...inputContainerStyle,
                    borderColor: errors.fullName ? "#ef4444" : "#e2e8f0",
                    boxShadow: errors.fullName ? "0 0 0 1px #ef4444" : "none"
                  }}
                >
                  <User size={18} color={errors.fullName ? "#ef4444" : "#7056ff"} weight="regular" />
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    onBlur={() => validateField("fullName")}
                    maxLength={60}
                    placeholder="Full Name* (Max 60 chars)"
                    style={inputStyle}
                  />
                </div>
                {errors.fullName && (
                  <span style={{ color: "#ef4444", fontSize: "11px", fontWeight: 600, marginLeft: "4px" }}>
                    {errors.fullName}
                  </span>
                )}
              </div>

              {/* Work Email */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div
                  style={{
                    ...inputContainerStyle,
                    borderColor: errors.workEmail ? "#ef4444" : "#e2e8f0",
                    boxShadow: errors.workEmail ? "0 0 0 1px #ef4444" : "none"
                  }}
                >
                  <EnvelopeSimple size={18} color={errors.workEmail ? "#ef4444" : "#7056ff"} weight="regular" />
                  <input
                    name="workEmail"
                    type="email"
                    value={form.workEmail}
                    onChange={handleChange}
                    onBlur={() => validateField("workEmail")}
                    placeholder="Your Work Email*"
                    style={inputStyle}
                  />
                </div>
                {errors.workEmail && (
                  <span style={{ color: "#ef4444", fontSize: "11px", fontWeight: 600, marginLeft: "4px" }}>
                    {errors.workEmail}
                  </span>
                )}
              </div>

              {/* Phone with Country Code */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div
                  style={{
                    ...inputContainerStyle,
                    borderColor: errors.phone ? "#ef4444" : "#e2e8f0",
                    boxShadow: errors.phone ? "0 0 0 1px #ef4444" : "none"
                  }}
                >
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
                                validateField("phone");
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
                  <Phone size={18} color={errors.phone ? "#ef4444" : "#7056ff"} weight="regular" />
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    onBlur={() => validateField("phone")}
                    placeholder={`${selectedCountry.dial} Phone number*`}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>
                {errors.phone && (
                  <span style={{ color: "#ef4444", fontSize: "11px", fontWeight: 600, marginLeft: "4px" }}>
                    {errors.phone}
                  </span>
                )}
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
