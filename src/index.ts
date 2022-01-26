import * as CucumberJs from "@cucumber/cucumber";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import * as RA from "fp-ts/ReadonlyArray";
import * as RNEA from "fp-ts/ReadonlyNonEmptyArray";
import * as RR from "fp-ts/ReadonlyRecord";
import { identity } from "io-ts";
import * as DIO from "io-ts/Decoder";
import escapeRegExp from "lodash.escaperegexp";
import { v4 } from "uuid";
import { decodeOrThrow, defineParameterTypeWithDecoder } from "./Decoder";
import { ParameterTypeDefinition } from "./parameterTypes";

/**
 * Built-in cucumber-js keywords
 * @external https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/api_reference.md
 */
const builtIn = ["int", "float", "string", "word"] as const;
type BuiltIn = typeof builtIn[number];

// REVIEW Relationship with Expression is inversible
type ExtractParamsDefinitions<E extends string> =
  E extends `${infer _Start}{${infer Param}}${infer Rest}`
    ? (Param extends BuiltIn ? {} : { [K in Param]: ParameterTypeDefinition }) &
        ExtractParamsDefinitions<Rest>
    : {};

type DecodedParam<P extends ParameterTypeDefinition> = P extends {
  kind: "parameterType_string";
}
  ? string
  : P extends {
      kind: "parameterType_sum";
    }
  ? P["values"][number]
  : P extends {
      kind: "parameterType_list";
    }
  ? P extends {
      isNonEmpty: true;
    }
    ? RNEA.ReadonlyNonEmptyArray<P["values"][number]>
    : readonly P["values"][number][]
  : unknown;

type DecodedParams<
  Definitions extends {
    readonly [K: string]: ParameterTypeDefinition;
  },
  E extends string
> = E extends `${infer _Start}{${infer Param}}${infer Rest}`
  ? readonly [
      Param extends BuiltIn ? string : DecodedParam<Definitions[Param]>,
      ...DecodedParams<Definitions, Rest>
    ]
  : [];

const UnknownD = DIO.parse(E.right);
const IsReadonlyNonEmptyStringArray = DIO.refine(
  (x: ReadonlyArray<string>): x is RNEA.ReadonlyNonEmptyArray<string> =>
    x.length > 0,
  "IsReadonlyNonEmptyArray"
);

/**
 * Type-safe cucumber step definition
 * @param expression Step description. Parameters are declared between curly braces (`{param}`)
 * @param definitions Record of parameter definitions. Use a tuple to define a sum type
 * @param implementation Assertion function
 */
export const defineStep = <
  Expression extends string,
  Definitions extends ExtractParamsDefinitions<Expression>
>(
  expression: Expression,
  implementation: (..._: DecodedParams<Definitions, Expression>) => void,
  // TODO Make empty objects optional
  definitions: keyof Definitions extends keyof ExtractParamsDefinitions<Expression>
    ? Definitions
    : never
): void => {
  const paramSuffix = `__${v4()}`;

  const nameConstructs = pipe(
    expression.match(/{([^{^}.]*)}/g) ?? [],
    RA.map((braced) => ({ braced, name: braced.slice(1, -1) })),
    RA.filter(({ name }) => !builtIn.some((x) => x === name)),
    RA.map(({ braced, name }) => ({
      braced,
      name,
      suffixed: name.concat(paramSuffix),
    }))
  );

  pipe(
    definitions as Readonly<Record<string, ParameterTypeDefinition>>,
    RR.mapWithIndex((rawName, definition) => {
      const name = rawName.concat(paramSuffix);
      switch (definition.kind) {
        // TODO Test
        case "parameterType_string":
          CucumberJs.defineParameterType({
            name,
            regexp: /./g,
            transformer(x: string) {
              return x;
            },
          });
          // REVIEW At the moment, decoders are being discarded. See if it makes sense to keep these returns
          return DIO.string;
        case "parameterType_raw":
          CucumberJs.defineParameterType({ ...definition.transform, name });
          return UnknownD;
        case "parameterType_sum":
          return defineParameterTypeWithDecoder(...definition.values)(name);
        case "parameterType_list":
          const Decoder = pipe(
            DIO.literal(...definition.values),
            DIO.array,
            DIO.readonly,
            definition.isNonEmpty ? IsReadonlyNonEmptyStringArray : identity
          );
          CucumberJs.defineParameterType({
            name,
            regexp: pipe(
              definition.values,
              RA.map(escapeRegExp),
              (xs) => xs.join("|"),
              (ws) => `((${ws})(, (${ws}))*)`,
              (rgx) => (definition.isNonEmpty ? rgx : `(${rgx}?)`),
              (rgx) => new RegExp(rgx)
            ),
            transformer: decodeOrThrow(
              pipe(
                DIO.string,
                DIO.map((x) => (x === "" ? [] : x.split(", "))),
                DIO.compose(Decoder)
              )
            ),
          });
          return Decoder;
        default:
          const d: never = definition;
          throw new Error(`Unknown definition: ${JSON.stringify(d)}`);
      }
    })
  );

  const expressionRefined = pipe(
    nameConstructs,
    RA.reduce(expression, (acc: string, { braced, suffixed }) =>
      // TODO Take nested curly braces into account
      acc.replace(braced, `{${suffixed}}`)
    )
  );

  CucumberJs.defineStep(expressionRefined, (...rest: any) => {
    return implementation(...rest);
  });
};

export { decodeOrThrow, defineParameterTypeWithDecoder } from "./Decoder";
export {
  parameterTypeList,
  parameterTypeNonEmptyList,
  parameterTypeRaw,
  parameterTypeString,
  parameterTypeSum,
} from "./parameterTypes";
