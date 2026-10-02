interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Card({
  title,
  subtitle,
  children,
  className = "",
}: CardProps) {
  return (
    <article className={`ui-card ${className}`}>
      {(title || subtitle) && (
        <header className="ui-card__header">
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
          </div>
        </header>
      )}

      <div className="ui-card__content">{children}</div>
    </article>
  );
}