import { EnumValueObject } from "@juandardilag/value-objects";

export type AccountTypeType = "asset" | "liability";

export class AccountType extends EnumValueObject<AccountTypeType> {
	constructor(value: AccountTypeType) {
		super(["asset", "liability"], value);
	}

	static asset(): AccountType {
		return new AccountType("asset");
	}

	static liability(): AccountType {
		return new AccountType("liability");
	}

	isAsset(): boolean {
		return this.value === "asset";
	}

	isLiability(): boolean {
		return this.value === "liability";
	}
}
