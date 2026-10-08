interface SuccessStateProps {
    title?: string;
    message: string;
}


export default function SuccessState({
    title = "Operación completada",
    message,
}: SuccessStateProps) {
    return (
        <div
            role="status"
            className="
        flex
        gap-3
        rounded-xl
        border
        border-emerald-200
        bg-emerald-50
        p-4
        text-emerald-900
        dark:border-emerald-900/60
        dark:bg-emerald-950/30
        dark:text-emerald-200
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
          bg-emerald-100
          text-emerald-700
          dark:bg-emerald-900/50
          dark:text-emerald-300
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
                    <path d="m8 12 2.5 2.5L16 9" />
                </svg>
            </div>

            <div className="min-w-0">
                <p
                    className="
            text-sm
            font-semibold
          "
                >
                    {title}
                </p>

                <p
                    className="
            mt-1
            text-sm
            leading-5
            text-emerald-700
            dark:text-emerald-300
          "
                >
                    {message}
                </p>
            </div>
        </div>
    );
}