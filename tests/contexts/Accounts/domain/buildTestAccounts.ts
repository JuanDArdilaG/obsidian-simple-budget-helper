import { DateValueObject } from "@juandardilag/value-objects";
import {
	Account,
	AccountAssetSubtype,
	AccountBalance,
	AccountName,
	AccountType,
} from "contexts/Accounts/domain";
import { Currency } from "../../../../src/contexts/Currencies/domain/currency.vo";
import { Nanoid } from "../../../../src/contexts/Shared/domain";

export const buildTestAccounts = (n: number) => {
	return new Array(n)
		.fill("")
		.map(
			() =>
				new Account(
					Nanoid.generate(),
					AccountType.asset(),
					AccountAssetSubtype.CHECKING,
					new AccountName("test"),
					new Currency("USD"),
					AccountBalance.zero(),
					DateValueObject.createNowDate(),
				),
		);
};
