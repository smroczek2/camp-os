"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { ReactNode } from "react";

export type ResponsiveTableColumn = {
  header: string;
  accessorKey?: string;
  cell?: (row: unknown) => ReactNode;
  className?: string;
};

export type ResponsiveTableProps<T> = {
  data: T[];
  columns: ResponsiveTableColumn[];
  mobileCardRenderer: (row: T) => ReactNode;
  emptyMessage?: string;
};

export function ResponsiveTable<T extends Record<string, unknown>>({
  data,
  columns,
  mobileCardRenderer,
  emptyMessage = "No data available",
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table (md and up) */}
      <div className="hidden md:block overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column, colIndex) => (
                  <TableCell key={colIndex} className={column.className}>
                    {column.cell
                      ? column.cell(row)
                      : column.accessorKey
                        ? String(row[column.accessorKey] ?? "")
                        : ""}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards (below md) */}
      <div className="md:hidden space-y-4">
        {data.map((row, index) => (
          <Card key={index}>{mobileCardRenderer(row)}</Card>
        ))}
      </div>
    </>
  );
}

// Helper component for mobile card layout
export function MobileCardField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-sm text-muted-foreground font-medium">
        {label}:
      </span>
      <div className="text-sm text-right">{children}</div>
    </div>
  );
}
