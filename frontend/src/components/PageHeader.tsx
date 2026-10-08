import type {
  ReactNode,
} from "react";


interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}


export default function PageHeader({
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <header
      className="
        mb-6
        flex
        flex-col
        gap-4
        sm:mb-8
        sm:flex-row
        sm:items-end
        sm:justify-between
      "
    >
      <div className="min-w-0">
        <p
          className="
            mb-1.5
            text-[11px]
            font-bold
            uppercase
            tracking-[0.14em]
            text-cyan-700
            dark:text-cyan-400
          "
        >
          SalesIA Enterprise
        </p>

        <h1
          className="
            text-2xl
            font-bold
            tracking-tight
            text-slate-950
            sm:text-3xl
            dark:text-white
          "
        >
          {title}
        </h1>

        {description && (
          <p
            className="
              mt-2
              max-w-3xl
              text-sm
              leading-6
              text-slate-500
              sm:text-base
              dark:text-slate-400
            "
          >
            {description}
          </p>
        )}
      </div>

      {action && (
        <div
          className="
            flex
            shrink-0
            flex-wrap
            items-center
            gap-2
          "
        >
          {action}
        </div>
      )}
    </header>
  );
}