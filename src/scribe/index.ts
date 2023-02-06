import { Statement } from "./ast/types";
import { Parser } from "./parser";
import { ParserImplementation } from "./parser/types";
import Scanner from "./scanner";
import { ScannerImplementation, Token } from "./scanner/types";
import { ScribeMetadata, ScribeRuntimeImplementation } from "./types";

export class ScribeRuntime implements ScribeRuntimeImplementation {
	private readonly scanner: ScannerImplementation;
	private readonly tokens: Array<Token>;

	private readonly parser: ParserImplementation;
	private readonly ast: Array<Statement>;

	constructor(private readonly source: string, private readonly metadata?: ScribeMetadata) {
		this.scanner = new Scanner(source);
		this.tokens = this.scanner.scanTokens();

		this.parser = new Parser(this.tokens);
		this.ast = this.parser.parse();
	}

	public getTokens(): Array<Token> {
		return this.tokens;
	}

	public getAst(): Array<Statement> {
		return this.ast;
	}
}
