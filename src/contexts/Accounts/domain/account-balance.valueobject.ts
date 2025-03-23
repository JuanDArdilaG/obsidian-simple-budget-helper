import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { Transaction } from "contexts/Transactions/domain";
import { AccountID } from "./account-id.valueobject";
import { AccountType } from "./account-type.valueobject";

export class AccountBalance extends PriceValueObject {
	static zero(): AccountBalance {
		return new AccountBalance(0);
	}

	adjust(newBalance: AccountBalance): PriceValueObject {
		const difference = newBalance.sustract(this);
		this._value = newBalance._value;
		return difference;
	}

	adjustFromTransaction(
		id: AccountID,
		type: AccountType,
		transaction: Transaction
	) {
		this._value =
			(this.valueOf() +
				(transaction.operation.isTransfer()
					? (id.equalTo(transaction.account)
							? -1
							: (
									transaction.toAccount
										? id.equalTo(transaction.toAccount)
										: undefined
							  )
							? 1
							: 0) * transaction.amount.valueOf()
					: transaction.realAmount.valueOf())) *
			(type.isAsset() ? 1 : -1);
	}

	adjustOnTransactionDeletion(transaction: Transaction) {
		this._value = this.valueOf() - transaction.realAmount.valueOf();
	}
}
