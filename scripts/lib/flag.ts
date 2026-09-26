import { Schema } from "effect";
import { Argument, Flag } from "effect/unstable/cli";
import { HOST_ENV } from "./paths.ts";

export const appFlag = Flag.String("app").pipe(Flag.withAlias("a"), Flag.optional);
export const envFlag = Flag.String("env").pipe(Flag.withSchema(Schema.NonEmptyString), Flag.withDefault(HOST_ENV));
export const portFlag = Flag.String("port").pipe(Flag.optional);

export const passthrough = Argument.String("arguments").pipe(Argument.variadic());
