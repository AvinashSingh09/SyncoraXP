import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Brand } from "../components/Brand";
import { useAuth } from "../auth/AuthContext";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { user, loading, login, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "register") await register({ name, email, password });
      else await login({ email, password });
      navigate("/");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="site-shell auth-shell">
      <header className="topbar"><Brand /><span className="step-pill">Host account</span></header>
      <section className="auth-layout">
        <div className="auth-story">
          <p className="eyebrow">Host identity</p>
          <h1>Your room. Your controls.</h1>
          <p className="lead">Hosts sign in to create and manage meetings. Guests still join directly through their private invitation link.</p>
        </div>
        <form className="meeting-form auth-card" onSubmit={submit}>
          <div className="form-heading"><span>{mode === "register" ? "Create host account" : "Welcome back"}</span></div>
          {mode === "register" && (
            <label>Your name *<input autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Asha Rao" /></label>
          )}
          <label>Email address *<input autoComplete="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="asha@company.com" /></label>
          <label>Password *<input autoComplete={mode === "register" ? "new-password" : "current-password"} required minLength={mode === "register" ? 10 : 1} maxLength={128} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "register" ? "At least 10 characters" : "Your password"} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button primary submit-button" disabled={submitting} type="submit">
            {submitting ? "Please wait..." : mode === "register" ? "Create account" : "Sign in"}
          </button>
          <p className="auth-switch">
            {mode === "register" ? "Already have a host account?" : "New to VoiceMeet?"}{" "}
            <Link to={mode === "register" ? "/login" : "/register"}>{mode === "register" ? "Sign in" : "Create one"}</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
