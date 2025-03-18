import { UseCase } from "./use-case.interface";

export interface CommandUseCase<CommandUseCaseInput>
	extends UseCase<CommandUseCaseInput, void> {}
