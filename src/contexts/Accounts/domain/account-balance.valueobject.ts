import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { Transaction } from "contexts/Transactions/domain";

export class AccountBalance extends PriceValueObject {
	static zero(): AccountBalance {
		return new AccountBalance(0);
	}

	adjust(newBalance: AccountBalance): PriceValueObject {
		const difference = newBalance.sustract(this);
		this._value = newBalance._value;
		return difference;
	}

	adjustOnTransactionDeletion(transaction: Transaction) {
		this._value = this.valueOf() - transaction.realAmount.valueOf();
	}
}
