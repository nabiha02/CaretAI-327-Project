import { Link } from "react-router";

function BrandMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.2c-2.8 0-5 2.1-5 4.7 0 1 .3 1.9.8 2.7C5.6 11.3 4 13.3 4 15.8c0 2.8 2.1 5 4.8 5 1.3 0 2.5-.5 3.3-1.4.8.9 2 1.4 3.3 1.4 2.7 0 4.8-2.2 4.8-5 0-2.5-1.6-4.5-3.8-5.2.5-.8.8-1.7.8-2.7 0-2.6-2.3-4.7-5.2-4.7Z" />
      <path d="M12 6.7v9.9M8.7 11.7h6.6" />
    </svg>
  );
}

export function CaretaiBrand() {
  return (
    <Link className="sign-in-brand" to="/" aria-label="CARETAI home">
      <span><BrandMark /></span>
      <span className="sign-in-brand__copy">
        <strong>CARETAI</strong>
        <small>Connected care, clearly told</small>
      </span>
    </Link>
  );
}
