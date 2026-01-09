import { Account, AccountID, IAccountsService } from "contexts/Accounts/domain";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { ScheduledTransaction } from "../../ScheduledTransactions/domain";
import { ReportBalance } from "../domain";
import { IReportsService } from "../domain/reports-service.interface";
import { ItemsReport } from "../domain/scheduled-transactions-report.entity";

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
	 * @param {ItemsReport} report
	 * @returns {ScheduledTransactionsWithAccounts[]} an array containing the items with its corresponding account and toAccount (if applies)
	 */
	async #addAccountsToItems(
		report: ItemsReport
	): Promise<ScheduledTransactionsWithAccounts[]> {
		return await Promise.all(
			report.items.map(async (scheduledTransaction) => {
				const account = await this._accountsService.getByID(
					scheduledTransaction.fromSplits[0]?.accountId
				);
				const toAccount =
					scheduledTransaction.toSplits[0]?.accountId &&
					(await this._accountsService.getByID(
						scheduledTransaction.toSplits[0]?.accountId
					));
				return { scheduledTransaction, account, toAccount };
			})
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
		report: ItemsReport,
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
				total = total.plus(item.fromAmount);
			} else if (item.operation.type.isExpense()) {
				total = total.plus(item.fromAmount.negate());
			} else if (item.operation.type.isTransfer()) {
				if (account.type.isAsset() && toAccount?.type.isLiability()) {
					total = total.plus(item.fromAmount.negate());
				} else if (
					account.type.isLiability() &&
					toAccount?.type.isAsset()
				) {
					total = total.plus(item.fromAmount);
				}
				// Asset to Asset and Liability to Liability transfers are neutral (not added to total)
			}
			this.#logger.debug("updating total", { total });
		}
		this.#logger.debug("total", { total });
		return total;
	}

	async getTotalPerMonth(
		report: ItemsReport,
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
			// Create account type lookup function
			const accountTypeLookup = (id: AccountID) => {
				if (id.value === account.id.value) return account.type;
				if (toAccount && id.value === toAccount.id.value)
					return toAccount.type;
				throw new Error(`Account ${id.value} not found in lookup`);
			};

			// Use the item's getPricePerMonthWithAccountTypes method to handle recurring conversions
			const monthlyPrice =
				item.getPricePerMonthWithAccountTypes(accountTypeLookup);
			total = total.plus(monthlyPrice);
		}
		return total;
	}
}
