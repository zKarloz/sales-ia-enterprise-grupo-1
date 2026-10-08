type Status =
  | "active"
  | "inactive"
  | "pending"
  | "error";


interface StatusBadgeProps {
  status: Status;
  label?: string;
}


const defaultLabels: Record<
  Status,
  string
> = {
  active: "Activo",
  inactive: "Inactivo",
  pending: "Pendiente",
  error: "Error",
};


const statusClasses: Record<
  Status,
  string
> = {
  active: `
    border-emerald-200
    bg-emerald-50
    text-emerald-700
    dark:border-emerald-800
    dark:bg-emerald-950/40
    dark:text-emerald-300
  `,

  inactive: `
    border-slate-200
    bg-slate-100
    text-slate-600
    dark:border-slate-700
    dark:bg-slate-800
    dark:text-slate-300
  `,

  pending: `
    border-amber-200
    bg-amber-50
    text-amber-700
    dark:border-amber-800
    dark:bg-amber-950/40
    dark:text-amber-300
  `,

  error: `
    border-red-200
    bg-red-50
    text-red-700
    dark:border-red-800
    dark:bg-red-950/40
    dark:text-red-300
  `,
};


export default function StatusBadge({
  status,
  label,
}: StatusBadgeProps) {
  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        border
        px-2.5
        py-1
        text-xs
        font-semibold
        ${statusClasses[status]}
      `}
    >
      <span
        className="
          mr-1.5
          h-1.5
          w-1.5
          rounded-full
          bg-current
          opacity-70
        "
      />

      {label ??
        defaultLabels[status]}
    </span>
  );
}