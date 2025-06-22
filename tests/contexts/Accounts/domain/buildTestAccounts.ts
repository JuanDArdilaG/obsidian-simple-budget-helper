import {
	Account,
	AccountBalance,
	AccountID,
	AccountName,
	AccountType,
} from "contexts/Accounts/domain";
import { DateValueObject } from "@juandardilag/value-objects";

export const buildTestAccounts = (n: number) => {
	return new Array(n)
		.fill("")
		.map(
			() =>
				new Account(
					AccountID.generate(),
					AccountType.asset(),
					new AccountName("test"),
					AccountBalance.zero(),
					DateValueObject.createNowDate()
				)
		);
};
