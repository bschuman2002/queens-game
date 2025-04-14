export type SquareState = "empty" | "x" | "queen" | null;
export type RegionColor =
  | "purple"
  | "blue"
  | "green"
  | "yellow"
  | "orange"
  | "red"
  | "gray"
  | "brown"
  | "teal"
  | "pink"
  | "indigo"
  | "lime"
  | "cyan"
  | "rose"
  | "emerald"
  | "amber"
  | "unassigned";

export interface Square {
  row: number;
  col: number;
  region: string;
}

export interface ChessboardProps {
  size?: number;
  onSizeChange?: (size: number) => void;
}

export interface ConflictInfo {
  type: "row" | "column" | "region" | "adjacent";
  positions: number[];
}
