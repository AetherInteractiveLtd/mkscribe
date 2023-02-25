import {
	ArrayExpression,
	BinaryExpression,
	BlockOfConditionsStatement,
	BlockStatement,
	ConditionStatement,
	Expression,
	ExpressionStatement,
	GroupingExpression,
	IfStatement,
	LiteralExpression,
	LogicalExpression,
	MetadataExpression,
	ObjectiveStatement,
	OptionStatement,
	SceneStatement,
	SetStatement,
	StartExpression,
	Statement,
	StoreStatement,
	TernaryExpression,
	TriggerStatement,
	UnaryExpression,
	VariableExpression,
} from "../types";
import { PrinterAsVisitor } from "./types";

export default class Printer implements PrinterAsVisitor {
	public transform(toPrint: Array<Statement | Expression>): string {
		return (toPrint as Array<Statement | Expression>)
			.map((stmt) => (stmt !== undefined ? stmt.accept(this) : "undefined"))
			.join("\n");
	}

	/**
	 * Builds an s-expression format of the expressions passed to it.
	 *
	 * @param name the s-expression name.
	 * @param expressions whatever the values are.
	 * @returns a built s-expression from the ast node (or any expression/statement passed).
	 */
	protected parenthesize(name: string, ...expressions: Array<Expression>): string {
		let result = `(${name}`;

		for (const expr of expressions) {
			result += `${expr.accept(this)}`;
		}

		result += ")";

		return result;
	}

	/**
	 * Corrects indentation.
	 *
	 * @param lines the lines within to indent.
	 */
	protected indent(lines: string): string {
		return lines
			.split(`\n`)
			.map((n) => "   " + n)
			.join("\n");
	}

	/**
	 * (+ left right)
	 */
	public visitBinaryExpression(expr: BinaryExpression): string {
		return this.parenthesize(expr.operator.lexeme!, expr.left, expr.right);
	}

	/**
	 * (- expr)
	 */
	public visitUnaryExpression(expr: UnaryExpression): string {
		return this.parenthesize(expr.operator.lexeme!, expr.right);
	}

	/**
	 * (? cond (ifTrue : ifFalse))
	 */
	public visitTernaryExpression(expr: TernaryExpression): string {
		return `(? ${this.transform([expr.condition])} (${this.transform([expr.ifTrue])} : ${this.transform([
			expr.ifFalse,
		])})`;
	}

	/**
	 * (x)
	 */
	public visitVariableExpression(expr: VariableExpression): string {
		return expr.name.lexeme!;
	}

	/**
	 * (> left right)
	 */
	public visitLogicalExpression(expr: LogicalExpression): string {
		return this.parenthesize(expr.operator.lexeme!, expr.left, expr.right);
	}

	/**
	 * (...)
	 */
	public visitLiteralExpression(expr: LiteralExpression): string {
		if (expr.value === undefined) return expr.literalType;
		if (expr.literalType === "string") return `"${expr.value}"`;

		return `${expr.value}`;
	}

	/**
	 * (group (...))
	 */
	public visitGroupingExpression(expr: GroupingExpression): string {
		return `(group ${this.parenthesize("", expr.expr)})`;
	}

	/**
	 * (array (...elements))
	 */
	public visitArrayExpression(expr: ArrayExpression): string {
		return `(array ${this.parenthesize("", ...expr.expressions)})`;
	}

	/**
	 * (metadata (...metadata))
	 */
	public visitMetadataExpression(expr: MetadataExpression): string {
		return `(metadata ${this.parenthesize("", ...expr.args)})`;
	}

	/**
	 * (start objective_name)
	 */
	public visitStartExpression(expr: StartExpression): string {
		return `(start ${expr.objective.lexeme})`;
	}

	/**
	 * (expression (...))
	 */
	public visitExpressionStatement(stmt: ExpressionStatement): string {
		return this.parenthesize("expression", stmt.expr);
	}

	/**
	 * (store (store_name store_value))
	 */
	public visitStoreStatement(stmt: StoreStatement): string {
		return `(store (${stmt.name.lexeme} ${stmt.value?.accept(this)}))`;
	}

	/**
	 * (objective (objective_name objective_value))
	 */
	public visitObjectiveStatement(stmt: ObjectiveStatement): string {
		return `(objective (${stmt.name.lexeme} ${stmt.value.accept(this)}))`;
	}

	/**
	 * (set (store_name new_value))
	 */
	public visitSetStatement(stmt: SetStatement): string {
		return `(set (${stmt.name.lexeme} ${this.transform([stmt.value!])}))`;
	}

	/**
	 * (block
	 *  (...)
	 * )
	 */
	public visitBlockStatement(stmt: BlockStatement): string {
		let result = `(block`;

		for (const innerStmt of stmt.statements) {
			result += `\n ${this.indent(this.transform([innerStmt]))}`;
		}

		result += `)`;

		return result;
	}

	/**
	 * (cond_block
	 *  (...)
	 * )
	 */
	public visitBlockOfConditionsStatement(stmt: BlockOfConditionsStatement): string {
		let result = `(cond_block`;

		for (const innerStmt of stmt.conditions) {
			result += `\n ${this.indent(this.transform([innerStmt]))}`;
		}

		result += `)`;

		return result;
	}

	/**
	 * (if (...)
	 *  (...)
	 * )
	 */
	public visitIfStatement(stmt: IfStatement): string {
		return `(if (${this.transform([stmt.condition!])})\n (${this.indent(this.transform([stmt.body]))})\n)`;
	}

	/**
	 * (scene scene_name (...))
	 */
	public visitSceneStatement(stmt: SceneStatement): string {
		return `(scene ${stmt.name.lexeme} (${this.indent(this.transform([stmt.body]))})\n)`;
	}

	/**
	 * (option (...metadata, dialogue))
	 */
	public visitOptionStatement(stmt: OptionStatement): string {
		return `(option (${this.transform([stmt.metadata!])}, ${this.transform([stmt.value!])}) (${this.indent(
			this.transform([stmt.body]),
		)})\n)`;
	}

	/**
	 * (trigger (...values)) or (trigger (value))
	 */
	public visitTriggerStatement(stmt: TriggerStatement): string {
		return `(trigger ${this.transform(
			stmt._type === "array" ? (stmt.values as unknown as Array<Expression>) : [stmt.values as Expression],
		)})`;
	}

	/**
	 * (cond (condition) (...))
	 */
	public visitConditionStatement(stmt: ConditionStatement): string {
		return `(cond ${this.parenthesize("", stmt.condition)} (${this.indent(this.transform([stmt.body]))})\n)`;
	}
}
