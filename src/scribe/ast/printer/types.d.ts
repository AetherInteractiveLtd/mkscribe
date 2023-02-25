import { ExpressionVisitor, StatementVisitor } from "../types";

export type PrinterAsVisitor = StatementVisitor<string> & ExpressionVisitor<string>;
