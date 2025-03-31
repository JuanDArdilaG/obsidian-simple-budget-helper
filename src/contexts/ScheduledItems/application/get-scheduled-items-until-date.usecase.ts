import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { Logger } from "contexts/Shared/infrastructure/logger";
import {
	ScheduledItemNextDate,
	ScheduledItem,
	ScheduledItemsCriteria,
	IScheduledItemsRepository,
} from "../domain";
import { NumberValueObject } from "@juandardilag/value-objects/NumberValueObject";

export type GetScheduledItemsUntilDateUseCaseInput = ScheduledItemNextDate;
export type GetScheduledItemsUntilDateUseCaseOutput = {
	item: ScheduledItem;
	n: NumberValueObject;
}[];

export class GetScheduledItemsUntilDateUseCase
	implements
		QueryUseCase<
			GetScheduledItemsUntilDateUseCaseInput,
			GetScheduledItemsUntilDateUseCaseOutput
		>
{
	#logger = new Logger("GetScheduledItemsUntilDateUseCase");
	constructor(private _scheduledItemsRepository: IScheduledItemsRepository) {}

	async execute(
		to: GetScheduledItemsUntilDateUseCaseInput
	): Promise<GetScheduledItemsUntilDateUseCaseOutput> {
		const betweenDatesCriteria = new ScheduledItemsCriteria().where(
			"date",
			to.valueOf(),
			"LESS_THAN_OR_EQUAL"
		);
		let items = (await this._scheduledItemsRepository.findByCriteria(
			betweenDatesCriteria
		)) as ScheduledItem[];

		this.#logger
			.debugB("item from repository", { items: [...items] })
			.log();

		const res: {
			item: ScheduledItem;
			n: NumberValueObject;
		}[][] = [];
		items.forEach((item) => {
			res.push(item.createScheduledItemsUntilDate(to));
		});

		this.#logger.debugB("items untils date", { items: [...items] }).log();

		return res.flat().sort((rA, rB) => rA.item.date.compare(rB.item.date));
	}
}
