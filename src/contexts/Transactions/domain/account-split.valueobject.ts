import { NumberValueObject } from "@juandardilag/value-objects";
import { Account } from "../../Accounts/domain";
import { TransactionAmount } from "./transaction-amount.valueobject";

export interface AccountSplitPrimitives {
	[key: string]: string | number;
	accountId: string;
	amount: number;
}

export class AccountSplit {
	constructor(
		private readonly _account: Account,
		private readonly _amount: TransactionAmount,
	) {}

	get account(): Account {
		return this._account;
	}

	get amount(): TransactionAmount {
		return this._amount;
	}

	equalTo(other: AccountSplit): boolean {
		return (
			this.account.id.equalTo(other.account.id) &&
			this.amount.equalTo(other.amount)
		);
	}

	toString(): string {
		return `${this.account.name.value} - ${this.amount.toString()}`;
	}

	toPrimitives(): AccountSplitPrimitives {
		return {
			accountId: this.account.id.value,
			amount: this.amount.value,
		};
	}

	static fromPrimitives(
		account: Account,
		primitives: AccountSplitPrimitives,
	): AccountSplit {
		return new AccountSplit(
			account,
			new TransactionAmount(primitives.amount),
		);
	}

	static totalAmount(
		splits: AccountSplit[],
		exchangeRate?: NumberValueObject,
	): TransactionAmount {
		return new TransactionAmount(
			splits.reduce(
				(sum, split) =>
					sum +
					split.amount.times(exchangeRate ?? new NumberValueObject(1))
						.value,
				0,
			),
		);
	}
}
