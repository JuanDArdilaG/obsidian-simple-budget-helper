import { DateValueObject } from "@juandardilag/value-objects/DateValueObject";
import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { RecurrentItem } from "../domain/RecurrentItem/recurrent-item.entity";
import { InvalidArgumentError } from "contexts/Shared/domain/errors/invalid-argument.error";
import { IItemsRepository } from "../domain/item-repository.interface";
import { RecurrentItemsCriteria } from "../domain/RecurrentItem/recurrent-items.criteria";
import { RecurrentItemNextDate } from "../domain/RecurrentItem/recurrent-item-nextdate.valueobject";

export type GetRecurrentItemsBetweenDatesUseCaseInput = {
	from: DateValueObject;
	to: DateValueObject;
};
export type GetRecurrentItemsBetweenDatesUseCaseOutput = RecurrentItem[];

export class GetRecurrentItemsBetweenDatesUseCase
	implements
		QueryUseCase<
			GetRecurrentItemsBetweenDatesUseCaseInput,
			GetRecurrentItemsBetweenDatesUseCaseOutput
		>
{
	constructor(private _itemsRepository: IItemsRepository) {}

	async execute({
		from,
		to,
	}: GetRecurrentItemsBetweenDatesUseCaseInput): Promise<GetRecurrentItemsBetweenDatesUseCaseOutput> {
		if (to.isLessThan(from))
			throw new InvalidArgumentError(
				"from/to",
				`${from}/${to}`,
				"from must be a date before to"
			);
		const betweenDatesCriteria = new RecurrentItemsCriteria().where(
			"nextDate",
			[from, to],
			"BETWEEN"
		);
		const items = (await this._itemsRepository.findByCriteria(
			betweenDatesCriteria
		)) as RecurrentItem[];

		items.map((item) => {
			items.push(
				...item.createRecurretItemsBetweenDates(
					new RecurrentItemNextDate(from.valueOf()),
					new RecurrentItemNextDate(to.valueOf())
				)
			);
		});

		return items;
	}
}
