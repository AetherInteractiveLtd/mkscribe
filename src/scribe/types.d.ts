import { Statement } from "./ast/types";
import { Token } from "./scanner/types";

export interface ScribeRuntimeImplementation {
	tokenize(): ScribeRuntimeImplementation;
	parse(): ScribeRuntimeImplementation;

	getTokens(): Array<Token>;
	getAst(): Array<Statement>;
}
