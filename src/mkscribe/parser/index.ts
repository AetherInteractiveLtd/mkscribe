import { newExpression, newStatement, ExpressionType, StatementType } from "../ast";
import {
	ArrayExpression,
	BinaryExpression,
	BlockOfConditionsStatement,
	BlockStatement,
	ConditionStatement,
	DialogueStatement,
	EchoStatement,
	EnvironmentAccessor,
	Expression,
	ExpressionStatement,
	GroupingExpression,
	IfStatement,
	InteractStatement,
	LiteralExpression,
	MetadataExpression,
	OptionStatement,
	SceneStatement,
	StartExpression,
	Statement,
	TernaryExpression,
	TriggerStatement,
	UnaryExpression,
	VariableExpression,
} from "../ast/types";
import { Token } from "../scanner/types";
import { TokenType } from "../scanner/utils";
import { ParserImplementation } from "./types";

export class Parser implements ParserImplementation {
	private current = 0;

	constructor(private readonly tokens: Array<Token>) {}

	parse(): Array<Statement> {
		const stmts: Array<Statement> = new Array();

		while (!this.isEOF()) {
			try {
				const declared = this.declare();
				stmts.push(declared);
			} catch (_error) {
				warn(_error);

				this.step();
			}
		}

		return stmts;
	}

	private error(token: Token, message?: string): string {
		return token.type === TokenType.EOF
			? `End of File reached | Line: ${token.line}-`
			: `${message} | [Ln ${token.line}, start ${token.start}, end ${token.end};] | Got '${token.lexeme}'`;
	}

	protected isEOF(): boolean {
		return this.peek().type === TokenType.EOF;
	}

	protected isType(...types: Array<TokenType>): boolean {
		if (this.isEOF()) return false;

		for (const _type of types) {
			if (this.peek().type === _type) {
				return true;
			}
		}

		return false;
	}

	protected peek(): Token {
		return this.tokens[this.current];
	}

	protected step(): Token {
		if (!this.isEOF()) this.current++;

		return this.previous();
	}

	protected consume(tokenType: TokenType, errorMessage: string): Token {
		if (this.isType(tokenType)) return this.step();

		throw this.error(this.peek(), errorMessage);
	}

	protected previous(): Token {
		return this.tokens[this.current - 1];
	}

	protected match(token: TokenType): boolean {
		if (this.isType(token)) {
			this.step();

			return true;
		}

		return false;
	}

	protected matches(...types: Array<TokenType>): boolean {
		for (const tokenType of types) {
			const isMatch = this.match(tokenType);

			if (isMatch) {
				return true;
			}
		}

		return false;
	}

	/** Expressions */

	protected express(): Expression {
		if (this.match(TokenType.START)) {
			return this.start();
		}

		if (this.match(TokenType.ENV)) {
			return this.accessor();
		}

		const expr = this.expression();

		if (this.match(TokenType.CONTINUE)) {
			if (this.isType(TokenType.L_B)) {
				return expr;
			} else {
				return this.ternary(expr);
			}
		}

		return expr;
	}

	protected expression(): Expression {
		if (this.matches(TokenType.MINUS, TokenType.NOT)) {
			return this.unary();
		}

		const left = this.primary();

		if (
			this.matches(
				TokenType.STAR,
				TokenType.MINUS,
				TokenType.PLUS,
				TokenType.SLASH,
				TokenType.EQUAL,
				TokenType.GREATER,
				TokenType.LESS,
				TokenType.G_E,
				TokenType.L_E,
				TokenType.E_E,
				TokenType.OR,
				TokenType.AND,
			)
		) {
			return this.binary(left);
		}

		return left;
	}

	private primary(): Expression {
		if (this.matches(TokenType.STRING, TokenType.NUMBER, TokenType.FALSE, TokenType.TRUE, TokenType.SECONDS)) {
			return this.literal();
		}

		if (this.match(TokenType.L_P)) {
			return this.grouping();
		}

		if (this.match(TokenType.L_BK)) {
			return this.array();
		}

		if (this.match(TokenType.IDENTIFIER)) {
			return this.variable();
		}

		throw this.error(this.peek(), "Expected an expression!");
	}

	private unary(): UnaryExpression {
		const operator = this.previous();
		const right = this.express();

		return newExpression(ExpressionType.UNARY, { operator, right });
	}

	private binary(left: Expression): BinaryExpression {
		const operator = this.previous();
		const right = this.expression();

		return newExpression(ExpressionType.BINARY, { left, operator, right });
	}

