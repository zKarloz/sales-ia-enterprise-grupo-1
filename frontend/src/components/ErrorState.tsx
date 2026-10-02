interface ErrorStateProps {
  message?: string;
}

export default function ErrorState({
  message = "No se pudo obtener la información.",
}: ErrorStateProps) {
  return (
    <div className="state-message state-message--error">
      <span className="state-message__label">Error</span>
      <p>{message}</p>
    </div>
  );
}
