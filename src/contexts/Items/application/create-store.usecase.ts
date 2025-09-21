import { Logger } from "../../Shared/infrastructure/logger";
import { IStoreRepository } from "../domain/store-repository.interface";
import { Store } from "../domain/store.entity";

const logger = new Logger("CreateStoreUseCase");

export type CreateStoreUseCaseInput = Store;

export class CreateStoreUseCase {
	constructor(private readonly _storeRepository: IStoreRepository) {}

	async execute(store: CreateStoreUseCaseInput): Promise<void> {
		logger.debug("store to persist", {
			store: store.toPrimitives(),
		});

		await this._storeRepository.persist(store);
	}
}
