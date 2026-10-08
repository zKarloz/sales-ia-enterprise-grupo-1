import type {
  MouseEventHandler,
  ReactNode,
} from "react";


interface ButtonProps {
  children: ReactNode;
  type?:
  | "button"
  | "submit"
  | "reset";
  variant?:
  | "primary"
  | "secondary"
  | "danger";
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}


const variants = {
  primary: `
    bg-slate-950
    text-white
    shadow-sm
    hover:bg-slate-800
    dark:bg-cyan-400
    dark:text-slate-950
    dark:hover:bg-cyan-300
  `,

  secondary: `
    border
    border-slate-200
    bg-white
    text-slate-700
    shadow-sm
    hover:bg-slate-50
    hover:text-slate-950
    dark:border-slate-700
    dark:bg-slate-900
    dark:text-slate-200
    dark:hover:bg-slate-800
    dark:hover:text-white
  `,

  danger: `
    bg-red-600
    text-white
    shadow-sm
    hover:bg-red-700
    dark:bg-red-500
    dark:hover:bg-red-400
  `,
};


export default function Button({
  children,
  type = "button",
  variant = "primary",
  disabled = false,
  onClick,
  className = "",
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`
        inline-flex
        min-h-10
        items-center
        justify-center
        gap-2
        rounded-xl
        px-4
        py-2
        text-sm
        font-semibold
        transition
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-cyan-500
        focus-visible:ring-offset-2
        disabled:pointer-events-none
        disabled:opacity-50
        dark:focus-visible:ring-offset-slate-950
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}