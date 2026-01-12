import { DateValueObject } from "@juandardilag/value-objects";
import {
	Account,
	AccountBalance,
	AccountID,
	AccountName,
	AccountType,
} from "contexts/Accounts/domain";
import { Currency } from "../../../../src/contexts/Shared/domain/currency.vo";

export const buildTestAccounts = (n: number) => {
	return new Array(n)
		.fill("")
		.map(
			() =>
				new Account(
					AccountID.generate(),
					AccountType.asset(),
					new AccountName("test"),
					new Currency("USD"),
					AccountBalance.zero(),
					DateValueObject.createNowDate()
				)
		);
};
