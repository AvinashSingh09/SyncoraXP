import { Link } from "react-router-dom";

export function Brand() {
  return (
    <Link className="brand" to="/" aria-label="SyncoraXP home">
      <span className="brand-logo" aria-hidden="true">
        <img src="/SyncoraXP_Logo.png" alt="" />
      </span>
      <span>SyncoraXP</span>
    </Link>
  );
}
