import { TokenType } from "./utils";

export declare type TokenLiteral = string | number | boolean | undefined | Array<unknown>;
export declare type TokenLiteralType = "string" | "boolean" | "number" | "seconds" | "undefined";

export declare type Token = {
	type: TokenType;
	lexeme: string | undefined;
	literal: TokenLiteral;
	literalType: TokenLiteralType;

	/**
	 * Debugging purposes
	 */
	line: number;
	start: number;
	end: number;
};

export interface TokenizerImplementation {
	/**
	 * Scans all tokens within the source string provided.
	 */
	scan(): Array<Token>;

	/**
	 * Returns whether it's a digit (number) or not
	 */
	isDigit(char: string): boolean;

	/**
	 * Checks if it's an alpha character
	 */
	isAlpha(char: string): boolean;

	/**
	 * Checks if it's an alphanumeric character, mostly used for detecting strings and consuming them.
	 */
	isAlphaNumeric(char: string): boolean;
}
