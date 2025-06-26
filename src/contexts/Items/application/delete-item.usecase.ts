import { Logger } from "../../Shared/infrastructure/logger";
import { ItemID } from "../domain";
import { IScheduledItemsRepository } from "../domain/item-repository.interface";

const logger = new Logger("DeleteItemUseCase");

export type DeleteItemUseCaseInput = ItemID;

export class DeleteItemUseCase {
	constructor(
		private readonly _scheduledItemsRepository: IScheduledItemsRepository
	) {}

	async execute(itemId: DeleteItemUseCaseInput): Promise<void> {
		logger.debug("item to delete", {
			itemId: itemId.value,
		});

		await this._scheduledItemsRepository.deleteById(itemId);
	}
}
