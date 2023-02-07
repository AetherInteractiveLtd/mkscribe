import { ScribeBuilder } from "./scribe";
import { ScribeRuntimeImplementation } from "./scribe/types";

export namespace MkScribe {
	export function load(source: string): ScribeRuntimeImplementation {
		return new ScribeBuilder(source);
	}
}
