import { ExpressionType, StatementType } from ".";
import { TokenLiteralType, Token, TokenLiteral } from "../scanner/types";

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

interface EnvironmentAccessor extends Expression {
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
	dataType: TokenLiteralType;
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
	 * exit ...
	 */
	value: Expression | undefined;
}

export interface Expressions {
	BinaryExpression: BinaryExpression;
	UnaryExpression: UnaryExpression;
	TernaryExpression: TernaryExpression;
	VariableExpression: VariableExpression;
	EnvironmentAccessor: EnvironmentAccessor;
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
	visitEnvironmentAccessor(expr: EnvironmentAccessor): R;
	visitLiteralExpression(expr: LiteralExpression): R;
	visitGroupingExpression(expr: GroupingExpression): R;
	visitArrayExpression(expr: ArrayExpression): R;
	visitMetadataExpression(expr: MetadataExpression): R;
	visitStartExpression(expr: StartExpression): R;
	visitExitExpression(expr: ExitExpression): R;
}

interface ExpressionStatement extends Statement {
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
	value: Expression;
}

interface DialogueStatement extends Statement {
	/**
	 * [IDENTIFIER] "Dialogue" (metadata_optional) with { ...options }
	 */
	actor: Token;
	text: Expression;
	metadata: Expression | undefined;
	body: Statement | undefined;
	options: Array<Statement>;
}

interface StoreStatement extends Statement {
	/**
	 * store name ID (metadata_optional) "Optional value!"
	 */
	name: Token;
	identifier: Token;
	metadata: Expression | undefined;
	value: Expression | undefined;
}

interface ObjectiveStatement extends Statement {
	/**
	 * objective NAME "Value!"
	 */
	name: Token;
	default: boolean | undefined;
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

interface DoStatement extends Statement {
	/**
	 * do {
	 * 	...body
	 * }
	 */
	body: Statement;
}

interface ConditionStatement extends Statement {
	/**
	 * condition -> {
	 * 	...body
	 * }
	 */
	condition: Expression;
	body: Statement;
}

interface OtherwiseStatement extends Statement {
	/**
	 * otherwise -> {
	 * 	...body
	 * }
	 */
	body: Statement;
}

interface IfStatement extends Statement {
	/**
	 * if condition -> {
	 * 	...body (either a nested if or whatever you may want to have here)
	 * }
	 *
	 * if condition -> {
	 * 	...body
	 * } else {
	 * 	...body
	 * }
	 *
	 * if {
	 * 	condition -> {
	 * 		...body
	 * 	}
	 *
	 * 	otherwise -> { // Optional otherwise (behaves as an else)
	 * 		...body
	 * 	}
	 * }
	 */
	condition: Expression | undefined;
	else?: Statement;
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

interface InteractStatement extends Statement {
	/**
	 * interact BENOIT {
	 * 	...body
	 * }
	 */
	identifier: Token;
	body: Statement;
}

interface EchoStatement extends Statement {
	/**
	 * echo ...
	 */
	expr: Expression;
}

export interface Statements {
	ExpressionStatement: ExpressionStatement;
	PropertyStatement: PropertyStatement;
	ActorStatement: ActorStatement;
	StoreStatement: StoreStatement;
	ObjectiveStatement: ObjectiveStatement;
	SetStatement: SetStatement;
	BlockStatement: BlockStatement;
	DoStatement: DoStatement;
	DialogueStatement: DialogueStatement;
	ConditionStatement: ConditionStatement;
	OtherwiseStatement: OtherwiseStatement;
	IfStatement: IfStatement;
	SceneStatement: SceneStatement;
	OptionStatement: OptionStatement;
	TriggerStatement: TriggerStatement;
	InteractStatement: InteractStatement;
	EchoStatement: EchoStatement;
}

export interface Statement {
	type: StatementType;
	accept<R>(visitor: StatementVisitor<R>): R;
}

export interface StatementVisitor<R> {
	visitExpressionStatement(stmt: ExpressionStatement): R;
	visitPropertyStatement(stmt: PropertyStatement): R;
	visitActorStatement(stmt: ActorStatement): R;
	visitObjectiveStatement(stmt: ObjectiveStatement): R;
	visitStoreStatement(stmt: StoreStatement): R;
	visitSetStatement(stmt: SetStatement): R;
	visitBlockStatement(stmt: BlockStatement): R;
	visitDoStatement(stmt: DoStatement): R;
	visitDialogueStatement(stmt: DialogueStatement): R;
	visitIfStatement(stmt: IfStatement): R;
	visitSceneStatement(stmt: SceneStatement): R;
	visitOptionStatement(stmt: OptionStatement): R;
	visitTriggerStatement(stmt: TriggerStatement): R;
	visitInteractStatement(stmt: InteractStatement): R;
	visitEchoStatement(stmt: EchoStatement): R;
}
