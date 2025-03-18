import { IEntity } from "contexts/Shared/domain/entity.interface";
import { AccountID } from "./account-id.valueobject";
import { AccountName } from "./account-name.valueobject";

export class Account implements IEntity<AccountID, AccountPrimitives> {
	constructor(private _id: AccountID, private _name: AccountName) {}

	get id(): AccountID {
		return this._id;
	}

	toPrimitives(): AccountPrimitives {
		return {
			id: this._id.value,
			name: this._name.value,
		};
	}
}

export type AccountPrimitives = {
	id: string;
	name: string;
};
