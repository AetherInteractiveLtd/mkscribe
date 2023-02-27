import { TokenLiteralType, TokenizerImplementation, Token, TokenLiteral } from "./types";
import { charAt, charCodeAt, Keywords, Symbols, TokenType } from "./utils";
import { KeywordsType, TokensSymbols } from "./utils/types";

export class Tokenizer implements TokenizerImplementation {
	private tokens = new Array<Token>();

	private start = 0;
	private current = 1;
	private line = 1;

	/**
	 * Pre calculated digits/alpha characters codes, small optimisation, but everything counts
	 */
	private static readonly _0 = charCodeAt("0");
	private static readonly _9 = charCodeAt("9");

	private static readonly _a = charCodeAt("a");
	private static readonly _A = charCodeAt("A");
	private static readonly _z = charCodeAt("z");
	private static readonly _Z = charCodeAt("Z");

	private static readonly _under_score = charCodeAt("_");

	constructor(private readonly source: string) {}

	public scan(): Array<Token> {
		while (!this.isEOF()) {
			this.start = this.current;
			this.scanToken();
		}

		this.tokens.push(this.createToken(TokenType.EOF, "", "undefined", undefined, this.start, this.source.size())); // The end of the file has been reached

		return this.tokens;
	}

	/**
	 * Scans for tokens at an individual character at a time.
	 */
	private scanToken(): void {
		const char = this.step();

		switch (char) {
			case "#": {
				while (this.peek() !== "\n" && !this.isEOF()) {
					this.step(); // We consume the whole line so the comment isn't take in consideration.
				}

				break;
			}

			case "-": {
				const tokentype = this.stepIfMatches(">") ? TokenType.CONTINUE : TokenType.MINUS;
				this.addToken(tokentype);

				break;
			}

			case "=": {
				const tokenType = this.stepIfMatches("=") ? TokenType.E_E : TokenType.EQUAL;
				this.addToken(tokenType);

				break;
			}

			case ">": {
				const tokenType = this.stepIfMatches("=") ? TokenType.G_E : TokenType.GREATER;
				this.addToken(tokenType);

				break;
			}

			case "<": {
				const tokenType = this.stepIfMatches("=") ? TokenType.L_E : TokenType.LESS;
				this.addToken(tokenType);

				break;
			}

			/**
			 * Blank spaces and breaking lines
			 */
			case " ": {
				break;
			}

			case "\r": {
				break;
			}

			case "\t": {
				break;
			}

			case "\n": {
				this.line++; // We step over to the next line, helps for the lexical errors.

				break;
			}

			/**
			 * Individual case for strings
			 */
			case '"': {
				this.string('"');

				break;
			}

			case "'": {
				this.string("'");

				break;
			}

			case "$": {
				this.accessor();

				break;
			}

			default: {
				if (this.isDigit(char)) {
					this.number();
				} else if (this.isAlpha(char)) {
					this.identifier();
				} else {
					if (char in Symbols) {
						/**
						 * We consume the token as a symbol we already got.
						 */
						this.addToken(Symbols[char as keyof TokensSymbols]);
					} else {
						warn(`[Scribe:LexicalError]: Unexpected "${char}" on line: ${this.line}`);
					}
				}
			}
		}
	}

	/**
	 * Creates a new token, really just an utility function.
	 *
	 * @param type of TokenType type.
	 * @param literal of TokenLiteral type.
	 * @param lexeme of string type, describing the lexeme it is.
	 * @param start of the lexeme.
	 * @param _end of the lexeme.
	 */
	private createToken(
		tokenType: TokenType,
		literal: TokenLiteral,
		_data_type: TokenLiteralType,
		lexeme: string | undefined,
		start: number,
		_end: number,
	): Token {
		return {
			type: tokenType,
			literal,
			literalType: _data_type,
			lexeme,

			line: this.line,
			start,
			end: _end,
		};
	}

	/**
	 * Pushes a new token (NULL).
	 *
	 * @param tokenType of TokenType type.
	 */
	private addToken(tokenType: TokenType): void;

	/**
	 * Push a new token when it detects one, it can be either an identifier or whatever we have described already.
	 *
	 * @param tokenType of TokenType type.
	 * @param literal of TokenLiteral type.
	 */
	private addToken(tokenType: TokenType, literal: TokenLiteral, literalType: TokenLiteralType): void;

