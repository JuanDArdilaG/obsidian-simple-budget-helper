import { PriceValueObject } from "@juandardilag/value-objects";

export class AccountBalance {
	constructor(private _balance: PriceValueObject) {}

	static zero(): AccountBalance {
		return new AccountBalance(
			new PriceValueObject(0, { decimals: 2, withSign: false })
		);
	}

	get value(): PriceValueObject {
		return this._balance;
	}

	plus(other: PriceValueObject): AccountBalance {
		return new AccountBalance(this._balance.plus(other));
	}

	sustract(other: PriceValueObject): AccountBalance {
		return new AccountBalance(this._balance.sustract(other));
	}

	adjust(newBalance: PriceValueObject): PriceValueObject {
		const difference = newBalance.sustract(this._balance);

		this._balance = newBalance;

		return difference;
	}
}
