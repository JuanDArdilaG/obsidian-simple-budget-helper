import { Account } from "contexts/Accounts/domain";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { AccountsMap } from "../../Accounts/application/get-all-accounts.usecase";
import { ScheduledTransaction } from "../../ScheduledTransactions/domain";
import { ReportBalance } from "./report-balance.valueobject";

export class ScheduledMonthlyReport {
	static readonly #logger = new Logger("ScheduledMonthlyReport");

	readonly scheduledTransactionsWithAccounts: ScheduledTransactionsWithAccounts[];

	constructor(
		scheduledTransactions: ScheduledTransaction[],
		private readonly accounts: AccountsMap,
	) {
		this.scheduledTransactionsWithAccounts = scheduledTransactions
			.map((scheduledTransaction) => {
				const originAccount = this.accounts.get(
					scheduledTransaction.originAccounts[0].accountId.value,
				);

				if (!originAccount) {
					ScheduledMonthlyReport.#logger.debug(
						`Origin account with id ${scheduledTransaction.originAccounts[0].accountId} not found for scheduled transaction with id ${scheduledTransaction.id}`,
					);
					return {
						scheduledTransaction,
						account: undefined,
					};
				}
				let destinationAccount: Account | undefined;
				if (scheduledTransaction.destinationAccounts.length > 0) {
					destinationAccount = this.accounts.get(
						scheduledTransaction.destinationAccounts[0].accountId
							.value,
					);
					if (!destinationAccount) {
						ScheduledMonthlyReport.#logger.debug(
							`Destination account with id ${scheduledTransaction.destinationAccounts[0].accountId} not found for scheduled transaction with id ${scheduledTransaction.id}`,
						);
					}
				}
				return {
					scheduledTransaction,
					account: originAccount,
					toAccount: destinationAccount,
				};
			})
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
						account.type.value,
						toAccount?.type.value,
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
