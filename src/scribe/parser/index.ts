import { newExpression, newStatement, ExpressionType, StatementType } from "../ast";
import {
	ArrayExpression,
	BinaryExpression,
	BlockOfConditionsStatement,
	BlockStatement,
	ConditionStatement,
	EnviromentAccessor,
	Expression,
	ExpressionStatement,
	GroupingExpression,
	IfStatement,
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
				stmts.push(this.parseToken());
			} catch (_error) {
				warn(_error);

				this.step(); // Doesn't interrupt, and gets all errors in a go.
			}
		}

		return stmts;
	}

	private parseToken(): Statement {
		return this.declare();
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
		if (this.matches(TokenType.STRING, TokenType.NUMBER, TokenType.FALSE, TokenType.TRUE)) {
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

	private accessor(): EnviromentAccessor {
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

		return this.statement();
	}

	private statement(): Statement {
		if (this.match(TokenType.IF)) {
			return this.if();
		}

		if (this.match(TokenType.SCENE)) {
			return this.scene();
		}

		if (this.match(TokenType.OPTION)) {
			return this.option();
		}

		if (this.match(TokenType.TRIGGER)) {
			return this.trigger();
		}

		if (this.match(TokenType.SET)) {
			return this.declaration(StatementType.SET);
		}

		return this.expressionStatement();
	}

	private declaration(_type: StatementType, hasMetadata?: boolean): Statement {
		const name = this.consume(TokenType.IDENTIFIER, `Expected an identifier for the ${_type}`);

		let metadata: Expression | undefined;
		let value: Expression | undefined;

		if (hasMetadata && this.match(TokenType.L_P)) {
			metadata = this.metadata();
		}

		// eslint-disable-next-line prefer-const
		value = this.express();

		return newStatement(_type, { name, value, metadata } as never);
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

	private condition(): ConditionStatement {
		const condition = this.express();
		this.consume(TokenType.L_B, `Expected "{" after -> to start a condition's body.`);
		const body = this.block();

		return newStatement(StatementType.CONDITION, { condition, body });
	}

	private if(): IfStatement {
		let condition: Expression | undefined;
		let body: BlockStatement | BlockOfConditionsStatement;

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
		const name = this.consume(TokenType.IDENTIFIER, "Expected a scene identifier.");
		this.consume(TokenType.L_B, `Expected "{" after a scene for the body start.`);

		const body = this.block();

		return newStatement(StatementType.SCENE, { name, body });
	}

	private option(): OptionStatement {
		const value = this.express();

		let metadata: Expression | undefined;
		if (this.isType(TokenType.L_P)) {
			metadata = this.metadata();
		}

		this.consume(TokenType.L_B, `Expected "{" to start the option's body.`);
		const body = this.block();

		return newStatement(StatementType.OPTION, { value, metadata, body });
	}

	private trigger(): TriggerStatement {
		let values: Expression;

		if (this.match(TokenType.L_BK)) {
			values = this.array();
		} else {
			values = this.express();
		}

		this.consume(TokenType.L_B, `Expected "{" to start the trigger's body.`);

		const body = this.block();

		return newStatement(StatementType.TRIGGER, { values, body });
	}

	private expressionStatement(): ExpressionStatement {
		return newStatement(StatementType.EXPRESSION_STATEMENT, { expr: this.express() });
	}
}
