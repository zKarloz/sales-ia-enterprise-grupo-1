type Status = "active" | "inactive" | "pending" | "error";

interface StatusBadgeProps {
  status: Status;
  label?: string;
}

const defaultLabels: Record<Status, string> = {
  active: "Activo",
  inactive: "Inactivo",
  pending: "Pendiente",
  error: "Error",
};

export default function StatusBadge({
  status,
  label,
}: StatusBadgeProps) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      {label ?? defaultLabels[status]}
    </span>
  );
}