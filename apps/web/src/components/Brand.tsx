import { Link } from "react-router-dom";

export function Brand({ theme }: { theme?: "light" | "dark" }) {
  return (
    <Link className="brand" to="/" aria-label="SyncoraXP home">
      <span className="brand-logo" aria-hidden="true">
        <img src="/SyncoraXP_Logo.png" alt="" />
      </span>
      <span style={{ color: theme === "light" ? "#ffffff" : undefined }}>SyncoraXP</span>
    </Link>
  );
}
