import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { Logger } from "contexts/Shared/infrastructure/logger";
import {
	DateValueObject,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { Item, IItemsRepository } from "contexts/Items/domain";
import { ItemsCriteria } from "../domain/ItemsCriteria";

export type GetItemsUntilDateUseCaseInput = DateValueObject;
export type GetItemsUntilDateUseCaseOutput = {
	item: Item;
	n: NumberValueObject;
}[];

export class GetItemsUntilDateUseCase
	implements
		QueryUseCase<
			GetItemsUntilDateUseCaseInput,
			GetItemsUntilDateUseCaseOutput
		>
{
	readonly #logger = new Logger("GetItemsUntilDateUseCase");
	constructor(private readonly _itemsRepository: IItemsRepository) {}

	async execute(
		to: GetItemsUntilDateUseCaseInput
	): Promise<GetItemsUntilDateUseCaseOutput> {
		this.#logger.debug("execute", { to });
		const betweenDatesCriteria = new ItemsCriteria().where(
			"date",
			to.value,
			"LESS_THAN_OR_EQUAL"
		);
		const items = await this._itemsRepository.findByCriteria(
			betweenDatesCriteria
		);

		this.#logger.debug("item from repository", {
			betweenDatesCriteria,
			items: [...items],
		});

		const res: {
			item: Item;
			n: NumberValueObject;
		}[][] = [];

		items.forEach((item) => {
			res.push(item.createItemsUntilDate(to));
		});

		const itemsRes = res
			.flat()
			.sort((rA, rB) => rA.item.date.compare(rB.item.date));

		this.#logger.debug("items untils date", {
			res,
			items: [...itemsRes],
		});

		return itemsRes;
	}
}
