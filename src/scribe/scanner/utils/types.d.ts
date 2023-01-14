import { TokenType } from ".";

declare type KeywordStrings =
	| "and"
	| "or"
	| "not"
	| "if"
	| "else"
	| "true"
	| "false"
	| "objective"
	| "score"
	| "interact"
	| "scene"
	| "choice"
	| "option"
	| "otherwise"
	| "actor"
	| "property"
	| "start"
	| "exit";

export declare type KeywordsType = Record<KeywordStrings, TokenType>;

declare type TokensSymbolsString = "(" | ")" | "{" | "}" | "[" | "]" | "-" | "+" | "/" | "*" | ",";

export declare type TokensSymbols = Record<TokensSymbolsString, TokenType>;
