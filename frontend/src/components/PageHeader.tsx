interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function PageHeader({
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>

        {description && <p>{description}</p>}
      </div>

      {action && <div className="page-header__action">{action}</div>}
    </div>
  );
}