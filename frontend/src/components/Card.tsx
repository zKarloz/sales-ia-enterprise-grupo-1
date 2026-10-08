import type {
  ReactNode,
} from "react";


interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}


export default function Card({
  title,
  subtitle,
  children,
  className = "",
}: CardProps) {
  return (
    <article
      className={`
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-sm
        shadow-slate-950/[0.03]
        transition-colors
        dark:border-slate-800
        dark:bg-slate-900
        dark:shadow-black/10
        ${className}
      `}
    >
      {(title || subtitle) && (
        <header
          className="
            border-b
            border-slate-100
            px-5
            py-4
            sm:px-6
            dark:border-slate-800
          "
        >
          {title && (
            <h2
              className="
                text-base
                font-bold
                text-slate-900
                sm:text-lg
                dark:text-slate-100
              "
            >
              {title}
            </h2>
          )}

          {subtitle && (
            <p
              className="
                mt-1
                text-sm
                leading-6
                text-slate-500
                dark:text-slate-400
              "
            >
              {subtitle}
            </p>
          )}
        </header>
      )}

      <div className="p-5 sm:p-6">
        {children}
      </div>
    </article>
  );
}