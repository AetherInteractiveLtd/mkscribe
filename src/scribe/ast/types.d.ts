import { ExpressionType, StatementType } from ".";
import { LiteralType, Token, TokenLiteral } from "../scanner/types";

/** Expressions */

interface BinaryExpression extends Expression {
	/**
	 * left (operator) right
	 *
	 * operators: [+, *, -, /, >, <, >=, <=, ==]
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

interface EnviromentAccessor extends Expression {
	/**
	 * $VARIABLE (accessing)
	 */
	name: Token;
}

interface LiteralExpression extends Expression {
	/**
	 * VALUE
	 */
	value: TokenLiteral;
	dataType: LiteralType;
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

export interface Expressions {
	BinaryExpression: BinaryExpression;
	UnaryExpression: UnaryExpression;
	TernaryExpression: TernaryExpression;
	VariableExpression: VariableExpression;
	EnviromentAccessor: EnviromentAccessor;
	LiteralExpression: LiteralExpression;
	GroupingExpression: GroupingExpression;
	ArrayExpression: ArrayExpression;
	MetadataExpression: MetadataExpression;
	StartExpression: StartExpression;
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
	visitEnviromentAccessor(expr: EnviromentAccessor): R;
	visitLiteralExpression(expr: LiteralExpression): R;
	visitGroupingExpression(expr: GroupingExpression): R;
	visitMetadataExpression(expr: MetadataExpression): R;
	visitStartExpression(expr: StartExpression): R;
}

/** Statements */

interface ExpressionStatement extends Statement {
	/**
	 * Whatever an expression may be
	 */
	expr: Expression;
}

interface PropertyStatement extends Statement {
	/**
	 * property name (metadata_optional) "Property value"
	 */
	name: Token;
	value: Expression;
}

interface ActorStatement extends Statement {
	/**
	 * actor IDENTIFIER
	 */
	name: Token;
}

interface DialogueStatement extends Statement {
	/**
	 * [IDENTIFIER] "Dialogue" (metadata_optional) with { ...options }
	 */
	actor: Token;
	text: Expression;
	metadata: Expression | undefined;
	options: Statement | undefined;
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
}

export interface Statements {
	ExpressionStatement: ExpressionStatement;
	PropertyStatement: PropertyStatement;
	ActorStatement: ActorStatement;
	StoreStatement: StoreStatement;
	ObjectiveStatement: ObjectiveStatement;
	SetStatement: SetStatement;
	BlockStatement: BlockStatement;
	BlockOfConditionsStatement: BlockOfConditionsStatement;
	DialogueStatement: DialogueStatement;
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
	visitPropertyStatement(stmt: ExpressionStatement): R;
	visitActorStatement(stmt: ActorStatement): R;
	visitObjectiveStatement(stmt: ObjectiveStatement): R;
	visitStoreStatement(stmt: StoreStatement): R;
	visitSetStatement(stmt: SetStatement): R;
	visitBlockStatement(stmt: BlockStatement): R;
	visitBlockOfConditionsStatement(stmt: BlockOfConditionsStatement): R;
	visitDialogueStatement(stmt: DialogueStatement): R;
	visitConditionStatement(stmt: ConditionStatement): R;
	visitIfStatement(stmt: IfStatement): R;
	visitSceneStatement(stmt: SceneStatement): R;
	visitOptionStatement(stmt: OptionStatement): R;
	visitTriggerStatement(stmt: TriggerStatement): R;
}
