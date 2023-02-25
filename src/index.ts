import Builder from "./mkscribe";
import { Statement } from "./mkscribe/ast/types";

export namespace MkScribe {
	export function build(source: string): Array<Statement> {
		const tokens = Builder.tokenize(source);

		return Builder.parse(tokens);
	}

	export function bytecode(ast: Array<Statement>): void {
		return Builder.bytecode(ast);
	}

	export function builder(): typeof Builder {
		return Builder;
	}
}

export { TokenType } from "./mkscribe/scanner/utils";
export { Token, TokenLiteralType } from "./mkscribe/scanner/types";

export { ExpressionType, StatementType } from "./mkscribe/ast";
export {
	Statements,
	Statement,
	StatementVisitor,
	Expression,
	Expressions,
	ExpressionVisitor,
} from "./mkscribe/ast/types";
