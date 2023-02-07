import { TokenType } from ".";

declare type KeywordStrings =
	| "and"
	| "or"
	| "not"
	| "if"
	| "true"
	| "false"
	| "objective"
	| "start"
	| "store"
	| "set"
	| "interact"
	| "scene"
	| "with"
	| "option"
	| "otherwise"
	| "actor"
	| "property"
	| "trigger"
	| "echo"
	| "exit";

export declare type KeywordsType = Record<KeywordStrings, TokenType>;

declare type TokensSymbolsString = "(" | ")" | "{" | "}" | "[" | "]" | "+" | "/" | "*" | "," | ":";

export declare type TokensSymbols = Record<TokensSymbolsString, TokenType>;
