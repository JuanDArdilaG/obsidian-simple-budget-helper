import {
	DateValueObject,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { Logger } from "contexts/Shared/infrastructure/logger";
import {
	IRecurrenceModificationsService,
	IScheduledTransactionsService,
	ItemRecurrenceInfo,
	RecurrenceModificationState,
} from "../domain";

export type GetScheduledTransactionsUntilDateUseCaseResponse =
	ItemRecurrenceInfo[];

export class GetScheduledTransactionsUntilDateUseCase
	implements
		QueryUseCase<
			DateValueObject,
			GetScheduledTransactionsUntilDateUseCaseResponse
		>
{
	readonly #logger = new Logger("GetScheduledTransactionsUntilDateUse");
	constructor(
		private readonly _scheduledTransactionsService: IScheduledTransactionsService,
		private readonly _recurrenceModificationsService: IRecurrenceModificationsService
	) {}

	async execute(
		to: DateValueObject
	): Promise<GetScheduledTransactionsUntilDateUseCaseResponse> {
		this.#logger.debug("execute", { to });
		const scheduledTransactions =
			await this._scheduledTransactionsService.getAll();

		this.#logger.debug("scheduledTransactions from repository", {
			items: [...scheduledTransactions],
		});

		let recurrences: ItemRecurrenceInfo[] = [];

		for (const scheduledTransaction of scheduledTransactions) {
			const modifications =
				await this._recurrenceModificationsService.getByScheduledItemId(
					scheduledTransaction.id
				);
			recurrences.push(
				...scheduledTransaction.recurrencePattern
					.generateOccurrencesUntil(to)
					// add index to occurrences
					.map((date, index) => ({ date, index }))
					.filter(({ date }) => {
						const modification = modifications.find(
							(mod) => mod.originalDate.compareTo(date) === 0
						);
						// Exclude skipped/deleted/completed occurrences
						if (modification) {
							return (
								modification.state ===
								RecurrenceModificationState.PENDING
							);
						}
						return true;
					})
					.map(({ date, index }) => {
						// Check for modification on this date
						const modification = modifications.find(
							(mod) => mod.originalDate.compareTo(date) === 0
						);
						let recurrenceInfo: ItemRecurrenceInfo;
						if (modification) {
							recurrenceInfo =
								ItemRecurrenceInfo.fromModification(
									scheduledTransaction,
									modification
								);
						} else {
							recurrenceInfo =
								ItemRecurrenceInfo.fromScheduledTransaction(
									scheduledTransaction,
									new NumberValueObject(index),
									date
								);
						}
						return recurrenceInfo;
					})
			);
		}

		recurrences = recurrences
			.flat()
			.sort((rA, rB) => rA.date.compareTo(rB.date));

		this.#logger.debug("items until date", {
			recurrences,
		});

		return recurrences;
	}
}
