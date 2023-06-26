import { newExpression, newStatement, ExpressionType, StatementType } from "../ast";
import {
	ArrayExpression,
	BinaryExpression,
	BlockStatement,
	ConditionStatement,
	DialogueStatement,
	DoStatement,
	EnvironmentAccessor,
	ExitExpression,
	Expression,
	ExpressionStatement,
	GroupingExpression,
	IfStatement,
	InteractStatement,
	LiteralExpression,
	MacroExpression,
	MetadataExpression,
	OptionStatement,
	OtherwiseStatement,
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

	public parse(): Array<Statement> {
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

	private retrieveArgs(tokenType: TokenType, errMessage: string): Array<Expression> {
		const args: Array<Expression> = new Array();

		while (!this.isEOF()) {
			if (this.isType(tokenType)) {
				this.consume(tokenType, errMessage);

				break;
			}

			args.push(this.express());

			this.match(TokenType.COMMA); // Optional
		}

		return args;
	}

	/** Expressions */

	protected express(): Expression {
		if (this.match(TokenType.START)) {
			return this.start();
		}

		if (this.match(TokenType.ENV)) {
			if (this.isType(TokenType.L_P)) {
				return this.macro();
			} else {
				return this.accessor();
			}
		}

		if (this.match(TokenType.EXIT)) {
			return this.exit();
		}

		const expr = this.expression();

		if (this.match(TokenType.CONTINUE)) {
			if (this.isType(TokenType.L_B)) {
				return this.condition(expr) as never;
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
				TokenType.EXPONENTIAL,
				TokenType.MODULUS,
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
		return newExpression(ExpressionType.ARRAY, {
			expressions: this.retrieveArgs(TokenType.R_BK, "Expected enclosing bracket (]) to an array expression."),
		});
	}

	private metadata(): MetadataExpression {
		return newExpression(ExpressionType.METADATA, {
			args: this.retrieveArgs(TokenType.R_P, "Expected enclosing parenthesis to a metadata express."),
		});
	}

	private start(): StartExpression {
		return newExpression(ExpressionType.START, {
			objective: this.consume(TokenType.IDENTIFIER, `Expected an objective identifier to start!`),
		});
	}

	private macro(): MacroExpression {
		const name = this.previous();

		this.consume(TokenType.L_P, "Expected an opening parenthesis for arguments in a macro.");

		const args = this.retrieveArgs(TokenType.R_P, "Expected enclosing parenthesis for arguments in a macro.");

		return newExpression(ExpressionType.MACRO, { name, args });
	}

	private exit(): ExitExpression {
		return newExpression(ExpressionType.EXIT, { value: this.express() });
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

		if (this.match(TokenType.DO)) {
			return this.do();
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

		if (this.match(TokenType.OTHERWISE)) {
			return this.otherwise();
		}

		if (this.match(TokenType.TRIGGER)) {
			return this.trigger();
		}

		if (this.match(TokenType.SET)) {
			return this.declaration(StatementType.SET);
		}

		if (this.match(TokenType.L_BK)) {
			return this.dialogue();
		}

		if (this.match(TokenType.DEFAULT)) {
			if (this.consume(TokenType.OBJECTIVE, "You can only set objectives to be default.")) {
				return this.declaration(StatementType.OBJECTIVE, true, true);
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

	private block(consumingMessage: string): BlockStatement {
		this.consume(TokenType.L_B, consumingMessage);
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

	private do(): DoStatement {
		return newStatement(StatementType.DO, { body: this.block(`Expected a "{" to open a do's body.`) });
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
			body = this.block("Expected an opening for a dialogue's body.");
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

	private condition(condition: Expression): ConditionStatement {
		return newStatement(StatementType.CONDITION, {
			condition,
			body: this.block(`Expected "{" after -> to start a condition's body.`),
		});
	}

	private otherwise(): OtherwiseStatement {
		this.consume(TokenType.CONTINUE, "Expected -> after otherwise to start it's body.");

		return newStatement(StatementType.OTHERWISE, {
			body: this.block(`Expected "{" after -> to start a condition's body.`),
		});
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

		const body: BlockStatement = this.block(`Expected "{" after an if`);

		let elseBody: BlockStatement | undefined;
		if (condition !== undefined) {
			if (this.match(TokenType.ELSE)) {
				elseBody = this.block(`Expected "{" after an else for the body start.`);
			}
		}

		return newStatement(StatementType.IF, { condition, body, else: elseBody });
	}

	private scene(): SceneStatement {
		const name = this.consume(TokenType.IDENTIFIER, "Expected a scene identifier.");
		const body = this.block(`Expected "{" after a scene for the body start.`);

		return newStatement(StatementType.SCENE, { name, body });
	}

	private option(): OptionStatement {
		const value = this.express();

		let metadata: MetadataExpression | undefined;
		if (this.match(TokenType.L_P)) {
			metadata = this.metadata();
		}

		const body = this.block(`Expected "{" to start the option's body.`);

		return newStatement(StatementType.OPTION, { value, metadata, body });
	}

	private trigger(): TriggerStatement {
		const values = this.express();
		const body = this.block(`Expected "{" to start the trigger's body.`);

		return newStatement(StatementType.TRIGGER, { values, body });
	}

	private interact(): InteractStatement {
		const identifier = this.consume(TokenType.IDENTIFIER, `Expected an identifier for the interaction.`);
		const body = this.block(`Expected "{" to start the interaction's body.`);

		return newStatement(StatementType.INTERACT, { identifier, body });
	}

	private expressionStatement(): ExpressionStatement {
		return newStatement(StatementType.EXPRESSION_STATEMENT, { expr: this.express() });
	}
}
