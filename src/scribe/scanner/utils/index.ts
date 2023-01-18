import { KeywordsType, TokensSymbols } from "./types";

export enum TokenType {
	// Grouping or enclosing
	L_P = "Left_Parenthesis",
	R_P = "Right_Parenthesis",

	L_B = "Left_Brace", // {
	R_B = "Right_Brace", // }

	L_BK = "Left_Bracket", // [ (for arrays)
	R_BK = "Right_Bracket", // ] (for arrays)

	// Single character tokens (operators, etc)
	MINUS = "Minus",
	PLUS = "Plus",
	SLASH = "Slash",
	STAR = "Star",

	HASH = "Hash", // # (for comments)
	COMMA = "Comma", // , (for detailing multiple items, mostly for arrays and matches)

	EQUAL = "Equal",
	GREATER = "Greater",
	LESS = "Less",

	// Two character tokens
	E_E = "Equal_Equal",
	G_E = "Greater_Equal",
	L_E = "Less_Equal",

	// Literals supported
	ID = "Identifier", // anything that Scribe doesn't detect as a lexem being part of the language
	STR = "String",
	NUM = "Number",

	// Keywords
	AND = "And",
	OR = "Or",
	NOT = "Not",
	IF = "If",
	TRUE = "True",
	FALSE = "False",
	OBJECTIVE = "Objective",
	SCORE = "Score",
	INTERACT = "Interact",
	SCENE = "Scene",
	WITH = "With",
	OPTION = "Option",
	OTHERWISE = "Otherwise",
	ACTOR = "actor",
	PROPERTY = "Property",
	START = "Start",
	EXIT = "Exit",

	EOF = "End_of_file", // this is kinda necessary at the moment to tell the tokenizer when the end has been reached
}

export const Keywords: KeywordsType = {
	and: TokenType.AND,
	or: TokenType.OR,
	not: TokenType.NOT,
	if: TokenType.IF,
	true: TokenType.TRUE,
	false: TokenType.FALSE,
	objective: TokenType.OBJECTIVE,
	score: TokenType.SCORE,
	interact: TokenType.INTERACT,
	scene: TokenType.SCENE,
	option: TokenType.OPTION,
	otherwise: TokenType.OTHERWISE,
	actor: TokenType.ACTOR,
	property: TokenType.PROPERTY,
	start: TokenType.START,
	exit: TokenType.EXIT,
	with: TokenType.WITH,
};

export const Symbols: TokensSymbols = {
	"(": TokenType.L_P,
	")": TokenType.R_P,
	"{": TokenType.L_B,
	"}": TokenType.R_B,
	"[": TokenType.L_BK,
	"]": TokenType.R_BK,
	"-": TokenType.MINUS,
	"+": TokenType.PLUS,
	"/": TokenType.SLASH,
	"*": TokenType.STAR,
	",": TokenType.COMMA,
};

/**
 * Returns the character at the n position from the string given.
 *
 * @param str a string.
 * @param n the position of the desired character.
 */
export function charAt(str: string, n: number): string {
	return string.sub(str, n, n);
}

/**
 * Returns the code at a certain n from a string (mostly a character).
 *
 * @param char a character (string)
 * @returns a number, the code value of the character given.
 */
export function charCodeAt(char: string, n?: number): number {
	return string.byte(char, char.size())[n !== undefined ? n : 0];
}
