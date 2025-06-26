import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { IScheduledItemsRepository, ScheduledItem } from "../domain";

export type GetAllUniqueItemsByNameUseCaseOutput = ScheduledItem[];

export class GetAllUniqueItemsByNameUseCase
	implements QueryUseCase<void, GetAllUniqueItemsByNameUseCaseOutput>
{
	readonly #logger = new Logger("GetAllUniqueItemsByNameUseCase");
	constructor(
		private readonly _scheduledItemsRepository: IScheduledItemsRepository
	) {}

	async execute(): Promise<GetAllUniqueItemsByNameUseCaseOutput> {
		const items = await this._scheduledItemsRepository.findAll();
		this.#logger.debugB("get all items", { items }).log();
		return items
			.filter((item, index, self) => {
				return (
					index === self.findIndex((o) => o.name.equalTo(item.name))
				);
			})
			.sort((a, b) => a.name.value.localeCompare(b.name.value));
	}
}
