interface EmptyStateProps {
  title?: string;
  message?: string;
}

export default function EmptyState({
  title = "Sin información",
  message = "No hay registros para mostrar.",
}: EmptyStateProps) {
  return (
    <div className="state-message">
      <span className="state-message__label">Sin registros</span>
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}