	private addToken(tokenType: unknown, literal?: unknown, literalType?: TokenLiteralType): void {
		const start = this.start;
		const current = this.current - (this.current >= this.source.size() ? 0 : 1);
		const lexeme = this.source.sub(start, current);

		this.tokens.push(
			this.createToken(
				tokenType as TokenType,
				literal as TokenLiteral,
				literalType || "undefined",
				lexeme,
				start,
				current,
			),
		);
	}

	/**
	 * Checks if the scanner reached the EOF (end of the file)
	 */
	private isEOF(): boolean {
		return this.current >= this.source.size();
	}

	public isDigit(char: string): boolean {
		const charCode = charCodeAt(char);
		const evaluation = charCode >= Tokenizer._0 && charCode <= Tokenizer._9;

		return evaluation;
	}

	public isAlpha(char: string): boolean {
		const charCode = charCodeAt(char);
		let evaluation;
		{
			const isaToz = charCode >= Tokenizer._a && charCode <= Tokenizer._z;
			const isAtoZ = charCode >= Tokenizer._A && charCode <= Tokenizer._Z;
			const isUnderscore = charCode === Tokenizer._under_score;

			evaluation = isaToz || isAtoZ || isUnderscore;
		}

		return evaluation;
	}

	public isAlphaNumeric(char: string): boolean {
		return this.isAlpha(char) || this.isDigit(char);
	}

	/**
	 * Advances one character and consumes it, ONLY and ONLY IF it matches whatever we pass to it.
	 */
	private stepIfMatches(charExpected: string): boolean {
		if (this.isEOF() || charAt(this.source, this.current) !== charExpected) {
			return false;
		}

		this.current++; // Consumes character/token

		return true;
	}

	/**
	 * Advances to the next character and consumes it.
	 */
	private step(): string {
		return charAt(this.source, this.current++);
	}

	/**
	 * Looks at the current unconsumed character within a set of lookahead.
	 */
	private peek(nOfLookahead?: number): string {
		nOfLookahead = nOfLookahead !== undefined ? nOfLookahead : 0;

		if (this.isEOF() || this.current + nOfLookahead - 1 >= this.source.size()) {
			return "\0";
		}

		return charAt(this.source, this.current + nOfLookahead);
	}

	/**
	 * Adds a new string literal
	 */
	private string(enclosingChar: string): void {
		let lookAhead = this.peek();

		while (lookAhead !== enclosingChar && !this.isEOF()) {
			if (lookAhead === "\n") {
				this.line++;
			}

			this.step();
			lookAhead = this.peek();
		}

		this.step(); // To consume the closing quotation

		const _string = this.source.sub(this.start + 1, this.current - 2);
		this.addToken(TokenType.STRING, _string, "string");
	}

	/**
	 * The accessor is a special token, its value is retrieved within the enviroment set
	 * when loading Scribe.
	 */
	private accessor(): void {
		while (this.isAlphaNumeric(this.peek())) {
			this.step();
		}

		const identifier = this.source.sub(this.start, this.current - 1);
		this.addToken(TokenType.ENV, identifier, "undefined");
	}

	/**
	 * Adds a new number literal
	 */
	private number(): void {
		let _type: TokenType;
		let _dataType: TokenLiteralType;

		while (this.isDigit(this.peek())) {
			this.step();
		}

		if (this.peek() === "." && this.isDigit(this.peek(1))) {
			this.step();

			while (this.isDigit(this.peek())) {
				this.step();
			}
		}

		if (this.peek() === "s") {
			this.step(); // Consume the 's'

			_type = TokenType.SECONDS;
			_dataType = "seconds";
		} else {
			_type = TokenType.NUMBER;
			_dataType = "number";
		}

		const number = this.source.sub(this.start, this.current - 1);
		this.addToken(_type, number, _dataType);
	}

	/**
	 * Adds a new identifier literal
	 */
	private identifier(): void {
		while (this.isAlphaNumeric(this.peek())) {
			this.step();
		}

		const identifier = this.source.sub(this.start, this.current - 1);

		if (identifier in Keywords) {
			this.addToken(Keywords[identifier as keyof KeywordsType]);
		} else {
			this.addToken(TokenType.IDENTIFIER);
		}
	}
}
