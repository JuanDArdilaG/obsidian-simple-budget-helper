import { useContext, useEffect, useMemo, useState } from "react";
import { Select } from "./Select";
import { AccountsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { Account, AccountID, AccountName } from "contexts/Accounts/domain";

export const useAccountSelect = ({
	label,
	initialValueName,
	initialValueID,
	lock,
	setLock,
	error,
}: {
	label?: string;
	initialValueName?: AccountName;
	initialValueID?: string;
	lock?: boolean;
	setLock?: (lock: boolean) => void;
	error?: string;
}) => {
	const [accountName, setAccountName] = useState(
		initialValueName?.value ?? ""
	);
	const [account, setAccount] = useState<Account>();

	const { accounts, getAccountByID } = useContext(AccountsContext);
	const accountNames = useMemo(
		() =>
			accounts
				.map((acc) => acc.name.value)
				.toSorted((a, b) => a.localeCompare(b)),
		[accounts]
	);

	useEffect(() => {
		setAccountName(
			initialValueID
				? getAccountByID(new AccountID(initialValueID))?.name.value ??
						""
				: ""
		);
	}, [initialValueID]);

	useEffect(() => {
		setAccount(
			accountName
				? accounts.find((acc) =>
						acc.name.equalTo(new AccountName(accountName))
				  )
				: undefined
		);
	}, [accountName]);

	return {
		AccountSelect: (
			<Select
				id="account"
				label={label ?? "Account"}
				value={accountName}
				values={["", ...accountNames]}
				onChange={(account) => setAccountName(account)}
				isLocked={lock}
				setIsLocked={setLock ? (lock) => setLock(lock) : undefined}
				error={error}
			/>
		),
		account,
	};
};
