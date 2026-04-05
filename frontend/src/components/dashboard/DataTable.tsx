import React, { useMemo } from "react";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";

interface DataTableProps {
    data: any[];
    columns: string[];
    dtypes?: Record<string, string>;
}

export const DataTable = React.memo<DataTableProps>(({ data = [], columns = [], dtypes }) => {
    const [sorting, setSorting] = React.useState<SortingState>([]);

    const tableColumns = useMemo(() => {
        if (!columns || !Array.isArray(columns)) return [];
        return columns.map((col) => ({
            accessorKey: col,
            header: col,
        }));
    }, [columns]);

    const table = useReactTable({
        data,
        columns: tableColumns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const isNumericColumn = (col: string) => {
        const type = dtypes?.[col] || "";
        return type.includes("int") || type.includes("float");
    };

    return (
        <div className="w-full space-y-3">
            <div className="border border-white/[0.06] rounded-xl overflow-hidden bg-[#080808]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#0a0a0a] sticky top-0 z-10">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            onClick={header.column.getToggleSortingHandler()}
                                            className={cn(
                                                "px-4 py-3 cursor-pointer hover:bg-white/[0.03] transition-colors border-b border-white/[0.06]",
                                                isNumericColumn(header.id) && "text-right"
                                            )}
                                        >
                                            <div className={cn(
                                                "flex items-center gap-2",
                                                isNumericColumn(header.id) && "justify-end"
                                            )}>
                                                <span className="text-xs font-medium text-white/50 tracking-normal">
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                </span>
                                                <div className="text-white/30">
                                                    {header.column.getIsSorted() === "asc" ? (
                                                        <ChevronUp size={14} className="text-white/70" />
                                                    ) : header.column.getIsSorted() === "desc" ? (
                                                        <ChevronDown size={14} className="text-white/70" />
                                                    ) : (
                                                        <ArrowUpDown size={12} className="opacity-30" />
                                                    )}
                                                </div>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.map((row, rowIndex) => (
                                <tr
                                    key={row.id}
                                    className={cn(
                                        "border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors",
                                        rowIndex % 2 === 1 && "bg-white/[0.01]"
                                    )}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td
                                            key={cell.id}
                                            className={cn(
                                                "px-4 py-3 text-[13px] font-mono text-white/60 whitespace-nowrap",
                                                isNumericColumn(cell.column.id) && "text-right tabular-nums text-white/70"
                                            )}
                                        >
                                            {cell.getValue() === null || cell.getValue() === undefined ? (
                                                <span className="text-white/20 italic">null</span>
                                            ) : (
                                                String(cell.getValue())
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex items-center justify-between text-xs text-white/40 px-1">
                <span>
                    Showing {table.getRowModel().rows.length} of {data.length} rows
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.06] disabled:opacity-20 disabled:pointer-events-none transition-all text-xs font-medium"
                    >
                        <ChevronLeft size={14} /> Prev
                    </button>
                    <button
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.06] disabled:opacity-20 disabled:pointer-events-none transition-all text-xs font-medium"
                    >
                        Next <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
});
