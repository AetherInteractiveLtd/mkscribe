<div align=center>
    <h2><b>MkScribe</b></h2>
</div>

MkScribe, a portable TypeScript version of Scribe's AST generator. Efficient, fast and kind of lightweight, made thinking on those who may want to create a Virtual Machine to interpret it.

### Basic usage

MkScribe is as simple as it seems, take for example the next code.

```ts
import { MkScribe } from "aethergames/mkscribe";

/**
 * Will return the next value:
 *
 * [
 *  {
 *      name: {...},
 *      identifier: {...},
 *      value: ...,
 *      type: StoreStatement,
 *  },
 *  ...
 * ]
 */
MkScribe.build(`
store id IDENTIFIER "Hello!"

echo id
`);
```

From there, you decide how to interpret it.
