import { Account, AccountID, AccountName, Logger } from "contexts";
import { useState, useEffect, useContext, useCallback } from "react";
import { AccountsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { useLogger } from "./useLogger";

export const useAccounts = () => {
	const logger = useLogger("useAccounts");
	const {
		useCases: { getAllAccounts },
	} = useContext(AccountsContext);

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
