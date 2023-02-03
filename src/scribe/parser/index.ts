import { newExpression, newStatement, ExpressionType, StatementType } from "../ast";
import {
	ArrayExpression,
	BinaryExpression,
	BlockOfConditionsStatement,
	BlockStatement,
	ConditionStatement,
	ExitExpression,
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
} from "../ast/types";
import { LiteralType, Token } from "../scanner/types";
import { TokenType } from "../scanner/utils";
import { ParserImplementation } from "./types";

export class Parser implements ParserImplementation {
	private current = 0;

	constructor(private readonly tokens: Array<Token>) {}

	parse(): Array<Statement> {
		const statements: Array<Statement> = new Array();

		while (!this.isEOF()) {
			try {
				statements.push(this.parseToken());
			} catch (e) {
				warn(e);
			}
		}

		return statements;
	}

	/**
	 * Checks for the current token and parse it.
	 *
	 * @return a Statement.
	 */
	private parseToken(): Statement {
		return this.declare();
	}

	/**
	 * Constructs a full error message.
	 *
	 * @param token the Token throwing the exception.
	 * @param message possible error message.
	 *
	 * @returns a string with the full logged error.
	 */
	private error(token: Token, message?: string): string {
		return token.type === TokenType.EOF
			? `End of File reached | Line: ${token.line}-`
			: `${message} | [Ln ${token.line}, start ${token.start}, end ${token.end};] | '${token.lexeme}'`;
	}

	/**
	 * Checks if it reached the EOF (end of file) token.
	 *
	 * @returns a boolean.
	 */
	protected isEOF(): boolean {
		return this.peek().type === TokenType.EOF;
	}

	/**
	 * Checks the current consumed token to be of a type.
	 *
	 * @param tokenType the TokenType to check for.
	 *
	 * @returns whether it matches the type or not.
	 */
	protected isType(tokenType: TokenType): boolean {
		if (this.isEOF()) return false;

		return this.peek().type === tokenType;
	}

	/**
	 * Looks at current consumed token.
	 *
	 * @return the current consumed token.
	 */
	protected peek(): Token {
		return this.tokens[this.current];
	}

	/**
	 * Advances to the next token and consumes it.
	 *
	 * @return the last consumed token.
	 */
	protected step(): Token {
		if (!this.isEOF()) this.current++;

		return this.previous();
	}

	/**
	 * Consumes given token of it matches the TokenType, if not, it will throw an error.
	 *
	 * @param tokenType the TokenType.
	 * @param errorMessage a possible error message, if it's not what it was expected.
	 *
	 * @returns either an error or the token consumed.
	 */
	protected consume(tokenType: TokenType, errorMessage: string): Token {
		if (this.isType(tokenType)) return this.step();

		throw this.error(this.peek(), errorMessage);
	}

	/**
	 * Returns last token from the current consumed one.
	 *
	 * @return the last consumed token.
	 */
	protected previous(): Token {
		return this.tokens[this.current - 1];
	}

	/**
	 * Consumes token if it matches the given TokenType.
	 *
	 * @param token the TokenType.
	 *
	 * @returns whether it matches or not.
	 */
	protected match(token: TokenType): boolean {
		if (this.isType(token)) {
			this.step();

			return true;
		}

		return false;
	}

	/**
	 * Consumes a token if it matches a single TokenType from the given array.
	 *
	 * @param types an array of TokenTypes.
	 *
	 * @returns a match.
	 */
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

	/**
	 * Constructs a new Expressions.
	 *
	 * @returns an Expression
	 */
	protected express(): Expression {
		if (this.match(TokenType.START)) {
			return this.start();
		}

		if (this.matches(TokenType.MINUS, TokenType.NOT)) {
			return this.unary();
		}

		const left = this.expression();

		if (
			this.matches(
				TokenType.EQUAL,
				TokenType.GREATER,
				TokenType.LESS,
				TokenType.G_E,
				TokenType.L_E,
				TokenType.E_E,
			)
		) {
			return this.logical(left);
		}

		if (this.matches(TokenType.STAR, TokenType.MINUS, TokenType.PLUS, TokenType.SLASH)) {
			return this.binary(left);
		}

		if (this.match(TokenType.CONTINUE)) {
			return this.ternary(left);
		}

		return left;
	}

