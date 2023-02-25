import { Statement } from "../ast/types";

export interface ParserImplementation {
	/**
	 * Parses all the generated tokens, verifying correct grammar and once again
	 * throwing errors within it. Not only because of unexpected characters, but
	 * because of incorrect use of the language. Parsing returns an Array of statements which can be used to
	 * interpret the whole code.
	 *
	 * In the near future this model of execution will change, and rather than walking and executing after it,
	 * it will generate bytecode for a built-in VM.
	 */
	parse(): Array<Statement>;
}
