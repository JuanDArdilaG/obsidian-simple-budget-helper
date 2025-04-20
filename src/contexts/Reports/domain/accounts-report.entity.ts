import { Account } from "contexts/Accounts/domain";
import { ReportBalance } from "./report-balance.valueobject";

export class AccountsReport {
	constructor(private _accounts: Account[]) {}

	getTotalForAssets(): ReportBalance {
		return this._accounts
			.filter((acc) => acc.type.isAsset())
			.reduce(
				(total, acc) => total.plus(acc.balance.value),
				ReportBalance.zero()
			);
	}

	getTotalForLiabilites(): ReportBalance {
		return this._accounts
			.filter((acc) => acc.type.isLiability())
			.reduce(
				(total, acc) => total.plus(acc.balance.value),
				ReportBalance.zero()
			);
	}

	getTotal(): ReportBalance {
		return this.getTotalForAssets().sustract(this.getTotalForLiabilites());
	}
}
