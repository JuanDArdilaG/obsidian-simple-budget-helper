import { useContext, useState } from "react";
import { AccountsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import {
	Account,
	AccountName,
	AccountType,
	AccountTypeType,
} from "contexts/Accounts/domain";
import { Select } from "apps/obsidian-plugin/components/Select/Select";
import { Input } from "apps/obsidian-plugin/components/Input/Input";

export const CreateAccountPanel = ({ onCreate }: { onCreate: () => void }) => {
	const {
		useCases: { createAccount },
	} = useContext(AccountsContext);

	const [accountName, setAccountName] = useState("");
	const [type, setType] = useState("asset" as AccountTypeType);

	const handleSubmit = () => async () => {
		await createAccount.execute(
			Account.create(new AccountType(type), new AccountName(accountName))
		);

		onCreate();
		setAccountName("");
	};

	return (
		<div className="create-budget-item-modal">
			<h1>Create Account</h1>
			<Input
				id="account"
				label="Name"
				value={accountName}
				onChange={(name) => setAccountName(name)}
			/>
			<Select
				id="type"
				label="Type"
				value={type}
				values={["asset", "liability"]}
				onChange={(type) => setType(type)}
			/>
			<button onClick={handleSubmit()}>Create</button>
		</div>
	);
};
