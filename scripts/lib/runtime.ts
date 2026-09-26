import { Console, Effect, Runtime, Schema } from "effect";

export const VERSION = "0.1.0";

export class TaskFailure extends Schema.TaggedError<TaskFailure>()("TaskFailure", {
	code: Schema.Int,
}) {
	get [Runtime.errorExitCode]() {
		return this.code;
	}
	readonly [Runtime.errorReported] = false;
}

export const failCode = (code: number): Effect.Effect<never, TaskFailure> => Effect.fail(TaskFailure.make({ code }));

export const failWith = (message: string): Effect.Effect<never, TaskFailure> => Console.error(message).pipe(Effect.andThen(failCode(1)));
