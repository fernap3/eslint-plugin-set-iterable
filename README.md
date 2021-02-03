# How to use

Install the package from NPM:
```
	npm install eslint-plugin-set-iterable
```

Add the rule to your eslint config:
```json
{
	"env": {
		"es6": true
	},
	"root": true,
	"parser": "@typescript-eslint/parser",
	"parserOptions": { 
		"ecmaVersion": 2020,
		"tsconfigRootDir": ".",
		"project": ["./tsconfig.json"]
	},
	"plugins": [ "@typescript-eslint", "set-iterable" ],
	"rules": {
		"set-iterable/no-set-spread": "error",
		"set-iterable/no-for-of-set": "error"
	}
}
```

# Rule details
Adds two eslint rules for linting TypeScript files:

`no-set-spread` matches code that uses the spread (`...`) operator with a `Set<T>`.


Examples of **incorrect** code for this rule:

```javascript
const a = [...new Set()];

const s1 = new Set<string>();
[...s1];
```


`no-for-of-set` matches Set<T> being iterated over in `for...of`.

Examples of **incorrect** code for this rule:
```javascript
for (const e of new Set())
	// ...

const s1 = new Set<string>();
for (const e of s1)
	// ...
```



Internet Explorer doesn't support iterable sets (`Set.prototype[Symbol.iterator]`), so this plugin is meant to find those cases.

For info on setting up eslint rules:
https://eslint.org/docs/developer-guide/working-with-rules
