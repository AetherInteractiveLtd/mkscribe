import { Statement } from "./ast/types";
import { Parser } from "./parser";
import Scanner from "./scanner";
import { ScannerImplementation, Token } from "./scanner/types";
import { ScribeRuntimeImplementation } from "./types";

export class ScribeBuilder implements ScribeRuntimeImplementation {
	private readonly scanner: ScannerImplementation;

	private tokens!: Array<Token>;
	private ast!: Array<Statement>;

	constructor(private readonly source: string) {
		this.scanner = new Scanner(source);
	}

	public tokenize(): ScribeRuntimeImplementation {
		this.tokens = this.scanner.scanTokens();

		return this;
	}

	public parse(): ScribeRuntimeImplementation {
		const parser = new Parser(this.tokens);
		this.ast = parser.parse();

		return this;
	}

	public getTokens(): Array<Token> {
		return this.tokens;
	}

	public getAst(): Array<Statement> {
		return this.ast;
	}
}
