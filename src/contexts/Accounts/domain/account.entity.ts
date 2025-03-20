import { IEntity } from "contexts/Shared/domain/entity.interface";
import { AccountID } from "./account-id.valueobject";
import { AccountName } from "./account-name.valueobject";
import { AccountBalance } from "./account-balance.valueobject";
import { createDefault } from "contexts/Shared/domain";

export class Account implements IEntity<AccountID, AccountPrimitives> {
	constructor(
		private _id: AccountID,
		private _name: AccountName,
		private _balance: AccountBalance
	) {}

	get id(): AccountID {
		return this._id;
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
			name: this._name.value,
			balance: this._balance.valueOf(),
		};
	}

	static fromPrimitives({ id, name, balance }: AccountPrimitives): Account {
		return new Account(
			new AccountID(id),
			new AccountName(name),
			new AccountBalance(balance)
		);
	}

	static emptyPrimitives(): AccountPrimitives {
		return {
			id: "",
			name: "",
			balance: 0,
		};
	}
}

export type AccountPrimitives = {
	id: string;
	name: string;
	balance: number;
};
