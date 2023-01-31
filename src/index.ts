import { ScribeRuntime } from "./scribe";
import { ScribeMetadata, ScribeRuntimeImplementation } from "./scribe/types";

export namespace Scribe {
	export function load(source: string, metadata?: ScribeMetadata): ScribeRuntimeImplementation {
		return new ScribeRuntime(source, metadata);
	}
}
