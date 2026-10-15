import { Link } from "react-router-dom";
import { IconBag } from "./Icons";

// ShopKart wordmark: a link inside the app, plain text on the auth screens
export default function Brand({ to, className = "" }) {
  const content = (
    <>
      <span className="brand-mark">
        <IconBag />
      </span>
      ShopKart
    </>
  );

  if (!to) return <span className={`navbar-brand ${className}`}>{content}</span>;

  return (
    <Link className={`navbar-brand ${className}`} to={to}>
      {content}
    </Link>
  );
}
