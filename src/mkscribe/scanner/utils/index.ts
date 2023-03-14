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
	EXPONENTIAL = "Exponential",
	MODULUS = "Modulus",

	HASH = "Hash", // # (for comments)
	COMMA = "Comma", // , (for detailing multiple items, mostly for arrays and matches)

	EQUAL = "Equal",
	GREATER = "Greater",
	LESS = "Less",

	// Two character tokens
	E_E = "Equal_Equal",
	G_E = "Greater_Equal",
	L_E = "Less_Equal",

	CONTINUE = "Continue",
	COLON = "Colon",

	// Literals supported
	IDENTIFIER = "Identifier",
	SECONDS = "Seconds",
	STRING = "String",
	NUMBER = "Number",

	// Keywords
	DEFAULT = "Default",
	DO = "Do",
	AND = "And",
	OR = "Or",
	NOT = "Not",
	IF = "If",
	ELSE = "Else",
	TRUE = "True",
	FALSE = "False",
	OBJECTIVE = "Objective",
	START = "Start",
	STORE = "Score",
	SET = "Set",
	INTERACT = "Interact",
	SCENE = "Scene",
	WITH = "With",
	OPTION = "Option",
	OTHERWISE = "Otherwise",
	ACTOR = "actor",
	PROPERTY = "Property",
	TRIGGER = "Trigger",
	ECHO = "Echo",
	EXIT = "Exit",

	// Special characters
	ENV = "EnviromentAccessor",

	EOF = "End_of_file", // this is kinda necessary at the moment to tell the tokenizer when the end has been reached
}

export const Keywords = {
	default: TokenType.DEFAULT,
	do: TokenType.DO,
	and: TokenType.AND,
	or: TokenType.OR,
	not: TokenType.NOT,
	if: TokenType.IF,
	else: TokenType.ELSE,
	true: TokenType.TRUE,
	false: TokenType.FALSE,
	objective: TokenType.OBJECTIVE,
	start: TokenType.START,
	store: TokenType.STORE,
	set: TokenType.SET,
	interact: TokenType.INTERACT,
	scene: TokenType.SCENE,
	with: TokenType.WITH,
	option: TokenType.OPTION,
	otherwise: TokenType.OTHERWISE,
	actor: TokenType.ACTOR,
	property: TokenType.PROPERTY,
	trigger: TokenType.TRIGGER,
	echo: TokenType.ECHO,
	exit: TokenType.EXIT,
};

export const Symbols = {
	"(": TokenType.L_P,
	")": TokenType.R_P,
	"{": TokenType.L_B,
	"}": TokenType.R_B,
	"[": TokenType.L_BK,
	"]": TokenType.R_BK,
	"+": TokenType.PLUS,
	"/": TokenType.SLASH,
	"*": TokenType.STAR,
	"^": TokenType.EXPONENTIAL,
	"%": TokenType.MODULUS,
	",": TokenType.COMMA,
	":": TokenType.COLON,
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
