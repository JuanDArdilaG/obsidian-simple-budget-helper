import { NumberValueObject } from "@juandardilag/value-objects";
import { Nanoid } from "../../Shared/domain";
import { TransactionAmount } from "./transaction-amount.valueobject";

export interface AccountSplitPrimitives {
	accountId: string;
	amount: number;
}

export class AccountSplit {
	constructor(
		private readonly _accountId: Nanoid,
		private readonly _amount: TransactionAmount,
	) {}

	get accountId(): Nanoid {
		return this._accountId;
	}

	get amount(): TransactionAmount {
		return this._amount;
	}

	equalTo(other: AccountSplit): boolean {
		return (
			this.accountId.value === other.accountId.value &&
			this.amount.equalTo(other.amount)
		);
	}

	toString(): string {
		return `${this.accountId.value} - ${this.amount.toString()}`;
	}

	toPrimitives(): AccountSplitPrimitives {
		return {
			accountId: this.accountId.value,
			amount: this.amount.value,
		};
	}

	static fromPrimitives(primitives: AccountSplitPrimitives): AccountSplit {
		return new AccountSplit(
			new Nanoid(primitives.accountId),
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