	private ternary(condition: Expression): TernaryExpression {
		const ifTrue = this.express();
		this.consume(TokenType.COLON, `Expected : after expression to denote the ternary's continuation.`);
		const ifFalse = this.express();

		return newExpression(ExpressionType.TERNARY, { condition, ifTrue, ifFalse });
	}

	private variable(): VariableExpression {
		return newExpression(ExpressionType.VARIABLE, { name: this.previous() });
	}

	private literal(): LiteralExpression {
		let value = this.previous();
		const dataType = value.literalType;

		switch (value.lexeme) {
			case "false": {
				value = false as never;

				break;
			}

			case "true": {
				value = true as never;

				break;
			}

			default: {
				value = value.literal as never;
			}
		}

		return newExpression(ExpressionType.LITERAL, { value: value as never, dataType });
	}

	private accessor(): EnvironmentAccessor {
		return newExpression(ExpressionType.ENV, { name: this.previous() });
	}

	private grouping(): GroupingExpression {
		const expr = this.express();
		this.consume(TokenType.R_P, `Expected ")" to close a grouping expression.`);

		return newExpression(ExpressionType.GROUPING, { expr });
	}

	private array(): ArrayExpression {
		const exprs: Array<Expression> = new Array();

		while (!this.isEOF()) {
			if (this.isType(TokenType.R_BK)) {
				this.consume(TokenType.R_BK, `Expected enclosing bracket (]) to an array expression.`);

				break;
			}

			const expr = this.express();
			exprs.push(expr);

			this.match(TokenType.COMMA);
		}

		return newExpression(ExpressionType.ARRAY, { expressions: exprs });
	}

	private metadata(): MetadataExpression {
		const args: Array<Expression> = new Array();

		while (!this.isEOF()) {
			if (this.isType(TokenType.R_P)) {
				this.consume(TokenType.R_P, `Expected enclosing parenthesis to a metadata express.`);

				break;
			}

			const expr = this.express();
			args.push(expr);

			this.match(TokenType.COMMA);
		}

		return newExpression(ExpressionType.METADATA, { args });
	}

	private start(): StartExpression {
		const objective = this.consume(TokenType.IDENTIFIER, `Expected an objective identifier to start!`);

		return newExpression(ExpressionType.START, { objective });
	}

	/** Statements */

	private declare(): Statement {
		if (this.isType(TokenType.PROPERTY, TokenType.OBJECTIVE, TokenType.STORE)) {
			if (this.match(TokenType.PROPERTY)) {
				return this.declaration(StatementType.PROPERTY);
			}

			if (this.match(TokenType.OBJECTIVE)) {
				return this.declaration(StatementType.OBJECTIVE, true);
			}

			if (this.match(TokenType.STORE)) {
				return this.declaration(StatementType.STORE, true);
			}
		}

		if (this.match(TokenType.SCENE)) {
			return this.scene();
		}

		if (this.match(TokenType.INTERACT)) {
			return this.interact();
		}

		if (this.match(TokenType.ACTOR)) {
			return this.declaration(StatementType.ACTOR, false);
		}

		return this.statement();
	}

	private statement(): Statement {
		if (this.match(TokenType.IF)) {
			return this.if();
		}

		if (this.match(TokenType.OPTION)) {
			return this.option();
		}

		if (this.match(TokenType.TRIGGER)) {
			return this.trigger();
		}

		if (this.match(TokenType.ECHO)) {
			return this.echo();
		}

		if (this.match(TokenType.SET)) {
			return this.declaration(StatementType.SET);
		}

		if (this.match(TokenType.L_BK)) {
			return this.dialogue();
		}

		if (this.match(TokenType.DEFAULT)) {
			if (this.match(TokenType.OBJECTIVE)) {
				return this.declaration(StatementType.OBJECTIVE, true, true);
			}

			if (this.isType(TokenType.SCENE)) {
				return this.scene();
			}
		}

		return this.expressionStatement();
	}

	private declaration(_type: StatementType, hasMetadata?: boolean, isDefault?: boolean): Statement {
		const name = this.consume(TokenType.IDENTIFIER, `Expected an identifier for the ${_type}`);

		let identifier: Token | undefined;
		if (_type === StatementType.STORE) {
			identifier = this.consume(TokenType.IDENTIFIER, `Expected an identifier.`);
		}

		let metadata: MetadataExpression | undefined;
		if (hasMetadata && this.match(TokenType.L_P)) {
			metadata = this.metadata();
		}

		const _default = isDefault;
		const value = this.express();

		return newStatement(_type, { name, value, metadata, identifier, default: _default } as never);
	}

