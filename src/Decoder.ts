import * as Cucumber from "@cucumber/cucumber";
import * as E from "fp-ts/Either";
import { flow, identity, pipe } from "fp-ts/lib/function";
import * as RA from "fp-ts/ReadonlyArray";
import * as DIO from "io-ts/Decoder";
import escapeRegExp from "lodash.escaperegexp";

/**
 * Instantiate an javascript `Error` that holds a string representation of an io-ts `DecodeError`
 * @param {DIO.DecodeError} e io-ts `DecodeError`
 * @returns {Error} javascript `Error`
 */
export function constructDecodeError(e: DIO.DecodeError): Error {
  return new Error(`DecodeError: ${JSON.stringify(e)}`);
}

/**
 * Attempt a decoding using `Decoder.decode` and throw an `Error` if it fails
 * @param {DIO.Decoder} d io-ts `Decoder`
 * @param {I} i `Decoder`'s input
 * @returns {A} `Decoder`'s output
 */
export const decodeOrThrow = <I, A>(d: DIO.Decoder<I, A>): ((_: I) => A) =>
  flow(
    d.decode,
    E.fold((e) => {
      throw constructDecodeError(e);
    }, identity)
  );

/**
 * `defineParameterType` and return an io-ts `Decoder` to validate at the step's definition
 * @param {A} values List of literal strings that conform the sum type
 * @param {string} name Name of the cypress parameter
 * @returns {DIO.Decoder<I, A[number]>} `Decoder` that validates that the step regex matched to
 * one of the literals defined by {@link values}
 */
export const defineParameterTypeWithDecoder =
  <A extends readonly [string, ...(readonly string[])]>(...values: A) =>
  <I>(name: string): DIO.Decoder<I, A[number]> => {
    const Decoder = DIO.literal(...values);
    Cucumber.defineParameterType({
      name,
      regexp: pipe(
        values,
        RA.map(escapeRegExp),
        (xs) => xs.join("|"),
        (x) => new RegExp(x)
      ),
      transformer: decodeOrThrow(Decoder),
    });
    return Decoder;
  };
