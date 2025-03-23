import {
	AccountBalance,
	AccountID,
	AccountName,
	AccountType,
	AccountTypeType,
} from "contexts/Accounts/domain";
import { IEntity } from "contexts/Shared/domain";

export class Account implements IEntity<AccountID, AccountPrimitives> {
	constructor(
		private _id: AccountID,
		private _type: AccountType,
		private _name: AccountName,
		private _balance: AccountBalance
	) {}

	static create(type: AccountType, name: AccountName): Account {
		return new Account(
			AccountID.generate(),
			type,
			name,
			AccountBalance.zero()
		);
	}

	get id(): AccountID {
		return this._id;
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

	toPrimitives(): AccountPrimitives {
		return {
			id: this._id.value,
			type: this._type.value,
			name: this._name.value,
			balance: this._balance.valueOf(),
		};
	}

	static fromPrimitives({
		id,
		type,
		name,
		balance,
	}: AccountPrimitives): Account {
		return new Account(
			new AccountID(id),
			new AccountType(type),
			new AccountName(name),
			new AccountBalance(balance)
		);
	}

	static emptyPrimitives(): AccountPrimitives {
		return {
			id: "",
			type: "asset",
			name: "",
			balance: 0,
		};
	}
}

export type AccountPrimitives = {
	id: string;
	type: AccountTypeType;
	name: string;
	balance: number;
};
