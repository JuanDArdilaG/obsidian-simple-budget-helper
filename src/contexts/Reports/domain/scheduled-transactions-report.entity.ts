import { ItemRecurrenceInfo } from "../../ScheduledTransactions/domain";

export class ScheduledTransactionsReport {
	constructor(private readonly _recurrences: ItemRecurrenceInfo[]) {}

	get recurrences(): ItemRecurrenceInfo[] {
		return this._recurrences;
	}

	onlyIncomes(): ScheduledTransactionsReport {
		return new ScheduledTransactionsReport(
			this._recurrences.filter((t) => t.operation.type.isIncome()),
		);
	}

	onlyExpenses(): ScheduledTransactionsReport {
		return new ScheduledTransactionsReport(
			this._recurrences.filter((t) => t.operation.type.isExpense()),
		);
	}

	get totalAmount(): number {
		return this._recurrences.reduce(
			(total, rec) => total + rec.realOriginAmount.value,
			0,
		);
	}
}
