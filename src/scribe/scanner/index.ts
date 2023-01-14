import { ScannerImplementation, Token, TokenLiteral } from "./types";
import { charAt, charCodeAt, Keywords, Symbols, TokenType } from "./utils";
import { KeywordsType, TokensSymbols } from "./utils/types";

export default class Scanner implements ScannerImplementation {
	private tokens = new Array<Token>();

	private start = 0;
	private current = 1;
	private line = 1;

	/**
	 * Pre calculated digits/alpha characters codes, small optimisation, but everything counts
	 */
	private readonly _0 = charCodeAt("0");
	private readonly _9 = charCodeAt("9");

	private readonly _a = charCodeAt("a");
	private readonly _A = charCodeAt("A");
	private readonly _z = charCodeAt("z");
	private readonly _Z = charCodeAt("Z");

	private readonly _UNDER_SCORE = charCodeAt("_");

	constructor(private readonly source: string) {}

	public scanTokens(): Array<Token> {
		while (!this.isTheEnd()) {
			this.start = this.current;
			this.scanToken();
		}

		this.tokens.push(this.createToken(TokenType.EOF, "", undefined)); // The end of the file has been reached

		return this.tokens;
	}

	/**
	 * Scans for tokens at an individual character at a time.
	 */
	private scanToken(): void {
		const char = this.advance();

		switch (char) {
			case "#": {
				while (this.peek() !== "\n" && !this.isTheEnd()) {
					this.advance(); // We consume the whole line so the comment isn't take in consideration.
				}

				break;
			}

			case "=": {
				const tokenType = this.match("=") ? TokenType.E_E : TokenType.EQUAL;
				this.addToken(tokenType);

				break;
			}

			case ">": {
				const tokenType = this.match("=") ? TokenType.G_E : TokenType.GREATER;
				this.addToken(tokenType);

				break;
			}

			case "<": {
				const tokenType = this.match("=") ? TokenType.L_E : TokenType.LESS;
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
	 */
	private createToken(tokenType: TokenType, literal: TokenLiteral, lexeme: string | undefined): Token {
		return {
			type: tokenType,
			literal,
			lexeme,
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
	private addToken(tokenType: TokenType, literal: TokenLiteral): void;

	private addToken(tokenType: unknown, literal?: unknown): void {
		literal = literal === undefined ? undefined : literal;
		const lexeme = this.source.sub(this.start, this.current - (this.current >= this.source.size() ? 0 : 1));

		this.tokens.push(this.createToken(tokenType as TokenType, literal as TokenLiteral, lexeme));
	}

	/**
	 * Checks if the scanner reached the EOF (end of the file)
	 */
	private isTheEnd(): boolean {
		return this.current >= this.source.size();
	}

	public isDigit(char: string): boolean {
		const charCode = charCodeAt(char);
		const evaluation = charCode >= this._0 && charCode <= this._9;

		return evaluation;
	}

	public isAlpha(char: string): boolean {
		const charCode = charCodeAt(char);
		let evaluation;
		{
			const isaToz = charCode >= this._a && charCode <= this._z;
			const isAtoZ = charCode >= this._A && charCode <= this._Z;
			const isUnderscore = charCode === this._UNDER_SCORE;

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
	private match(charExpected: string): boolean {
		if (this.isTheEnd() || charAt(this.source, this.current) !== charExpected) {
			return false;
		}

		this.current++; // Consumes character/token

		return true;
	}

	/**
	 * Advances to the next character and consumes it.
	 */
	private advance(): string {
		return charAt(this.source, this.current++);
	}

	/**
	 * Looks at the current unconsumed character.
	 */
	private peek(nOfLookahead?: number): string {
		nOfLookahead = nOfLookahead !== undefined ? nOfLookahead : 0;

		if (this.isTheEnd() || this.current + nOfLookahead - 1 >= this.source.size()) {
			return "\0";
		}

		return charAt(this.source, this.current + nOfLookahead);
	}

	/**
	 * Adds a new string literal
	 */
	private string(enclosingChar: string): void {
		let lookAhead = this.peek();

		while (lookAhead !== enclosingChar && !this.isTheEnd()) {
			if (lookAhead === "\n") {
				this.line++;
			}

			this.advance();
			lookAhead = this.peek();
		}

		this.advance(); // To consume the closing quotation

		const str = this.source.sub(this.start + 1, this.current - 2);
		this.addToken(TokenType.STR, str);
	}

	/**
	 * Adds a new number literal
	 */
	private number(): void {
		this.consumeNumber();

		if (this.peek() === "." && this.isDigit(this.peek(1))) {
			this.advance();
			this.consumeNumber();
		}

		const num = tonumber(this.source.sub(this.start, this.current));
		this.addToken(TokenType.NUM, num);
	}

	/**
	 * Helps to consume a whole line while it is a digit
	 */
	private consumeNumber(): void {
		while (this.isDigit(this.peek())) {
			this.advance();
		}
	}

	/**
	 * Adds a new identifier literal
	 */
	private identifier(): void {
		while (this.isAlphaNumeric(this.peek())) {
			this.advance();
		}

		const identifier = this.source.sub(this.start, this.current - 1);

		if (identifier in Keywords) {
			this.addToken(Keywords[identifier as keyof KeywordsType]);
		} else {
			this.addToken(TokenType.ID);
		}
	}
}
