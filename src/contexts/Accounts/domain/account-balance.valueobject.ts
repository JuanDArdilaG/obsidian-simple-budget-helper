import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";

export class AccountBalance extends PriceValueObject {
	static zero(): AccountBalance {
		return new AccountBalance(0);
	}

	plus(other: PriceValueObject): AccountBalance {
		return new AccountBalance(super.plus(other).valueOf());
	}

	sustract(other: PriceValueObject): AccountBalance {
		return new AccountBalance(super.sustract(other).valueOf());
	}

	adjust(newBalance: AccountBalance): PriceValueObject {
		const difference = newBalance.sustract(this);

		this._value = newBalance._value;

		return difference;
	}
}
