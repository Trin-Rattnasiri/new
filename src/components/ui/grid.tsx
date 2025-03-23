// components/ui/grid.tsx
import React from "react";

interface GridProps {
  columns: number;
  gap?: string;
  children: React.ReactNode;
}

export const Grid: React.FC<GridProps> = ({ columns, gap = "4", children }) => {
  return (
    <div className={`grid grid-cols-${columns} gap-${gap}`}>
      {children}
    </div>
  );
};
