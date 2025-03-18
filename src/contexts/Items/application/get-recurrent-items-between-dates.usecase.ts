import { DateValueObject } from "@juandardilag/value-objects/DateValueObject";
import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { RecurrentItem } from "../domain/recurrent-item/recurrent-item.entity";
import { InvalidArgumentError } from "contexts/Shared/domain/errors/invalid-argument.error";

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
		this.onlyRecurrent().items.forEach((item) => {
			const a = item.getRecurrenceDatesForNDays(n);
			if (a.length > 0) {
				items.push({ item, dates: a });
			}
		});
	}
}
