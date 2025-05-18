import { AccountID } from "contexts/Accounts/domain";
import { Operation, OperationType } from "contexts/Shared/domain/value-objects";

export class ItemOperation {
	private constructor(
		private readonly _type: Operation,
		private _account: AccountID,
		private _toAccount?: AccountID
	) {}

	static expense(account: AccountID): ItemOperation {
		return new ItemOperation(Operation.expense(), account);
	}

	static income(account: AccountID): ItemOperation {
		return new ItemOperation(Operation.income(), account);
	}

	static transfer(account: AccountID, toAccount: AccountID): ItemOperation {
		return new ItemOperation(Operation.transfer(), account, toAccount);
	}

	get type(): Operation {
		return this._type;
	}

	get account(): AccountID {
		return this._account;
	}

	updateAccount(account: AccountID) {
		this._account = account;
	}

	get toAccount(): AccountID | undefined {
		return this._toAccount;
	}

	updateToAccount(toAccount: AccountID | undefined) {
		this._toAccount = toAccount;
	}

	static fromPrimitives({
		type,
		account,
		toAccount,
	}: ItemOperationPrimitives): ItemOperation {
		return new ItemOperation(
			new Operation(type),
			new AccountID(account),
			toAccount ? new AccountID(toAccount) : undefined
		);
	}

	toPrimitives(): ItemOperationPrimitives {
		return {
			type: this._type.value,
			account: this._account.value,
			toAccount: this._toAccount?.value,
		};
	}
}

export type ItemOperationPrimitives = {
	type: OperationType;
	account: string;
	toAccount?: string;
};