	private block(): BlockStatement {
		const statements: Array<Statement> = new Array();

		while (!this.isEOF()) {
			if (this.isType(TokenType.R_B)) {
				this.consume(TokenType.R_B, "Expected '}' to close a block.");

				break;
			}

			statements.push(this.statement());
		}

		return newStatement(StatementType.BLOCK, { statements });
	}

	private conditionsBlock(): BlockOfConditionsStatement {
		const conditions: Array<ConditionStatement> = new Array();

		while (!this.isEOF()) {
			if (this.isType(TokenType.R_B)) {
				this.consume(TokenType.R_B, "Expected '}' to close a block.");

				break;
			}

			conditions.push(this.condition());
		}

		return newStatement(StatementType.BLOCK_OF_CONDITIONS, { conditions });
	}

	private dialogue(): DialogueStatement {
		const actor = this.consume(TokenType.IDENTIFIER, `Expected an Actor to start a dialogue.`);
		this.consume(TokenType.R_BK, `Expected to close the dialogue Actor specification.`);

		const text = this.express();

		let metadata: Expression | undefined;
		if (this.match(TokenType.L_P)) {
			metadata = this.metadata();
		}

		let body: BlockStatement | undefined;
		if (this.match(TokenType.WITH)) {
			this.consume(TokenType.L_B, `Expected an opening for a dialogue's body.`);
			body = this.block();
		}

		const options: Array<Statement> = [];
		if (body !== undefined) {
			for (const stmt of body.statements) {
				if (stmt.type === StatementType.OPTION) {
					options.push(stmt);
				}
			}
		}

		return newStatement(StatementType.DIALOGUE, { actor, text, metadata, options, body });
	}

	private condition(): ConditionStatement {
		const condition = this.express();

		this.consume(TokenType.L_B, `Expected "{" after -> to start a condition's body.`);
		const body = this.block();

		return newStatement(StatementType.CONDITION, { condition, body });
	}

	private if(): IfStatement {
		let condition: Expression | undefined;
		if (
			this.isType(
				TokenType.STRING,
				TokenType.NUMBER,
				TokenType.TRUE,
				TokenType.FALSE,
				TokenType.IDENTIFIER,
				TokenType.L_P,
			)
		) {
			condition = this.express();
		}

		let body: BlockStatement | BlockOfConditionsStatement;
		if (condition !== undefined) {
			this.consume(TokenType.L_B, `Expected "{" after a -> for the body start.`);
			body = this.block();
		} else {
			this.consume(TokenType.L_B, `Expected "{" after an if`);
			body = this.conditionsBlock();
		}

		return newStatement(StatementType.IF, { condition, body });
	}

	private scene(): SceneStatement {
		const previous = this.previous();

		let _default: boolean | undefined;
		if (previous.type === TokenType.DEFAULT) {
			_default = true;
		}

		this.consume(TokenType.SCENE, "Did you meant to define a default scene.");
		const name = this.consume(TokenType.IDENTIFIER, "Expected a scene identifier.");

		this.consume(TokenType.L_B, `Expected "{" after a scene for the body start.`);
		const body = this.block();

		return newStatement(StatementType.SCENE, { name, body, default: _default });
	}

	private option(): OptionStatement {
		const value = this.express();

		let metadata: MetadataExpression | undefined;
		if (this.match(TokenType.L_P)) {
			metadata = this.metadata();
		}

		this.consume(TokenType.L_B, `Expected "{" to start the option's body.`);
		const body = this.block();

		return newStatement(StatementType.OPTION, { value, metadata, body });
	}

	private trigger(): TriggerStatement {
		const values = this.express();

		this.consume(TokenType.L_B, `Expected "{" to start the trigger's body.`);
		const body = this.block();

		return newStatement(StatementType.TRIGGER, { values, body });
	}

	private interact(): InteractStatement {
		const identifier = this.consume(TokenType.IDENTIFIER, `Expected an identifier for the interaction.`);

		this.consume(TokenType.L_B, `Expected "{" to start the interaction's body.`);
		const body = this.block();

		return newStatement(StatementType.INTERACT, { identifier, body });
	}

	private echo(): EchoStatement {
		return newStatement(StatementType.ECHO, { expr: this.express() });
	}

	private expressionStatement(): ExpressionStatement {
		return newStatement(StatementType.EXPRESSION_STATEMENT, { expr: this.express() });
	}
}
