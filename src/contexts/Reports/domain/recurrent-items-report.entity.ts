import { RecurrentItem } from "contexts/Items";
import { ItemsReport } from "./items-report.entity";
import { ReportBalance } from "./report-balance.valueobject";
import { Account } from "contexts/Accounts";
import { Logger } from "contexts/Shared";

const logger = new Logger("RecurrentItemsReport").off();

export class RecurrentItemsReport extends ItemsReport {
	constructor(private _items: RecurrentItem[]) {
		super();
	}

	sortedByDate(direction: "asc" | "desc" = "asc"): RecurrentItemsReport {
		return new RecurrentItemsReport(
			this._items.sort((a, b) =>
				direction === "asc"
					? a.nextDate.compare(b.nextDate)
					: b.nextDate.compare(a.nextDate)
			)
		);
	}

	getTotal(): ReportBalance {
		return this._items.reduce(
			(total, item) => total.plus(item.realPrice),
			ReportBalance.zero()
		);
	}

	withAccumulatedBalance(accounts: Account[]): {
		item: RecurrentItem;
		balance: ReportBalance;
		prevBalance: ReportBalance;
	}[] {
		if (!this._items.length) return [];

		const sortedReport = this.sortedByDate("asc");

		let accumulated: Record<string, ReportBalance> = {};
		return sortedReport._items
			.map((item) => {
				const itemsWithBalance: {
					item: RecurrentItem;
					balance: ReportBalance;
					prevBalance: ReportBalance;
				}[] = [];
				if (!accumulated[item.account.value])
					accumulated[item.account.value] =
						accounts.find((acc) => acc.id.equalTo(item.account))
							?.balance ?? ReportBalance.zero();
				const prevBalance = accumulated[item.account.value];
				accumulated[item.account.value] = accumulated[
					item.account.value
				].plus(item.getRealPriceForAccount(item.account));
				logger.debug(
					"accumulating transaction",
					{
						transaction: item.toPrimitives(),
						realAmount: item
							.getRealPriceForAccount(item.account)
							.valueOf(),
						accumulated,
					},
					{ on: false }
				);
				itemsWithBalance.push({
					item,
					balance: accumulated[item.account.value],
					prevBalance,
				});
				if (item.operation.isTransfer() && item.toAccount) {
					if (!accumulated[item.toAccount.value])
						accumulated[item.toAccount.value] =
							accounts.find((acc) => acc.id.equalTo(item.account))
								?.balance ?? ReportBalance.zero();
					const prevBalance = accumulated[item.toAccount.value];
					accumulated[item.toAccount.value] = accumulated[
						item.toAccount.value
					].plus(item.getRealPriceForAccount(item.toAccount));
					itemsWithBalance.push({
						item: RecurrentItem.copyWithNegativeAmount(item),
						balance: accumulated[item.toAccount.value],
						prevBalance,
					});
				}
				return itemsWithBalance;
			})
			.flat();
	}
}
