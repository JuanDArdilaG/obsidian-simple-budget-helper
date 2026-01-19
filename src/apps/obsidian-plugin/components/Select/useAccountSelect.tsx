import { AccountsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { Account } from "contexts/Accounts/domain";
import { useContext, useEffect, useState } from "react";
import { Nanoid } from "../../../../contexts/Shared/domain";
import { Select } from "./Select";

export const useAccountSelect = ({
	label,
	initialValueID,
	error,
}: {
	label?: string;
	initialValueID?: string;
	error?: string;
}) => {
	const [accountId, setAccountId] = useState(initialValueID ?? "");
	const [account, setAccount] = useState<Account>();

	const { accounts, getAccountByID } = useContext(AccountsContext);

	useEffect(() => {
		setAccountId(
			initialValueID
				? (getAccountByID(new Nanoid(initialValueID))?.name.value ?? "")
				: "",
		);
	}, [initialValueID]);

	useEffect(() => {
		setAccount(
			accountId
				? accounts.find((acc) => acc.id.equalTo(new Nanoid(accountId)))
				: undefined,
		);
	}, [accountId]);

	return {
		AccountSelect: (
			<Select<Account>
				id="account"
				label={label ?? "Account"}
				value={accountId}
				values={accounts}
				getOptionLabel={(account) => account.name.value}
				getOptionValue={(account) => account.id.value}
				onChange={(account) => setAccountId(account)}
				error={error}
			/>
		),
		account,
	};
};
