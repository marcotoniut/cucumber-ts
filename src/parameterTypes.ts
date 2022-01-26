import type { IParameterTypeDefinition } from "@cucumber/cucumber/lib/support_code_library_builder/types";

/**
 * Structure for defining a parameter whose type will be unknown. Bypass type checks, should be avoided, if possible.
 */
export type ParameterTypeDefinitionRaw = {
  readonly kind: "parameterType_raw";
  readonly transform: Exclude<IParameterTypeDefinition<unknown>, "name">;
};

/**
 * Constructor for parameters of unknown type
 * @param transform
 * @returns Construct to use with `defineStep` with unsafe types
 */
export const parameterTypeRaw = (
  transform: Omit<IParameterTypeDefinition<unknown>, "name">
) =>
  ({
    kind: "parameterType_raw",
    transform,
  } as const);

/**
 * Structure for defining a parameter of string type. Equivalent to the reserved `word` keyword.
 */
export type ParameterTypeDefinitionString = {
  readonly kind: "parameterType_string";
};

/**
 * Constructor for parameters that cover a string type
 * @returns Construct to use with `defineStep` for parameters of string type
 */
export const parameterTypeString = () =>
  ({
    kind: "parameterType_string",
  } as const);

/**
 * Structure for defining a parameter of a string-based tuple type.
 */
export type ParameterTypeDefinitionSum = {
  readonly kind: "parameterType_sum";
  readonly values: readonly [string, ...(readonly string[])];
};

/**
 * Constructor for parameters that cover a sum of elements
 * @param values Rest tuple of expected values in the list
 * @returns Construct to use with `defineStep` for sum type parameters
 */
export const parameterTypeSum = <
  RS extends readonly [string, ...(readonly string[])]
>(
  ...values: RS
) =>
  ({
    kind: "parameterType_sum",
    values,
  } as const);

/**
 * Set of options for {ParameterTypeDefinitionList}
 */
export type ParameterTypeDefinitionListOptions = {
  readonly isNonEmpty: boolean;
};

/**
 * Structure for defining a parameter of a list of a string-based sum type.
 * They can be configured to be either regular or non-empty lists.
 */
export type ParameterTypeDefinitionList = {
  readonly kind: "parameterType_list";
  readonly values: readonly [string, ...(readonly string[])];
} & ParameterTypeDefinitionListOptions;

/**
 * Constructor for parameters that cover a list of elements
 * TODO establish clear detection rules for empty lists
 * @param values Rest tuple of expected values in the list
 * @returns Construct to use with `defineStep` for list parameters
 */
export const parameterTypeList = <RS extends readonly string[]>(
  ...values: RS
) =>
  ({
    kind: "parameterType_list",
    isNonEmpty: false,
    values,
  } as const);

/**
 * Constructor for parameters that cover a non empty list of elements
 * @param values Rest tuple of expected values in the list
 * @returns Construct to use with `defineStep` for non empty list parameters
 */
export const parameterTypeNonEmptyList = <
  RS extends readonly [string, ...(readonly string[])]
>(
  ...values: RS
) =>
  ({
    kind: "parameterType_list",
    isNonEmpty: true,
    values,
  } as const);

/**
 * Union of all parameter type structures accepted by `defineStep`
 */
export type ParameterTypeDefinition =
  | ParameterTypeDefinitionString
  | ParameterTypeDefinitionRaw
  | ParameterTypeDefinitionSum
  | ParameterTypeDefinitionList;
