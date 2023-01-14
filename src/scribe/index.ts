import Scanner from "./scanner";
import { ScannerImplementation, Token } from "./scanner/types";
import { ScribeMetadata, ScribeRuntimeImplementation } from "./types";

export class ScribeRuntime implements ScribeRuntimeImplementation {
	private readonly scanner: ScannerImplementation;
	private readonly tokens: Array<Token>;

	constructor(private readonly source: string, private readonly metadata?: ScribeMetadata) {
		this.scanner = new Scanner(source);
		this.tokens = this.scanner.scanTokens();
	}

	public getTokens(): Array<Token> {
		return this.tokens;
	}
}
