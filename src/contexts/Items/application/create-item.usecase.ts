import { Logger } from "../../Shared/infrastructure/logger";
import { ScheduledItem } from "../domain";
import { IScheduledItemsRepository } from "../domain/item-repository.interface";

const logger = new Logger("CreateItemUseCase");

export type CreateItemUseCaseInput = ScheduledItem;

export class CreateItemUseCase {
	constructor(
		private readonly _scheduledItemsRepository: IScheduledItemsRepository
	) {}

	async execute(item: CreateItemUseCaseInput): Promise<void> {
		logger.debug("item to persist", {
			item: item.toPrimitives(),
		});

		await this._scheduledItemsRepository.persist(item);
	}
}
