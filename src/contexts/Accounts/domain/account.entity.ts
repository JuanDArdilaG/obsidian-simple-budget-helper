import {
	DateValueObject,
	NumberValueObject,
	PriceValueObject,
	StringValueObject,
} from "@juandardilag/value-objects";
import {
	AccountBalance,
	AccountType,
	AccountTypeType,
} from "contexts/Accounts/domain";
import { Entity } from "contexts/Shared/domain/entity.abstract";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { Transaction } from "contexts/Transactions/domain";
import { ExchangeRate } from "../../Currencies/domain";
import { Currency } from "../../Currencies/domain/currency.vo";
import { Nanoid } from "../../Shared/domain";

const logger: Logger = new Logger("Account");

export enum AccountAssetSubtype {
	SAVINGS = "savings",
	CHECKING = "checking",
	INVESTMENT = "investment",
	CASH = "cash",
}

export enum AccountLiabilitySubtype {
	CREDIT_CARD = "credit card",
	LOAN = "loan",
}

export type AccountSubtype = AccountAssetSubtype | AccountLiabilitySubtype;

export class Account extends Entity<Nanoid, AccountPrimitives> {
	constructor(
		id: Nanoid,
		private readonly _type: AccountType,
		private _subtype: AccountSubtype,
		private _name: StringValueObject,
		private _currency: Currency,
		private _balance: AccountBalance,
		updatedAt: DateValueObject,
		private _exchangeRate?: ExchangeRate,
	) {
		super(id, updatedAt);
	}

	static fromPrimitives({
		id,
		type,
		subtype,
		name,
		currency,
		balance,
		updatedAt,
	}: AccountPrimitives): Account {
		const account = new Account(
			new Nanoid(id),
			new AccountType(type),
			subtype ??
				(type === "asset"
					? AccountAssetSubtype.CASH
					: AccountLiabilitySubtype.CREDIT_CARD),
			new StringValueObject(name),
			new Currency(currency),
			new AccountBalance(
				new PriceValueObject(balance, { decimals: 2, withSign: true }),
			),
			new DateValueObject(new Date(updatedAt)),
		);
		return account;
	}

	static createAsset(
		subtype: AccountAssetSubtype,
		name: StringValueObject,
		currency: Currency,
	): Account {
		return new Account(
			Nanoid.generate(),
			AccountType.asset(),
			subtype,
			name,
			currency,
			AccountBalance.zero(),
			DateValueObject.createNowDate(),
		);
	}

	static createLiability(
		subtype: AccountLiabilitySubtype,
		name: StringValueObject,
		currency: Currency,
	): Account {
		return new Account(
			Nanoid.generate(),
			AccountType.liability(),
			subtype,
			name,
			currency,
			AccountBalance.zero(),
			DateValueObject.createNowDate(),
		);
	}

	get type(): AccountType {
		return this._type;
	}

	get subtype(): AccountSubtype {
		return this._subtype;
	}

	set subtype(subtype: AccountSubtype) {
		this._subtype = subtype;
		this.updateTimestamp();
	}

	get name(): StringValueObject {
		return this._name;
	}

	set name(name: StringValueObject) {
		this._name = name;
		this.updateTimestamp();
	}

	get currency(): Currency {
		return this._currency;
	}

	set currency(currency: Currency) {
		this._currency = currency;
		this.updateTimestamp();
	}

	get balance(): AccountBalance {
		return this._balance;
	}

	get convertedBalance(): number {
		if (!this._exchangeRate) {
			return this._balance.value.value;
		}
		return this._balance.value.value * this._exchangeRate.rate.value;
	}

	get exchangeRate(): ExchangeRate | undefined {
		return this._exchangeRate;
	}

	set exchangeRate(exchangeRate: ExchangeRate | undefined) {
		this._exchangeRate = exchangeRate;
	}

	get realBalance(): PriceValueObject {
		return this._balance.value.times(
			new NumberValueObject(this._type.isAsset() ? 1 : -1),
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
		transaction: Transaction,
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

		this._balance = this._balance.subtract(prevAmount).plus(newAmount);
		this.updateTimestamp();
	}

	adjustOnTransactionDeletion(transaction: Transaction) {
		const amount = this._type.isLiability()
			? transaction
					.getRealAmountForAccount(this.id)
					.times(new NumberValueObject(-1))
			: transaction.getRealAmountForAccount(this.id);

		this._balance = this._balance.subtract(amount);
		this.updateTimestamp();
	}

	toPrimitives(): AccountPrimitives {
		return {
			id: this._id.value,
			type: this._type.value,
			subtype: this.subtype,
			name: this._name.value,
			currency: this._currency.value,
			balance: this._balance.value.value,
			updatedAt: this._updatedAt.toISOString(),
		};
	}

	static emptyPrimitives(): AccountPrimitives {
		return {
			id: "",
			type: "asset",
			subtype: AccountAssetSubtype.CASH,
			name: "",
			currency: "USD",
			balance: 0,
			updatedAt: new Date().toISOString(),
		};
	}
}

export type AccountPrimitives = {
	id: string;
	type: AccountTypeType;
	subtype: AccountSubtype;
	name: string;
	currency: string;
	balance: number;
	updatedAt: string;
};
