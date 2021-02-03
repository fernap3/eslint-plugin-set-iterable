const ts = require("typescript");

// From https://github.com/typescript-eslint/typescript-eslint/blob/32bd18de80f4f8388717d0f0c16d493234362aa5/packages/experimental-utils/src/eslint-utils/getParserServices.ts#L10
const ERROR_MESSAGE = 'You have used a rule which requires parserServices to be generated. You must therefore provide a value for the "parserOptions.project" property for @typescript-eslint/parser.';

function getParserServices(context, allowWithoutFullTypeInformation = false)
{
  // backwards compatibility check
  // old versions of the parser would not return any parserServices unless parserOptions.project was set
  if (
    !context.parserServices ||
    !context.parserServices.program ||
    !context.parserServices.esTreeNodeToTSNodeMap ||
    !context.parserServices.tsNodeToESTreeNodeMap
  ) {
    throw new Error(ERROR_MESSAGE);
  }

  const hasFullTypeInformation =
    context.parserServices.hasFullTypeInformation ??
    /* backwards compatible */ true;

  // if a rule requires full type information, then hard fail if it doesn't exist
  // this forces the user to supply parserOptions.project
  if (!hasFullTypeInformation && !allowWithoutFullTypeInformation) {
    throw new Error(ERROR_MESSAGE);
  }

  return context.parserServices;
}

function getTypeName(typeChecker, type)
{
	// It handles `string` and string literal types as string.
	if ((type.flags & ts.TypeFlags.StringLike) !== 0) {
	  return 'string';
	}
  
	// If the type is a type parameter which extends primitive string types,
	// but it was not recognized as a string like. So check the constraint
	// type of the type parameter.
	if ((type.flags & ts.TypeFlags.TypeParameter) !== 0) {
	  // `type.getConstraint()` method doesn't return the constraint type of
	  // the type parameter for some reason. So this gets the constraint type
	  // via AST.
	  const symbol = type.getSymbol();
	  const decls = symbol?.getDeclarations();
	  const typeParamDecl = decls?.[0];
	  if (
		ts.isTypeParameterDeclaration(typeParamDecl) &&
		typeParamDecl.constraint != null
	  ) {
		return getTypeName(
		  typeChecker,
		  typeChecker.getTypeFromTypeNode(typeParamDecl.constraint),
		);
	  }
	}
  
	// If the type is a union and all types in the union are string like,
	// return `string`. For example:
	// - `"a" | "b"` is string.
	// - `string | string[]` is not string.
	if (
	  type.isUnion() &&
	  type.types
		.map(value => getTypeName(typeChecker, value))
		.every(t => t === 'string')
	) {
	  return 'string';
	}
  
	// If the type is an intersection and a type in the intersection is string
	// like, return `string`. For example: `string & {__htmlEscaped: void}`
	if (
	  type.isIntersection() &&
	  type.types
		.map(value => getTypeName(typeChecker, value))
		.some(t => t === 'string')
	) {
	  return 'string';
	}
  
	return typeChecker.typeToString(type);
}

function isSetType(parserService, node)
{
	const typeChecker = parserService.program.getTypeChecker();
	const objectType = typeChecker.getTypeAtLocation(parserService.esTreeNodeToTSNodeMap.get(node));
	return getTypeName(typeChecker, objectType).startsWith("Set<");
}

module.exports = {
	rules: {
		"no-set-spread": {
			meta: {
				type: "problem",
			},
			create: function (context)
			{
				const service = getParserServices(context);
				
				return {
					SpreadElement: function (node)
					{
						const spreadArg = node.argument;
						if (isSetType(service, spreadArg))
						{
							context.report({
								node: node,
								message: "Can't use spread operator with Set<T>"
							});
						}
					}
				};
			},
		},
		"no-for-of-set": {
			meta: {
				type: "problem",
			},
			create: function (context)
			{
				const service = getParserServices(context);

				return {
					ForOfStatement: function (node)
					{
						const rhs = node.right;
						
						if (isSetType(service, rhs))
						{
							context.report({
								node: node,
								message: "Can't use for-of to iterate over Set<T>"
							});
						}
					}
				};
			},
		},
	}
};