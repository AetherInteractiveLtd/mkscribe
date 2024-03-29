import { Expressions, ExpressionVisitor, Statements, StatementVisitor } from "./types";

export enum ExpressionType {
	BINARY = "BinaryExpression",
	UNARY = "UnaryExpression",
	TERNARY = "TernaryExpression",
	VARIABLE = "VariableExpression",
	ENV = "EnvironmentAccessor",
	LITERAL = "LiteralExpression",
	GROUPING = "GroupingExpression",
	ARRAY = "ArrayExpression",
	METADATA = "MetadataExpression",
	START = "StartExpression",
	MACRO = "MacroExpression",
	EXIT = "ExitExpression",
}

export enum StatementType {
	EXPRESSION_STATEMENT = "ExpressionStatement",
	PROPERTY = "PropertyStatement",
	ACTOR = "ActorStatement",
	STORE = "StoreStatement",
	OBJECTIVE = "ObjectiveStatement",
	SET = "SetStatement",
	BLOCK = "BlockStatement",
	DO = "DoStatement",
	DIALOGUE = "DialogueStatement",
	CONDITION = "ConditionStatement",
	OTHERWISE = "OtherwiseStatement",
	IF = "IfStatement",
	SCENE = "SceneStatement",
	OPTION = "OptionStatement",
	TRIGGER = "TriggerStatement",
	INTERACT = "InteractStatement",
}

/**
 * Constructs a new expression object that may be used to resolve such node.
 *
 * @param exprType the type of Expression it may construct.
 * @param fields the fields required for such expression.
 *
 * @returns the built expression.
 */
export function newExpression<T extends ExpressionType>(
	exprType: T,
	fields: Omit<Expressions[T], "accept" | "type">,
): Expressions[T] {
	return {
		type: exprType,

		/**
		 * Accepts the expression, and resolves it by visiting the required node depending on it's
		 * type.
		 *
		 * @param visitor the visitor (the resolver for the different expressions)
		 */
		accept<R>(visitor: ExpressionVisitor<R>): R {
			return visitor[`visit${exprType}` as keyof ExpressionVisitor<R>](this as never);
		},

		...fields,
	} as never;
}

/**
 * Constructs a new statement object that may be used to resolve such node.
 *
 * @param stmtType the type of Statement it may construct.
 * @param fields the fields required for such statement.
 *
 * @returns the built statement.
 */
export function newStatement<T extends StatementType>(
	stmtType: T,
	fields: Omit<Statements[T], "accept" | "type">,
): Statements[T] {
	return {
		type: stmtType,

		/**
		 * Accepts the statement, and resolves it by visiting the required node depending on it's
		 * type.
		 *
		 * @param visitor the visitor (the resolver for the different statements)
		 */
		accept<R>(visitor: StatementVisitor<R>): R {
			return visitor[`visit${stmtType}` as keyof StatementVisitor<R>](this);
		},

		...fields,
	} as never;
}
