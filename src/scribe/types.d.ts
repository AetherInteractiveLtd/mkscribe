import { Token } from "./scanner/types";

export interface ScribeRuntimeImplementation {
	getTokens(): Array<Token>;
}

export interface ScribeMetadata {}
