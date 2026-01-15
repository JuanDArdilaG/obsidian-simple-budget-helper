import { Account, IAccountsService } from "contexts/Accounts/domain";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { ScheduledTransaction } from "../../ScheduledTransactions/domain";
import { ReportBalance } from "../domain";
import { IReportsService } from "../domain/reports-service.interface";
import { ScheduledMonthlyReport } from "../domain/scheduled-monthly-report.entity";

type ScheduledTransactionsWithAccounts = {
	scheduledTransaction: ScheduledTransaction;
	account: Account;
	toAccount?: Account;
};

export class ReportsService implements IReportsService {
	readonly #logger = new Logger("ReportsService");
	constructor(private readonly _accountsService: IAccountsService) {}

	/**
	 * Retrieve and map accounts to items
	 * @param {ScheduledMonthlyReport} report
	 * @returns {ScheduledTransactionsWithAccounts[]} an array containing the items with its corresponding account and toAccount (if applies)
	 */
	async #addAccountsToItems(
		report: ScheduledMonthlyReport
	): Promise<ScheduledTransactionsWithAccounts[]> {
		return await Promise.all(
			report.scheduledTransactionsWithAccounts.map(
				async ({ scheduledTransaction }) => {
					const account = await this._accountsService.getByID(
						scheduledTransaction.originAccounts[0]?.accountId
					);
					const toAccount =
						scheduledTransaction.destinationAccounts[0]
							?.accountId &&
						(await this._accountsService.getByID(
							scheduledTransaction.destinationAccounts[0]
								?.accountId
						));
					return { scheduledTransaction, account, toAccount };
				}
			)
		);
	}

	#filterItemsByType(
		items: ScheduledTransactionsWithAccounts[],
		type?: "expenses" | "incomes"
	): ScheduledTransactionsWithAccounts[] {
		if (!type) return items;
		return items.filter(
			({ scheduledTransaction: item, account, toAccount }) => {
				if (
					type === "expenses" &&
					(item.operation.type.isExpense() ||
						(item.operation.type.isTransfer() &&
							account.type.isAsset() &&
							toAccount?.type.isLiability()))
				)
					return true;
				if (
					type === "incomes" &&
					(item.operation.type.isIncome() ||
						(item.operation.type.isTransfer() &&
							account.type.isLiability() &&
							toAccount?.type.isAsset()))
				)
					return true;
				return false;
			}
		);
	}

	async getTotal(
		report: ScheduledMonthlyReport,
		type?: "expenses" | "incomes"
	): Promise<ReportBalance> {
		this.#logger.debug("getTotal", { report, type });

		const items = this.#filterItemsByType(
			await this.#addAccountsToItems(report),
			type
		);

		this.#logger.debug("items", { items });

		let total = ReportBalance.zero();
		for (const {
			scheduledTransaction: item,
			account,
			toAccount,
		} of items) {
			if (item.operation.type.isIncome()) {
				total = total.plus(item.originAmount);
			} else if (item.operation.type.isExpense()) {
				total = total.plus(item.originAmount.negate());
			} else if (item.operation.type.isTransfer()) {
				if (account.type.isAsset() && toAccount?.type.isLiability()) {
					total = total.plus(item.originAmount.negate());
				} else if (
					account.type.isLiability() &&
					toAccount?.type.isAsset()
				) {
					total = total.plus(item.originAmount);
				}
				// Asset to Asset and Liability to Liability transfers are neutral (not added to total)
			}
			this.#logger.debug("updating total", { total });
		}
		this.#logger.debug("total", { total });
		return total;
	}

	async getTotalPerMonth(
		report: ScheduledMonthlyReport,
		type: "expenses" | "incomes" | "all" = "all"
	): Promise<ReportBalance> {
		this.#logger.debug("getTotalPerMonth", { report, type });

		const items = this.#filterItemsByType(
			await this.#addAccountsToItems(report),
			type !== "all" ? type : undefined
		);

		let total = ReportBalance.zero();
		for (const {
			scheduledTransaction: item,
			account,
			toAccount,
		} of items) {
			// Use the item's getPricePerMonthWithAccountTypes method to handle recurring conversions
			const monthlyPrice = item.getPricePerMonthWithAccountTypes(
				account.type,
				toAccount?.type
			);
			total = total.plus(monthlyPrice);
		}
		return total;
	}
}
