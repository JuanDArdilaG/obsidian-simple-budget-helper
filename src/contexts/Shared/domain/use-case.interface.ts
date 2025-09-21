export interface UseCase<UseCaseInput, UseCaseOutput> {
	execute(input: UseCaseInput): Promise<UseCaseOutput>;
}
