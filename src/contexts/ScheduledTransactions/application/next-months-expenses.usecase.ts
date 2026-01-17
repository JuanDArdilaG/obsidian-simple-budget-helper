import {
	NumberValueObject,
	PriceValueObject,
} from "@juandardilag/value-objects";
import { QueryUseCase } from "../../Shared/domain";
import { Logger } from "../../Shared/infrastructure/logger";
import { IScheduledTransactionsService, ItemRecurrenceInfo } from "../domain";
import { NextPendingOccurrenceUseCase } from "./next-pending-occurrence.usecase";

export class NextMonthsExpensesUseCase
	implements
		QueryUseCase<
			undefined,
			{ info: ItemRecurrenceInfo; monthAmount: PriceValueObject }[]
		>
{
	readonly #logger = new Logger("NextMonthsExpensesUseCase");

	constructor(
		private readonly nextPendingOccurrenceUseCase: NextPendingOccurrenceUseCase,
		private readonly _scheduledTransactionsService: IScheduledTransactionsService
	) {}

	async execute(): Promise<
		{ info: ItemRecurrenceInfo; monthAmount: PriceValueObject }[]
	> {
		this.#logger.debug(
			"Fetching next month's occurrences for all scheduled transactions"
		);

		const scheduledTransactions = (
			await this._scheduledTransactionsService.getAll()
		)
			.filter((transaction) => transaction.operation.type.isExpense())
			.filter((transaction) =>
				transaction.recurrencePattern.frequency
					?.toNumberOfDays()
					.greaterOrEqualThan(new NumberValueObject(31))
			);

		this.#logger.debug("Retrieved scheduled transactions", {
			length: scheduledTransactions.length,
		});

		const nextOccurrences = (
			await Promise.all(
				scheduledTransactions.map(async (scheduledTransaction) => {
					const info =
						await this.nextPendingOccurrenceUseCase.execute(
							scheduledTransaction.id
						);
					return {
						info,
						monthAmount: scheduledTransaction.pricePerMonth,
					};
				})
			)
		).filter(
			(
				info
			): info is {
				info: ItemRecurrenceInfo;
				monthAmount: PriceValueObject;
			} => info.info !== null
		);

		this.#logger.debug(
			"Retrieved next occurrences from scheduled transactions",
			{
				length: nextOccurrences.length,
			}
		);

		return nextOccurrences;
	}
}
