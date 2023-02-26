import { Statement } from "./ast/types";
import { Parser } from "./parser";
import { Tokenizer } from "./scanner";
import { Token } from "./scanner/types";

namespace Builder {
	export function tokenize(source: string): Array<Token> {
		const scanner = new Tokenizer(source);

		return scanner.scan();
	}

	export function parse(tokens: Array<Token>): Array<Statement> {
		const parser = new Parser(tokens);

		return parser.parse();
	}
}

export default Builder;
