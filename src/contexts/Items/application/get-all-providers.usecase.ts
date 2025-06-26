import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { IProviderRepository } from "../domain/provider-repository.interface";
import { Provider } from "../domain/provider.entity";

export type GetAllProvidersUseCaseOutput = {
	providers: Provider[];
};

export class GetAllProvidersUseCase
	implements QueryUseCase<void, GetAllProvidersUseCaseOutput>
{
	readonly #logger = new Logger("GetAllProvidersUseCase");
	constructor(private readonly _providerRepository: IProviderRepository) {}

	async execute(): Promise<GetAllProvidersUseCaseOutput> {
		const providers = await this._providerRepository.findAll();
		this.#logger.debugB("get all providers", { providers }).log();

		return {
			providers: providers.sort((a, b) =>
				a.name.value.localeCompare(b.name.value)
			),
		};
	}
}
