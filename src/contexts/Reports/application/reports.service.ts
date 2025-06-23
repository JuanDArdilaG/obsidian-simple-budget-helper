import { Account, IAccountsService } from "contexts/Accounts/domain";
import { Item } from "contexts/Items/domain";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { ItemsReport, ReportBalance } from "../domain";
import { IReportsService } from "../domain/reports-service.interface";

type ItemsWithAccounts = {
	item: Item;
	account: Account;
	toAccount?: Account;
};

export class ReportsService implements IReportsService {
	readonly #logger = new Logger("ReportsService");
	constructor(private readonly _accountsService: IAccountsService) {}

	/**
	 * Retrieve and map accounts to items
	 * @param {ItemsReport} report
	 * @returns {ItemsWithAccounts[]} an array containing the items with its corresponding account and toAccount (if applies)
	 */
	async #addAccountsToItems(
		report: ItemsReport
	): Promise<ItemsWithAccounts[]> {
		return await Promise.all(
			report.items.map(async (item) => {
				const account = await this._accountsService.getByID(
					item.operation.account
				);
				const toAccount =
					item.operation.toAccount &&
					(await this._accountsService.getByID(
						item.operation.toAccount
					));
				return { item, account, toAccount };
			})
		);
	}

	#filterItemsByType(
		items: ItemsWithAccounts[],
		type?: "expenses" | "incomes"
	): ItemsWithAccounts[] {
		if (!type) return items;
		return items.filter(({ item, account, toAccount }) => {
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
		});
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
		for (const { item, account, toAccount } of items) {
			if (item.operation.type.isTransfer()) {
				// Handle transfers based on account types
				if (account.type.isAsset() && toAccount?.type.isLiability()) {
					total = total.plus(item.price.negate());
				} else if (
					account.type.isLiability() &&
					toAccount?.type.isAsset()
				) {
					total = total.plus(item.price);
				}
				// Asset to Asset and Liability to Liability transfers are neutral (not added to total)
			} else {
				// Handle income and expense operations
				total = total.plus(item.realPrice);
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
		for (const { item, account, toAccount } of items) {
			if (item.operation.type.isTransfer()) {
				// Handle transfers based on account types
				if (account.type.isAsset() && toAccount?.type.isLiability()) {
					total = total.plus(item.pricePerMonth.negate());
				} else if (
					account.type.isLiability() &&
					toAccount?.type.isAsset()
				) {
					total = total.plus(item.pricePerMonth);
				}
				// Asset to Asset and Liability to Liability transfers are neutral (not added to total)
			} else {
				// Handle income and expense operations
				total = total.plus(item.pricePerMonth);
			}
		}
		return total;
	}
}
