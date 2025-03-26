import { DateValueObject } from "@juandardilag/value-objects/DateValueObject";
import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { RecurrentItem } from "../domain/RecurrentItem/recurrent-item.entity";
import { IItemsRepository } from "../domain/item-repository.interface";
import { RecurrentItemsCriteria } from "../domain/RecurrentItem/recurrent-items.criteria";
import { Logger } from "contexts/Shared";
import { RecurrentItemNextDate } from "../domain";

const logger = new Logger("GetRecurrentItemsUntilDateUseCase").off();

export type GetRecurrentItemsUntilDateUseCaseInput = RecurrentItemNextDate;
export type GetRecurrentItemsUntilDateUseCaseOutput = RecurrentItem[];

export class GetRecurrentItemsUntilDateUseCase
	implements
		QueryUseCase<
			GetRecurrentItemsUntilDateUseCaseInput,
			GetRecurrentItemsUntilDateUseCaseOutput
		>
{
	constructor(private _itemsRepository: IItemsRepository) {}

	async execute(
		to: GetRecurrentItemsUntilDateUseCaseInput
	): Promise<GetRecurrentItemsUntilDateUseCaseOutput> {
		const betweenDatesCriteria = new RecurrentItemsCriteria().where(
			"nextDate",
			to.valueOf(),
			"LESS_THAN_OR_EQUAL"
		);
		let items = (await this._itemsRepository.findByCriteria(
			betweenDatesCriteria
		)) as RecurrentItem[];

		logger.debugB("item from repository", { items: [...items] }).log();

		items = items
			.map((item) => {
				return item.createRecurretItemsUntilDate(to);
			})
			.flat()
			.sort((itemA, itemB) => itemA.nextDate.compare(itemB.nextDate));

		logger.debugB("items untils date", { items: [...items] }).log();

		return items;
	}
}
