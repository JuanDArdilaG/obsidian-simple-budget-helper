import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { Logger } from "contexts/Shared/infrastructure/logger";
import {
	DateValueObject,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { ItemRecurrenceModification } from "contexts/Items/domain";
import { IItemsService } from "../domain/items-service.interface";

export type GetItemsUntilDateUseCaseInput = DateValueObject;
export type ItemRecurrenceModificationWithN = {
	recurrence: ItemRecurrenceModification;
	n: NumberValueObject;
};

export type GetItemsUntilDateUseCaseOutput = ItemRecurrenceModificationWithN[];

export class GetItemsUntilDateUseCase
	implements
		QueryUseCase<
			GetItemsUntilDateUseCaseInput,
			GetItemsUntilDateUseCaseOutput
		>
{
	readonly #logger = new Logger("GetItemsUntilDateUseCase");
	constructor(private readonly _itemsService: IItemsService) {}

	async execute(
		to: GetItemsUntilDateUseCaseInput
	): Promise<GetItemsUntilDateUseCaseOutput> {
		this.#logger.debug("execute", { to });
		const items = await this._itemsService.getAll();

		this.#logger.debug("item from repository", {
			items: [...items],
		});

		const res: {
			recurrence: ItemRecurrenceModification;
			n: NumberValueObject;
		}[][] = [];

		items.forEach((item) => {
			res.push(item.getRecurrencesUntilDate(to));
		});

		const itemsRes = res
			.flat()
			.sort((rA, rB) => rA.recurrence.date.compareTo(rB.recurrence.date));

		this.#logger.debug("items until date", {
			res,
			items: [...itemsRes],
		});

		return itemsRes;
	}
}
