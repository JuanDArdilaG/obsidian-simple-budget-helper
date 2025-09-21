import { UseCase } from "./use-case.interface";

export type CommandUseCase<CommandUseCaseInput> = UseCase<
	CommandUseCaseInput,
	void
>;
