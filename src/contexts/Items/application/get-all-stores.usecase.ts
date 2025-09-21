import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { IStoreRepository } from "../domain/store-repository.interface";
import { Store } from "../domain/store.entity";

export type GetAllStoresUseCaseOutput = {
	stores: Store[];
};

export class GetAllStoresUseCase
	implements QueryUseCase<void, GetAllStoresUseCaseOutput>
{
	readonly #logger = new Logger("GetAllStoresUseCase");
	constructor(private readonly _storeRepository: IStoreRepository) {}

	async execute(): Promise<GetAllStoresUseCaseOutput> {
		const stores = await this._storeRepository.findAll();
		this.#logger.debugB("get all stores", { stores }).log();

		return {
			stores: stores.sort((a, b) =>
				a.name.value.localeCompare(b.name.value)
			),
		};
	}
}
