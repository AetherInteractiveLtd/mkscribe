import { ExpressionType, StatementType } from ".";
import { LiteralType, Token, TokenLiteral } from "../scanner/types";

/** Expressions */

interface BinaryExpression extends Expression {
	/**
	 * left (operator) right
	 *
	 * operators: [+, *, -, /]
	 */
	left: Expression;
	operator: Token;
	right: Expression;
}

interface UnaryExpression extends Omit<BinaryExpression, "left"> {}

interface TernaryExpression extends Expression {
	/**
	 * condition -> ifTrue : ifFalse
	 */
	condition: Expression;
	ifTrue: Expression;
	ifFalse: Expression;
}

interface VariableExpression extends Expression {
	/**
	 * VARIABLE (accessing)
	 */
	name: Token;
}

interface LogicalExpression extends BinaryExpression {
	/**
	 * left (operator) right
	 *
	 * operators: [>, <, >=, <=, ==]
	 */
}

interface LiteralExpression extends Expression {
	/**
	 * VALUE
	 */
	value: TokenLiteral;
	literalType: LiteralType;
}

interface GroupingExpression extends Expression {
	/**
	 * (...)
	 */
	expr: Expression;
}

interface ArrayExpression extends Expression {
	/**
	 * [..., ..., ...]
	 *
	 * comma is optional: [..., ..., ... ... ...]
	 */
	expressions: Array<Expression>;
}

interface StartExpression extends Expression {
	/**
	 * start OBJECTIVE
	 */
	objective: Token;
}

interface MetadataExpression extends Expression {
	/** (..., ..., ...)
	 *
	 * comma is optional: (... ... ..., ... ...,)
	 */
	args: Array<Expression>;
}

interface ExitExpression extends Expression {
	/**
	 * Can be any expression, an array or whatever.
	 */
	data?: Expression | undefined;
}

export interface Expressions {
	BinaryExpression: BinaryExpression;
	UnaryExpression: UnaryExpression;
	TernaryExpression: TernaryExpression;
	VariableExpression: VariableExpression;
	LogicalExpression: LogicalExpression;
	LiteralExpression: LiteralExpression;
	GroupingExpression: GroupingExpression;
	ArrayExpression: ArrayExpression;
	MetadataExpression: MetadataExpression;
	StartExpression: StartExpression;
	ExitExpression: ExitExpression;
}

export interface Expression {
	type: ExpressionType;
	accept<R>(visitor: ExpressionVisitor<R>): R;
}

export interface ExpressionVisitor<R> {
	visitBinaryExpression(expr: BinaryExpression): R;
	visitUnaryExpression(expr: UnaryExpression): R;
	visitTernaryExpression(expr: TernaryExpression): R;
	visitVariableExpression(expr: VariableExpression): R;
	visitLogicalExpression(expr: LogicalExpression): R;
	visitLiteralExpression(expr: LiteralExpression): R;
	visitGroupingExpression(expr: GroupingExpression): R;
	visitMetadataExpression(expr: MetadataExpression): R;
	visitArrayExpression(expr: ArrayExpression): R;
	visitStartExpression(expr: StartExpression): R;
}

/** Statements */

interface ExpressionStatement extends Statement {
	/**
	 * Whatever an expression may be
	 */
	expr: Expression;
}

interface StoreStatement extends Statement {
	/**
	 * store NAME (metadata_optional) "Optional value!"
	 */
	name: Token;
	metadata: Expression | undefined;
	value: Expression | undefined;
}

interface ObjectiveStatement extends Statement {
	/**
	 * objective NAME "Value!"
	 */
	name: Token;
	value: Expression;
}

interface SetStatement extends Statement {
	/**
	 * set NAME "Value"
	 */
	name: Token;
	value: Expression | undefined;
}

interface BlockStatement extends Statement {
	/**
	 * {
	 * 	...statements
	 * }
	 */
	statements: Array<Statement>;
}

interface BlockOfConditionsStatement extends Statement {
	/**
	 * {
	 * 	condition -> {
	 * 		...body
	 * 	}
	 * }
	 */
	conditions: Array<ConditionStatement>;
}

interface ConditionStatement extends Statement {
	/**
	 * condition -> {
	 * 	...body (either a nested condition or whatever)
	 * }
	 */
	condition: Expression;
	body: Statement;
}

interface IfStatement extends Statement {
	/**
	 * if condition -> {
	 * 	...body (either a nested if or whatever you may want to have here)
	 * }
	 *
	 * if {
	 * 	...body (conditions, if not, it will throw an error)
	 * }
	 */
	condition: Expression | undefined;
	body: Statement;
}

interface SceneStatement extends Statement {
	/**
	 * scene SCENE {
	 * 	...body
	 * }
	 */
	name: Token;
	body: Statement;
}

interface OptionStatement extends Statement {
	/**
	 * option "Text!" (optional_data) {
	 * 	...body
	 * }
	 */
	value: Expression | undefined;
	metadata: Expression | undefined;
	body: Statement;
}

interface TriggerStatement extends Statement {
	/**
	 * trigger [VALUE] {
	 * 	...body
	 * }
	 *
	 * trigger VALUE {
	 * 	...body
	 * }
	 */
	values: Expression;
	body: Statement;
	_type: "array" | "single";
}

export interface Statements {
	ExpressionStatement: ExpressionStatement;
	StoreStatement: StoreStatement;
	ObjectiveStatement: ObjectiveStatement;
	SetStatement: SetStatement;
	BlockStatement: BlockStatement;
	BlockOfConditionsStatement: BlockOfConditionsStatement;
	ConditionStatement: ConditionStatement;
	IfStatement: IfStatement;
	SceneStatement: SceneStatement;
	OptionStatement: OptionStatement;
	TriggerStatement: TriggerStatement;
}

export interface Statement {
	type: StatementType;
	accept<R>(visitor: StatementVisitor<R>): R;
}

export interface StatementVisitor<R> {
	visitExpressionStatement(stmt: ExpressionStatement): R;
	visitStoreStatement(stmt: StoreStatement): R;
	visitObjectiveStatement(stmt: ObjectiveStatement): R;
	visitBlockStatement(stmt: BlockStatement): R;
	visitBlockOfConditionsStatement(stmt: BlockOfConditionsStatement): R;
	visitConditionStatement(stmt: ConditionStatement): R;
	visitIfStatement(stmt: IfStatement): R;
	visitSceneStatement(stmt: SceneStatement): R;
	visitSetStatement(stmt: SetStatement): R;
	visitOptionStatement(stmt: OptionStatement): R;
	visitTriggerStatement(stmt: TriggerStatement): R;
}
