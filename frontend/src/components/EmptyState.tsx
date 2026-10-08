interface EmptyStateProps {
  title?: string;
  message?: string;
}


export default function EmptyState({
  title = "Sin información",
  message = "No hay registros para mostrar.",
}: EmptyStateProps) {
  return (
    <div
      className="
        flex
        min-h-48
        items-center
        justify-center
        rounded-xl
        border
        border-dashed
        border-slate-300
        bg-slate-50/50
        px-6
        py-10
        text-center
        dark:border-slate-700
        dark:bg-slate-950/30
      "
    >
      <div className="max-w-sm">
        <div
          className="
            mx-auto
            grid
            h-11
            w-11
            place-items-center
            rounded-xl
            bg-slate-100
            text-slate-500
            dark:bg-slate-800
            dark:text-slate-400
          "
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M4 7h16v12H4z" />
            <path d="M8 4h8M8 11h8M8 15h5" />
          </svg>
        </div>

        <p
          className="
            mt-4
            text-[11px]
            font-bold
            uppercase
            tracking-[0.14em]
            text-slate-400
            dark:text-slate-500
          "
        >
          Sin registros
        </p>

        <h3
          className="
            mt-1
            text-base
            font-bold
            text-slate-900
            dark:text-slate-100
          "
        >
          {title}
        </h3>

        <p
          className="
            mt-2
            text-sm
            leading-6
            text-slate-500
            dark:text-slate-400
          "
        >
          {message}
        </p>
      </div>
    </div>
  );
}