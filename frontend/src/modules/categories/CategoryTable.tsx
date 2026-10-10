import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";

import type {
    Category,
} from "../../types/category";

interface CategoryTableProps {
    categories: Category[];
    onEdit: (category: Category) => void;
    onDelete: (
        category: Category,
    ) => void | Promise<void>;
}

export default function CategoryTable({
    categories,
    onEdit,
    onDelete,
}: CategoryTableProps) {
    if (categories.length === 0) {
        return (
            <EmptyState
                title="No se encontraron categorías"
                message="No existen categorías que coincidan con la búsqueda."
            />
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950/70">
                        <tr>
                            {[
                                "ID",
                                "Categoría",
                                "Descripción",
                                "Acciones",
                            ].map((label) => (
                                <th
                                    key={label}
                                    className={`
                    px-4 py-3.5 text-[11px] font-bold uppercase
                    tracking-[0.08em] text-slate-500 dark:text-slate-400
                    ${label === "Acciones" ? "text-right" : ""}
                  `}
                                >
                                    {label}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                        {categories.map((category) => (
                            <tr
                                key={category.id}
                                className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                            >
                                <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
                                    #{category.id}
                                </td>

                                <td className="px-4 py-4">
                                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                                        {category.name}
                                    </p>
                                </td>

                                <td className="max-w-[420px] px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                                    {category.description ?? "Sin descripción"}
                                </td>

                                <td className="px-4 py-4">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="secondary"
                                            onClick={() => onEdit(category)}
                                        >
                                            Editar
                                        </Button>

                                        <Button
                                            variant="danger"
                                            onClick={() => onDelete(category)}
                                        >
                                            Eliminar
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
