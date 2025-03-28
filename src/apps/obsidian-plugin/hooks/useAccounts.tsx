import {
	Account,
	AccountID,
	AccountName,
	GetAllAccountsUseCase,
} from "contexts";
import { useState, useEffect, useCallback } from "react";
import { useLogger } from "./useLogger";

export const useAccounts = ({
	getAllAccounts,
}: {
	getAllAccounts: GetAllAccountsUseCase;
}) => {
	const logger = useLogger("useAccounts", false);
	const [accounts, setAccounts] = useState<Account[]>([]);
	const [updateAccounts, setUpdateAccounts] = useState(true);

	useEffect(() => {
		if (updateAccounts) {
			setUpdateAccounts(false);
			logger.debug("updating accounts", {
				refreshAccounts: updateAccounts,
				accounts,
			});
			getAllAccounts.execute().then((accs) => setAccounts(accs));
		}
	}, [updateAccounts]);

	const getAccountByID = useCallback(
		(id: AccountID) => accounts.find((acc) => acc.id.equalTo(id)),
		[accounts]
	);

	const getAccountByName = useCallback(
		(name: AccountName) => accounts.find((acc) => acc.name.equalTo(name)),
		[accounts]
	);

	return {
		accounts,
		updateAccounts: () => setUpdateAccounts(true),
		getAccountByID,
		getAccountByName,
	};
};
