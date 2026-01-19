import { Account } from "contexts/Accounts/domain";
import { ReportBalance } from "./report-balance.valueobject";

export class AccountsReport {
	constructor(private readonly _accounts: Account[]) {}

	getTotalForAssets(): ReportBalance {
		return this._accounts
			.filter((acc) => acc.type.isAsset())
			.reduce(
				(total, acc) =>
					total.plus(
						acc.defaultCurrencyBalance?.value ?? acc.balance.value,
					),
				ReportBalance.zero(),
			);
	}

	getTotalForLiabilities(): ReportBalance {
		return this._accounts
			.filter((acc) => acc.type.isLiability())
			.reduce(
				(total, acc) =>
					total.plus(
						acc.defaultCurrencyBalance?.value ?? acc.balance.value,
					),
				ReportBalance.zero(),
			);
	}

	getTotal(): ReportBalance {
		return this.getTotalForAssets().subtract(this.getTotalForLiabilities());
	}
}
