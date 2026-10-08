interface ErrorStateProps {
  message?: string;
}


export default function ErrorState({
  message = "No se pudo obtener la información.",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="
        flex
        gap-3
        rounded-xl
        border
        border-red-200
        bg-red-50
        p-4
        text-red-900
        dark:border-red-900/60
        dark:bg-red-950/30
        dark:text-red-200
      "
    >
      <div
        className="
          grid
          h-8
          w-8
          shrink-0
          place-items-center
          rounded-lg
          bg-red-100
          text-red-700
          dark:bg-red-900/50
          dark:text-red-300
        "
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
          />
          <path d="M12 8v5M12 16h.01" />
        </svg>
      </div>

      <div className="min-w-0">
        <p
          className="
            text-sm
            font-semibold
          "
        >
          Ocurrió un problema
        </p>

        <p
          className="
            mt-1
            text-sm
            leading-5
            text-red-700
            dark:text-red-300
          "
        >
          {message}
        </p>
      </div>
    </div>
  );
}