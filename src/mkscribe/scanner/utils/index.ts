export enum TokenType {
	// Grouping or enclosing
	L_P = "Left_Parenthesis",
	R_P = "Right_Parenthesis",

	L_B = "Left_Brace", // {
	R_B = "Right_Brace", // }

	L_BK = "Left_Bracket", // [ (for arrays)
	R_BK = "Right_Bracket", // ] (for arrays)

	// Single character tokens (operators, etc)
	EXPONENTIAL = "Exponential",
	MINUS = "Minus",
	MODULUS = "Modulus",
	PLUS = "Plus",
	SLASH = "Slash",
	STAR = "Star",

	COMMA = "Comma", // , (for detailing multiple items, mostly for arrays and matches)
	HASH = "Hash", // # (for comments)

	EQUAL = "Equal",
	GREATER = "Greater",
	LESS = "Less",

	// Two character tokens
	E_E = "Equal_Equal",
	G_E = "Greater_Equal",
	L_E = "Less_Equal",

	COLON = "Colon",
	CONTINUE = "Continue",

	// Literals supported
	IDENTIFIER = "Identifier",
	NUMBER = "Number",
	SECONDS = "Seconds",
	STRING = "String",

	// Keywords
	ACTOR = "actor",
	AND = "And",
	DEFAULT = "Default",
	DO = "Do",
	ECHO = "Echo",
	ELSE = "Else",
	EXIT = "Exit",
	FALSE = "False",
	IF = "If",
	INTERACT = "Interact",
	NOT = "Not",
	OPTION = "Option",
	PROPERTY = "Property",
	OBJECTIVE = "Objective",
	OR = "Or",
	OTHERWISE = "Otherwise",
	TRIGGER = "Trigger",
	TRUE = "True",
	SET = "Set",
	SCENE = "Scene",
	START = "Start",
	STORE = "Score",
	UNDEFINED = "Undefined",
	WITH = "With",

	// Special characters
	ENV = "EnviromentAccessor",
	EOF = "EndOfFile",
}

export const Keywords = {
	actor: TokenType.ACTOR,
	and: TokenType.AND,
	default: TokenType.DEFAULT,
	do: TokenType.DO,
	echo: TokenType.ECHO,
	else: TokenType.ELSE,
	exit: TokenType.EXIT,
	false: TokenType.FALSE,
	if: TokenType.IF,
	interact: TokenType.INTERACT,
	not: TokenType.NOT,
	option: TokenType.OPTION,
	property: TokenType.PROPERTY,
	objective: TokenType.OBJECTIVE,
	or: TokenType.OR,
	otherwise: TokenType.OTHERWISE,
	trigger: TokenType.TRIGGER,
	true: TokenType.TRUE,
	set: TokenType.SET,
	scene: TokenType.SCENE,
	start: TokenType.START,
	store: TokenType.STORE,
	undefined: TokenType.UNDEFINED,
	with: TokenType.WITH,
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
