import type { ReactNode } from "react";

export function Button({
  children,
  variant = "primary",
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "text";
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className={`button button--${variant}`}
      type="button"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
