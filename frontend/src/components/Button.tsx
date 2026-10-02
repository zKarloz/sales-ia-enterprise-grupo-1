interface ButtonProps {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  onClick?: () => void;
}

export default function Button({
  children,
  type = "button",
  variant = "primary",
  disabled = false,
  onClick,
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`ui-button ui-button--${variant}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}