	/**
	 * Constructs a new Expression depending on the matching token, this
	 * if all the previous `is...` didn't pass.
	 *
	 * @returns an Expression
	 */
	private expression(): Expression {
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

	/**
	 * Constructs a new UnaryExpression.
	 *
	 * @returns a UnaryExpression
	 */
	private unary(): UnaryExpression {
		const operator = this.previous();
		const right = this.express();

		return newExpression(ExpressionType.UNARY, {
			operator,
			right,
		});
	}

	/**
	 * Constructs a new BinaryExpression.
	 *
	 * @returns a BinaryExpression
	 */
	private binary(left: Expression): BinaryExpression {
		const operator = this.previous();
		const right = this.express();

		return newExpression(ExpressionType.BINARY, {
			left,
			operator,
			right,
		});
	}

	/**
	 * Constructs a new TernaryExpression.
	 *
	 * @returns a TernaryExpression
	 */
	private ternary(condition: Expression): TernaryExpression {
		const ifTrue = this.express();

		this.consume(TokenType.COLON, `Expected : after expression to denote the ternary's continuation.`);

		const ifFalse = this.express();

		return newExpression(ExpressionType.TERNARY, {
			condition,
			ifTrue,
			ifFalse,
		});
	}

	/**
	 * Constructs a new VariableExpression.
	 *
	 * @returns a VariableExpression
	 */
	private variable(): VariableExpression {
		const name = this.previous();

		return newExpression(ExpressionType.VARIABLE, {
			name,
		});
	}

	/**
	 * Constructs a new LiteralExpression.
	 *
	 * @returns a LiteralExpression
	 */
	private literal(): LiteralExpression {
		const value = this.previous();

		return newExpression(ExpressionType.LITERAL, {
			value: value as never, // Wonky workaround, but still, pretty valid and useful
			literalType: value.literalType as LiteralType,
		});
	}

	/**
	 * Constructs a new LogicalExpression.
	 *
	 * @returns a LogicalExpression
	 */
	private logical(left: Expression): LogicalExpression {
		const operator = this.previous();
		const right = this.express();

		return newExpression(ExpressionType.LOGICAL, {
			left,
			operator,
			right,
		});
	}

	/**
	 * Constructs a new GroupingExpression.
	 *
	 * @returns a GroupingExpression
	 */
	private grouping(): GroupingExpression {
		const expr = this.express();

		this.consume(TokenType.R_P, `Expected "(" to close a grouping express.`);

		return newExpression(ExpressionType.GROUPING, {
			expr,
		});
	}

	/**
	 * Constructs a new ArrayExpression.
	 *
	 * @returns a ArrayExpression
	 */
	private array(): ArrayExpression {
		const expressions: Array<Expression> = new Array();

		while (!this.isType(TokenType.R_BK)) {
			const expr = this.express();
			expressions.push(expr);

			this.match(TokenType.COMMA);
		}

		this.consume(TokenType.R_BK, `Expected enclosing bracket (]) to an array express.`);

		return newExpression(ExpressionType.ARRAY, {
			expressions,
		});
	}

	/**
	 * Constructs a new MetadataExpression.
	 *
	 * @returns a MetadataExpression
	 */
	private metadata(): MetadataExpression {
		const args: Array<Expression> = new Array();

		while (!this.isType(TokenType.R_P)) {
			const expr = this.express();
			args.push(expr);

			this.match(TokenType.COMMA);
		}

		this.consume(TokenType.R_P, `Expected enclosing parenthesis to a metadata express.`);

		return newExpression(ExpressionType.METADATA, {
			args,
		});
	}

	/**
	 * Constructs a new StartExpression.
	 *
	 * @returns a StartExpression
	 */
	private start(): StartExpression {
		const objective = this.consume(TokenType.IDENTIFIER, `Expected an objective identifier to start!`);

		return newExpression(ExpressionType.START, {
			objective,
		});
	}

	/**
	 * Constructs a new ExitExpression.
	 *
	 * @returns an ExitExpression
	 */
	private exit(): ExitExpression {
		const data = this.express();

		return newExpression(ExpressionType.EXIT, {
			data,
		});
	}

	/** Statements */

	/**
	 * Declares a new statement.
	 *
	 * @returns an Statement
	 */
	private declare(): Statement {
		if (this.match(TokenType.STORE)) {
			return this.store();
		}

		if (this.match(TokenType.OBJECTIVE)) {
			return this.objective();
		}

		return this.statement();
	}

	/**
	 * Constructs a new statement depending on its type.
	 *
	 * @returns an Statement
	 */
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
			return this.set();
		}

