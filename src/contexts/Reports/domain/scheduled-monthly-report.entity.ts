import { Account } from "contexts/Accounts/domain";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { ScheduledTransaction } from "../../ScheduledTransactions/domain";
import { ReportBalance } from "./report-balance.valueobject";

export class ScheduledMonthlyReport {
	static readonly #logger = new Logger("ScheduledMonthlyReport");

	readonly scheduledTransactionsWithAccounts: ScheduledTransactionsWithAccounts[];

	constructor(
		scheduledTransactions: ScheduledTransaction[],
		private readonly accounts: Account[],
	) {
		this.scheduledTransactionsWithAccounts = scheduledTransactions
			.map((scheduledTransaction) => ({
				scheduledTransaction,
				account: scheduledTransaction.originAccounts[0].account,
				toAccount:
					scheduledTransaction.destinationAccounts.length > 0
						? scheduledTransaction.destinationAccounts[0].account
						: undefined,
			}))
			.filter(
				(item) => !!item.account,
			) as ScheduledTransactionsWithAccounts[];
	}

	onlyExpenses(): ScheduledMonthlyReport {
		return new ScheduledMonthlyReport(
			this.scheduledTransactionsWithAccounts
				.filter(({ scheduledTransaction }) =>
					scheduledTransaction.operation.type.isExpense(),
				)
				.map(({ scheduledTransaction }) => scheduledTransaction),
			this.accounts,
		);
	}

	onlyIncomes(): ScheduledMonthlyReport {
		return new ScheduledMonthlyReport(
			this.scheduledTransactionsWithAccounts
				.filter(({ scheduledTransaction }) =>
					scheduledTransaction.operation.type.isIncome(),
				)
				.map(({ scheduledTransaction }) => scheduledTransaction),
			this.accounts,
		);
	}

	onlyInfiniteRecurrent(): ScheduledMonthlyReport {
		return new ScheduledMonthlyReport(
			this.scheduledTransactionsWithAccounts
				.filter(
					({ scheduledTransaction }) =>
						scheduledTransaction.recurrencePattern
							.totalOccurrences === -1,
				)
				.map(({ scheduledTransaction }) => scheduledTransaction),
			this.accounts,
		);
	}

	onlyFiniteRecurrent(): ScheduledMonthlyReport {
		return new ScheduledMonthlyReport(
			this.scheduledTransactionsWithAccounts
				.filter(
					({ scheduledTransaction }) =>
						scheduledTransaction.recurrencePattern
							.totalOccurrences !== -1,
				)
				.map(({ scheduledTransaction }) => scheduledTransaction),
			this.accounts,
		);
	}

	/**
	 * Returns all items that are expenses (excluding transfers)
	 */
	getExpenseItems(): ScheduledTransaction[] {
		return this.scheduledTransactionsWithAccounts
			.filter(({ scheduledTransaction }) =>
				scheduledTransaction.operation.type.isExpense(),
			)
			.map(({ scheduledTransaction }) => scheduledTransaction);
	}

	/**
	 * Returns all items that are incomes (excluding transfers)
	 */
	getIncomeItems(): ScheduledTransaction[] {
		return this.scheduledTransactionsWithAccounts
			.filter(({ scheduledTransaction }) =>
				scheduledTransaction.operation.type.isIncome(),
			)
			.map(({ scheduledTransaction }) => scheduledTransaction);
	}

	/**
	 * Returns all transfer items
	 */
	getTransferItems(): ScheduledTransaction[] {
		return this.scheduledTransactionsWithAccounts
			.filter(({ scheduledTransaction }) =>
				scheduledTransaction.operation.type.isTransfer(),
			)
			.map(({ scheduledTransaction }) => scheduledTransaction);
	}

	/**
	 * Returns infinite recurrent items
	 */
	getInfiniteRecurrentItems(): ScheduledTransaction[] {
		return this.scheduledTransactionsWithAccounts
			.filter(
				({ scheduledTransaction }) =>
					scheduledTransaction.recurrencePattern.totalOccurrences ===
					-1,
			)
			.map(({ scheduledTransaction }) => scheduledTransaction);
	}

	/**
	 * Returns finite recurrent items
	 */
	getFiniteRecurrentItems(): ScheduledTransaction[] {
		return this.scheduledTransactionsWithAccounts
			.filter(
				({ scheduledTransaction }) =>
					scheduledTransaction.recurrencePattern.totalOccurrences !==
					-1,
			)
			.map(({ scheduledTransaction }) => scheduledTransaction);
	}

	getTotal(): ReportBalance {
		return this.scheduledTransactionsWithAccounts.reduce(
			(total, { scheduledTransaction }) =>
				total.plus(scheduledTransaction.realPrice),
			ReportBalance.zero(),
		);
	}

	getTotalPerMonth(): ReportBalance {
		return this.scheduledTransactionsWithAccounts.reduce(
			(total, { scheduledTransaction, account, toAccount }) =>
				total.plus(
					scheduledTransaction.getPricePerMonthWithAccountTypes(
						account.type,
						toAccount?.type,
					),
				),
			ReportBalance.zero(),
		);
	}
}

export type ScheduledTransactionsWithAccounts = {
	scheduledTransaction: ScheduledTransaction;
	account: Account;
	toAccount?: Account;
};
