import {
	AccountsMap,
	GetAllAccountsUseCase,
} from "contexts/Accounts/application/get-all-accounts.usecase";
import { Nanoid } from "contexts/Shared/domain";
import { useCallback, useEffect, useState } from "react";
import { useLogger } from "./useLogger";

export const useAccounts = ({
	getAllAccounts,
}: {
	getAllAccounts: GetAllAccountsUseCase;
}) => {
	const { logger } = useLogger("useAccounts");
	const [accountsMap, setAccountsMap] = useState<AccountsMap>(new Map());
	const [updateAccounts, setUpdateAccounts] = useState(true);

	useEffect(() => {
		console.log("[useAccounts] Effect triggered", {
			updateAccounts,
			accountCount: accountsMap.size,
		});
		if (updateAccounts) {
			console.log("[useAccounts] Starting accounts fetch");
			setUpdateAccounts(false);
			logger.debug("updating accounts", {
				refreshAccounts: updateAccounts,
				accounts: accountsMap,
			});
			getAllAccounts
				.execute()
				.then((newAccounts) => {
					console.log("[useAccounts] Accounts fetched", {
						count: newAccounts.size,
					});
					setAccountsMap(newAccounts);
				})
				.catch((error) => {
					console.error(
						"[useAccounts] Error fetching accounts:",
						error,
					);
				});
		}
	}, [updateAccounts]);

	const getAccountByID = useCallback(
		(id: Nanoid) => accountsMap.get(id.value) || null,
		[accountsMap],
	);

	return {
		accountsMap,
		updateAccounts: () => setUpdateAccounts(true),
		getAccountByID,
	};
};
