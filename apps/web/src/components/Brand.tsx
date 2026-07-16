import { Link } from "react-router-dom";

export function Brand() {
  return (
    <Link className="brand" to="/" aria-label="VoiceMeet home">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>VoiceMeet</span>
    </Link>
  );
}
