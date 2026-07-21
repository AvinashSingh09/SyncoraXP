import { useState, useRef, useEffect } from "react";
import { CheckCircle, CaretDown } from "@phosphor-icons/react";

const COUNTRY_CODES = [
  { code: "IN", dial: "+91", flagUrl: "https://flagcdn.com/w40/in.png" },
  { code: "US", dial: "+1", flagUrl: "https://flagcdn.com/w40/us.png" },
  { code: "GB", dial: "+44", flagUrl: "https://flagcdn.com/w40/gb.png" },
  { code: "AE", dial: "+971", flagUrl: "https://flagcdn.com/w40/ae.png" },
  { code: "SG", dial: "+65", flagUrl: "https://flagcdn.com/w40/sg.png" },
  { code: "AU", dial: "+61", flagUrl: "https://flagcdn.com/w40/au.png" },
  { code: "CA", dial: "+1", flagUrl: "https://flagcdn.com/w40/ca.png" },
  { code: "DE", dial: "+49", flagUrl: "https://flagcdn.com/w40/de.png" },
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
  "33-removebg-preview.png", "34.jfif", "35.png", "36.png", "37.jfif"
];

export function WebinarLeadFormSection() {
  const [formData, setFormData] = useState({
    fullName: "",
    workEmail: "",
    countryCode: "IN",
    phoneDial: "+91",
    phone: "",
    city: "",
    company: "",
    category: "",
    message: "",
  });

  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCountryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const validateField = (name: string, value: string): string => {
    let error = "";
    if (name === "fullName") {
      if (!value.trim()) {
        error = "Full Name is required";
      } else if (value.trim().length < 2) {
        error = "Full Name must be at least 2 characters";
      }
    } else if (name === "workEmail") {
      if (!value.trim()) {
        error = "Work Email is required";
      } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value.trim())) {
        error = "Enter a valid work email address (e.g. name@company.com)";
      }
    } else if (name === "phone") {
      const digits = value.replace(/\D/g, "");
      if (!value.trim()) {
        error = "Phone number is required";
      } else if (digits.length < 6 || digits.length > 15) {
        error = "Enter a valid phone number (6-15 digits)";
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
        error = "Please select a Category of Business";
      }
    }
    return error;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touchedFields[name]) {
      const error = validateField(name, value);
      setFormErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateAll = () => {
    const errors: Record<string, string> = {
      fullName: validateField("fullName", formData.fullName),
      workEmail: validateField("workEmail", formData.workEmail),
      phone: validateField("phone", formData.phone),
      city: validateField("city", formData.city),
      company: validateField("company", formData.company),
      category: validateField("category", formData.category),
    };

    // Mark all as touched
    setTouchedFields({
      fullName: true,
      workEmail: true,
      phone: true,
      city: true,
      company: true,
      category: true,
    });

    const activeErrors: Record<string, string> = {};
    Object.keys(errors).forEach((key) => {
      if (errors[key]) activeErrors[key] = errors[key];
    });

    setFormErrors(activeErrors);
    return Object.keys(activeErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!validateAll()) {
      setErrorMsg("Please correct the highlighted fields before submitting.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          workEmail: formData.workEmail.trim(),
          phone: `${formData.phoneDial} ${formData.phone.trim()}`,
          countryCode: formData.countryCode,
          city: formData.city.trim(),
          company: formData.company.trim(),
          category: formData.category,
          message: formData.message.trim(),
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        setSubmitted(true);
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const getFieldClass = (name: string, val: string) => {
    if (formErrors[name]) return "input-error";
    if (touchedFields[name] && val.trim() && !formErrors[name]) return "input-valid";
    return "";
  };

  return (
    <section className="webinar-lead-section" aria-label="Brands and Event Contact Form">
      <div className="webinar-lead-container">
        
        {/* Brand Logos Header */}
        <div className="brand-logos-wrapper">
          <h3 className="brand-logos-title">Trusted by Global Leaders &amp; Industry Pioneers</h3>

          <div className="brand-marquee-track-outer">
            <div className="brand-marquee-track">
              {brandLogoFiles.map((file, idx) => (
                <img
                  key={`b1-${idx}`}
                  src={`/brands/${file}`}
                  alt={`Brand Logo ${idx + 1}`}
                  className="brand-normal-logo-img"
                  loading="lazy"
                />
              ))}
              {brandLogoFiles.map((file, idx) => (
                <img
                  key={`b2-${idx}`}
                  src={`/brands/${file}`}
                  alt={`Brand Logo ${idx + 1}`}
                  className="brand-normal-logo-img"
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Purple Contact Lead Form Card */}
        <div className="webinar-form-card">
          
          {/* Left Side: Headline */}
          <div className="form-card-left">
            <h2 className="form-headline">
              Let's Get<br />Your Event<br />Going!
            </h2>
            <p className="form-subheadline">Connect With Us Today!</p>
          </div>

          {/* Right Side: Form Inputs */}
          <div className="form-card-right">
            {submitted ? (
              <div className="form-success-message">
                <CheckCircle size={56} weight="fill" className="success-icon" />
                <h3>Your Event Request Has Been Received!</h3>
                <p>Thank you! Our event team will review your details and connect with you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="webinar-contact-form" noValidate>
                {errorMsg && <div className="form-error-banner">{errorMsg}</div>}

                {/* Form Row 1 */}
                <div className="form-row two-cols">
                  <div className="form-field">
                    <input
                      type="text"
                      name="fullName"
                      placeholder="Full Name* (Max 60 chars)"
                      maxLength={60}
                      value={formData.fullName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={getFieldClass("fullName", formData.fullName)}
                    />
                    {formErrors.fullName && <span className="field-error-text">{formErrors.fullName}</span>}
                  </div>
                  <div className="form-field">
                    <input
                      type="email"
                      name="workEmail"
                      placeholder="Your Work Email*"
                      value={formData.workEmail}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={getFieldClass("workEmail", formData.workEmail)}
                    />
                    {formErrors.workEmail && <span className="field-error-text">{formErrors.workEmail}</span>}
                  </div>
                  <div className="form-field">
                    <div className={`phone-combo-field ${getFieldClass("phone", formData.phone)}`}>
                      <div className="country-custom-dropdown-container" ref={dropdownRef}>
                        <button
                          type="button"
                          className="country-dropdown-btn"
                          onClick={() => setIsCountryOpen((prev) => !prev)}
                        >
                          <img
                            src={COUNTRY_CODES.find((c) => c.code === formData.countryCode)?.flagUrl || "https://flagcdn.com/w40/in.png"}
                            alt={formData.countryCode}
                            className="country-btn-flag-img"
                          />
                          <span className="country-btn-code">{formData.countryCode}</span>
                          <CaretDown size={14} weight="bold" className={`dropdown-caret ${isCountryOpen ? "open" : ""}`} />
                        </button>

                        {isCountryOpen && (
                          <div className="custom-country-menu">
                            {COUNTRY_CODES.map((c) => (
                              <button
                                key={c.code}
                                type="button"
                                className={`country-menu-item ${c.code === formData.countryCode ? "active" : ""}`}
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    countryCode: c.code,
                                    phoneDial: c.dial,
                                  }));
                                  setIsCountryOpen(false);
                                }}
                              >
                                <img src={c.flagUrl} alt={c.code} className="country-item-flag-img" />
                                <span className="item-code">{c.code}</span>
                                <span className="item-dial">{c.dial}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <input
                        type="tel"
                        name="phone"
                        placeholder={`${formData.phoneDial} Phone No.*`}
                        value={formData.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </div>
                    {formErrors.phone && <span className="field-error-text">{formErrors.phone}</span>}
                  </div>
                </div>

                {/* Form Row 2 */}
                <div className="form-row three-cols">
                  <div className="form-field">
                    <input
                      type="text"
                      name="city"
                      placeholder="City* (Max 60 chars)"
                      maxLength={60}
                      value={formData.city}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={getFieldClass("city", formData.city)}
                    />
                    {formErrors.city && <span className="field-error-text">{formErrors.city}</span>}
                  </div>
                  <div className="form-field">
                    <input
                      type="text"
                      name="company"
                      placeholder="Company* (Max 60 chars)"
                      maxLength={60}
                      value={formData.company}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={getFieldClass("company", formData.company)}
                    />
                    {formErrors.company && <span className="field-error-text">{formErrors.company}</span>}
                  </div>
                  <div className="form-field">
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`category-select ${getFieldClass("category", formData.category)}`}
                    >
                      <option value="">Category of Business*</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {formErrors.category && <span className="field-error-text">{formErrors.category}</span>}
                  </div>
                </div>

                {/* Form Row 3: Message Textarea */}
                <div className="form-row single-col">
                  <div className="form-field">
                    <textarea
                      name="message"
                      placeholder="Message (Max 2000 chars)"
                      maxLength={2000}
                      rows={3}
                      value={formData.message}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Form Row 4: Submit Button */}
                <div className="form-row button-row">
                  <button type="submit" className="form-submit-btn" disabled={submitting}>
                    {submitting ? "Sending Request..." : "Submit"}
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>

      </div>
    </section>
  );
}
