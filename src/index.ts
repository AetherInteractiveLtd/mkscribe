import { ScribeBuilder } from "./scribe";
import { ScribeRuntimeImplementation } from "./scribe/types";

export namespace MkScribe {
	export function load(source: string): ScribeRuntimeImplementation {
		return new ScribeBuilder(source);
	}
}

export { TokenType } from "./scribe/scanner/utils";
export { Token, TokenLiteralType } from "./scribe/scanner/types";

export { ExpressionType, StatementType } from "./scribe/ast";
export {
	Statements,
	Statement,
	StatementVisitor,
	Expression,
	Expressions,
	ExpressionVisitor,
} from "./scribe/ast/types";
