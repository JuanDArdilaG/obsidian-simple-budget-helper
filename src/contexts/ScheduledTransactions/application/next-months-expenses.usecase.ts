import {
	DateValueObject,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { QueryUseCase } from "../../Shared/domain";
import { Logger } from "../../Shared/infrastructure/logger";
import { IScheduledTransactionsService, ItemRecurrenceInfo } from "../domain";
import { NextPendingOccurrenceUseCase } from "./next-pending-occurrence.usecase";

export class NextMonthsExpensesUseCase
	implements QueryUseCase<undefined, ItemRecurrenceInfo[]>
{
	readonly #logger = new Logger("NextMonthsExpensesUseCase");

	constructor(
		private readonly nextPendingOccurrenceUseCase: NextPendingOccurrenceUseCase,
		private readonly _scheduledTransactionsService: IScheduledTransactionsService
	) {}

	async execute(): Promise<ItemRecurrenceInfo[]> {
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
					return await this.nextPendingOccurrenceUseCase.execute(
						scheduledTransaction.id
					);
				})
			)
		).filter((info): info is ItemRecurrenceInfo => info !== null);

		this.#logger.debug(
			"Retrieved next occurrences from scheduled transactions",
			{
				length: nextOccurrences.length,
			}
		);

		const nextMonthFirstDay = new Date();
		nextMonthFirstDay.setDate(1);
		nextMonthFirstDay.setMonth(nextMonthFirstDay.getMonth() + 1);
		nextMonthFirstDay.setHours(0, 0, 0, 0);

		this.#logger.debug("Filtering occurrences", {
			nextMonthFirstDay,
		});

		const nextMonthOccurrences = nextOccurrences.filter(
			({ date }) =>
				date.compareTo(new DateValueObject(nextMonthFirstDay)) >= 0
		);

		this.#logger.debug("Found occurrences in the next month", {
			length: nextMonthOccurrences.length,
		});

		return nextMonthOccurrences;
	}
}
