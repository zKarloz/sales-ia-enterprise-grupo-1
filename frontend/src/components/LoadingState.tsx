interface LoadingStateProps {
  message?: string;
}


export default function LoadingState({
  message = "Obteniendo información...",
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="
        flex
        min-h-40
        items-center
        justify-center
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-8
        text-center
        dark:border-slate-800
        dark:bg-slate-900
      "
    >
      <div>
        <div
          className="
            mx-auto
            h-8
            w-8
            animate-spin
            rounded-full
            border-2
            border-slate-200
            border-t-cyan-500
            dark:border-slate-700
            dark:border-t-cyan-400
          "
        />

        <p
          className="
            mt-4
            text-sm
            font-semibold
            text-slate-700
            dark:text-slate-200
          "
        >
          Cargando
        </p>

        <p
          className="
            mt-1
            text-sm
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