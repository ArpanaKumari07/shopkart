// Shared loading / empty / error states so every page uses the same visual language.
import { IconAlert } from "./Icons";

export function Spinner({ small = false }) {
  return <span className={small ? "spinner spinner-sm" : "spinner"} aria-hidden="true" />;
}

export function LoadingState({ label }) {
  return (
    <div className="state" role="status">
      <Spinner />
      <p className="state-text">{label}</p>
    </div>
  );
}

// skeleton cards for product-style grids, with a visible caption saying what is loading
export function GridSkeleton({ label, count = 8 }) {
  return (
    <div role="status">
      <p className="loading-caption">
        <Spinner small />
        {label}
      </p>
      <div className="products-grid" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <div className="skeleton-card" key={index}>
            <div className="skeleton skeleton-media" />
            <div className="skeleton-body">
              <div className="skeleton skeleton-line skeleton-line-short" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line skeleton-line-medium" />
              <div className="skeleton skeleton-button" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, children, action }) {
  return (
    <div className="state">
      {icon && <div className="state-icon">{icon}</div>}
      <p className="state-title">{title}</p>
      {children && <p className="state-text">{children}</p>}
      {action && <div className="state-actions">{action}</div>}
    </div>
  );
}

// onRetry is only passed where the page already supports retrying
export function ErrorState({ title, message, onRetry }) {
  return (
    <div className="state state-error" role="alert">
      <div className="state-icon">
        <IconAlert />
      </div>
      <p className="state-title">{title}</p>
      {message && <p className="state-text">{message}</p>}
      {onRetry && (
        <div className="state-actions">
          <button className="btn btn-secondary" onClick={onRetry}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
