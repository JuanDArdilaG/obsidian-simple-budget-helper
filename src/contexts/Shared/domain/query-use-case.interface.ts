import { UseCase } from "./use-case.interface";

export interface QueryUseCase<QueryUseCaseInput, QueryUseCaseOutput>
	extends UseCase<QueryUseCaseInput, QueryUseCaseOutput> {}