		return this.expressionStatement();
	}

	/**
	 * Constructs a new StoreStatement.
	 *
	 * @returns a StoreStatement
	 */
	private store(): StoreStatement {
		const name = this.consume(TokenType.IDENTIFIER, "Expected a store name.");

		let metadata: Expression | undefined;

		if (this.match(TokenType.L_P)) {
			metadata = this.metadata();
		}

		const value = this.express();

		return newStatement(StatementType.STORE, {
			name,
			metadata,
			value,
		});
	}

	/**
	 * Constructs a new ObjectiveStatement.
	 *
	 * @returns an ObjectiveStatement
	 */
	private objective(): ObjectiveStatement {
		const name = this.consume(TokenType.IDENTIFIER, `Expected an objective identifier!`);

		let value!: Expression;

		if (this.matches(TokenType.STRING, TokenType.NUMBER, TokenType.TRUE, TokenType.FALSE)) {
			value = this.express();
		} else {
			this.error(this.previous(), `Expected a literal/expression to initialise an objective's value.`);
		}

		return newStatement(StatementType.OBJECTIVE, {
			name,
			value,
		});
	}

	/**
	 * Constructs a new SetStatement.
	 *
	 * @returns an SetStatement
	 */
	private set(): SetStatement {
		const name = this.consume(TokenType.IDENTIFIER, "Expected a store identifier to modify its value.");
		const value = this.express();

		return newStatement(StatementType.SET, {
			name,
			value,
		});
	}

	/**
	 * Constructs a new BlockStatement.
	 *
	 * @returns a BlockStatement
	 */
	private block(): BlockStatement {
		const statements: Array<Statement> = new Array();

		while (!this.isType(TokenType.R_B) && !this.isEOF) {
			statements.push(this.declare());
		}

		this.consume(TokenType.R_B, "Expected '}' to close a block.");

		return newStatement(StatementType.BLOCK, {
			statements,
		});
	}

	/**
	 * Constructs a new BlockOfConditionsStatement.
	 *
	 * @returns a BlockOfConditionsStatement
	 */
	private blockOfConditions(): BlockOfConditionsStatement {
		const conditions: Array<ConditionStatement> = new Array();

		while (!this.isType(TokenType.R_B) && !this.isEOF) {
			conditions.push(this.condition());
		}

		this.consume(TokenType.R_B, "Expected '}' to close a block.");

		return newStatement(StatementType.BLOCK_OF_CONDITIONS, {
			conditions,
		});
	}

	/**
	 * Constructs a new ConditionStatement.
	 *
	 * @returns a ConditionStatement
	 */
	private condition(): ConditionStatement {
		const condition = this.express();

		this.consume(TokenType.CONTINUE, `Expected -> after a condition.`);
		this.consume(TokenType.L_B, `Expected "{" after -> to start a condition's body.`);

		const body = this.block();

		return newStatement(StatementType.CONDITION, {
			condition,
			body,
		});
	}

	/**
	 * Constructs a new IfStatement.
	 *
	 * @returns an IfStatement
	 */
	private if(): IfStatement {
		let condition: Expression | undefined;
		let body: BlockStatement | BlockOfConditionsStatement;

		// eslint-disable-next-line prefer-const
		condition = this.express();

		if (condition !== undefined) {
			this.consume(TokenType.CONTINUE, `Expected "->" after if's condition.`);
			this.consume(TokenType.L_B, `Expected "{" after a -> for the body start.`);

			body = this.block();
		} else {
			this.consume(TokenType.L_B, `Expected "{" after an if`);

			body = this.blockOfConditions();
		}

		return newStatement(StatementType.IF, {
			condition,
			body,
		});
	}

	/**
	 * Constructs a new SceneStatement.
	 *
	 * @returns an SceneStatement
	 */
	private scene(): SceneStatement {
		const name = this.consume(TokenType.IDENTIFIER, "Expected a scene identifier.");
		this.consume(TokenType.L_B, `Expected "{" after a scene for the body start.`);

		const body = this.block();

		return newStatement(StatementType.SCENE, {
			name,
			body,
		});
	}

	/**
	 * Constructs a new OptionStatement.
	 *
	 * @returns an OptionStatement.
	 */
	private option(): OptionStatement {
		let value: Expression | undefined;
		let metadata: Expression | undefined;

		// eslint-disable-next-line prefer-const
		value = this.express();

		if (this.match(TokenType.L_P)) {
			metadata = this.metadata();
		}

		this.consume(TokenType.L_B, `Expected "{" to start the option's body.`);

		const body = this.block();

		return newStatement(StatementType.OPTION, {
			value,
			metadata,
			body,
		});
	}

	/**
	 * Constructs a new TriggerStatement.
	 *
	 * @returns an TriggerStatement
	 */
	private trigger(): TriggerStatement {
		let values: Expression;
		let _type: "array" | "single";

		if (this.match(TokenType.L_BK)) {
			values = this.array();
			_type = "array";
		} else {
			values = this.express();
			_type = "single";
		}

		this.consume(TokenType.L_B, `Expected "{" to start the trigger's body.`);

		const body = this.block();

		return newStatement(StatementType.TRIGGER, {
			values,
			body,
			_type,
		});
	}

	/**
	 * Constructs a new ExpressionStatement.
	 *
	 * @returns an ExpressionStatement
	 */
	private expressionStatement(): ExpressionStatement {
		const expr = this.express();

		return newStatement(StatementType.EXPRESSION_STATEMENT, {
			expr,
		});
	}
}
