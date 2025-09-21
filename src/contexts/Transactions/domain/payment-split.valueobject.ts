import { AccountID } from "contexts/Accounts/domain";
import { TransactionAmount } from "./transaction-amount.valueobject";

export interface PaymentSplitPrimitives {
	[key: string]: string | number;
	accountId: string;
	amount: number;
}

export class PaymentSplit {
	constructor(
		private readonly _accountId: AccountID,
		private readonly _amount: TransactionAmount
	) {
		this.validate();
	}

	validate(): void {
		// In this case, validation is handled by the composed value objects (AccountID, TransactionAmount)
	}

	get accountId(): AccountID {
		return this._accountId;
	}

	get amount(): TransactionAmount {
		return this._amount;
	}

	equalTo(other: PaymentSplit): boolean {
		return (
			this.accountId.equalTo(other.accountId) &&
			this.amount.equalTo(other.amount)
		);
	}

	toString(): string {
		return `${this.accountId.value} - ${this.amount.toString()}`;
	}

	toPrimitives(): PaymentSplitPrimitives {
		return {
			accountId: this.accountId.value,
			amount: this.amount.value,
		};
	}

	static fromPrimitives(primitives: PaymentSplitPrimitives): PaymentSplit {
		return new PaymentSplit(
			new AccountID(primitives.accountId),
			new TransactionAmount(primitives.amount)
		);
	}

	static totalAmount(splits: PaymentSplit[]): TransactionAmount {
		return new TransactionAmount(
			splits.reduce((sum, split) => sum + split.amount.value, 0)
		);
	}
}
