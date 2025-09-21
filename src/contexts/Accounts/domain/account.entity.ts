import {
	DateValueObject,
	NumberValueObject,
	PriceValueObject,
} from "@juandardilag/value-objects";
import {
	AccountBalance,
	AccountID,
	AccountName,
	AccountType,
	AccountTypeType,
} from "contexts/Accounts/domain";
import { Entity } from "contexts/Shared/domain/entity.abstract";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { Transaction } from "contexts/Transactions/domain";

const logger: Logger = new Logger("Account");

export class Account extends Entity<AccountID, AccountPrimitives> {
	constructor(
		id: AccountID,
		private readonly _type: AccountType,
		private readonly _name: AccountName,
		private _balance: AccountBalance,
		updatedAt: DateValueObject
	) {
		super(id, updatedAt);
	}

	static create(type: AccountType, name: AccountName): Account {
		return new Account(
			AccountID.generate(),
			type,
			name,
			AccountBalance.zero(),
			DateValueObject.createNowDate()
		);
	}

	copy(): Account {
		return new Account(
			this._id,
			this._type,
			this._name,
			this._balance,
			this._updatedAt
		);
	}

	get type(): AccountType {
		return this._type;
	}

	get name(): AccountName {
		return this._name;
	}

	get balance(): AccountBalance {
		return this._balance;
	}

	get realBalance(): PriceValueObject {
		return this._balance.value.times(
			new NumberValueObject(this._type.isAsset() ? 1 : -1)
		);
	}

	updateBalance(balance: AccountBalance) {
		this._balance = balance;
		this.updateTimestamp();
	}

	adjustFromTransaction(transaction: Transaction) {
		logger.debug("adjustFromTransaction", {
			id: this._id.value,
			type: this._type.value,
			transaction: transaction.toPrimitives(),
			balance: this._balance.value,
		});

		// Get the base amount from the transaction
		const baseAmount = transaction.getRealAmountForAccount(this._id);

		// For liability accounts, we need to invert the sign
		// because liability accounts have opposite accounting rules
		const adjustedAmount = this._type.isLiability()
			? baseAmount.times(new NumberValueObject(-1))
			: baseAmount;

		this._balance = this._balance.plus(adjustedAmount);
		this.updateTimestamp();
	}

	adjustOnTransactionUpdate(
		prevTransaction: Transaction,
		transaction: Transaction
	) {
		const prevAmount = this._type.isLiability()
			? prevTransaction
					.getRealAmountForAccount(this.id)
					.times(new NumberValueObject(-1))
			: prevTransaction.getRealAmountForAccount(this.id);

		const newAmount = this._type.isLiability()
			? transaction
					.getRealAmountForAccount(this.id)
					.times(new NumberValueObject(-1))
			: transaction.getRealAmountForAccount(this.id);

		if (prevAmount.equalTo(newAmount)) return;

		this._balance = this._balance.sustract(prevAmount).plus(newAmount);
		this.updateTimestamp();
	}

	adjustOnTransactionDeletion(transaction: Transaction) {
		const amount = this._type.isLiability()
			? transaction
					.getRealAmountForAccount(this.id)
					.times(new NumberValueObject(-1))
			: transaction.getRealAmountForAccount(this.id);

		this._balance = this._balance.sustract(amount);
		this.updateTimestamp();
	}

	toPrimitives(): AccountPrimitives {
		return {
			id: this._id.value,
			type: this._type.value,
			name: this._name.value,
			balance: this._balance.value.value,
			updatedAt: this._updatedAt.toISOString(),
		};
	}

	static fromPrimitives({
		id,
		type,
		name,
		balance,
		updatedAt,
	}: AccountPrimitives): Account {
		const account = new Account(
			new AccountID(id),
			new AccountType(type),
			new AccountName(name),
			new AccountBalance(new PriceValueObject(balance)),
			updatedAt
				? new DateValueObject(new Date(updatedAt))
				: DateValueObject.createNowDate()
		);
		return account;
	}

	static emptyPrimitives(): AccountPrimitives {
		return {
			id: "",
			type: "asset",
			name: "",
			balance: 0,
			updatedAt: new Date().toISOString(),
		};
	}
}

export type AccountPrimitives = {
	id: string;
	type: AccountTypeType;
	name: string;
	balance: number;
	updatedAt: string;
};
