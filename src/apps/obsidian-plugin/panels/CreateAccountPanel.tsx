import { Input } from "apps/obsidian-plugin/components/Input/Input";
import { Select } from "apps/obsidian-plugin/components/Select/Select";
import {
	AccountsContext,
	AppContext,
} from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import {
	Account,
	AccountAssetSubtype,
	AccountLiabilitySubtype,
	AccountName,
	AccountTypeType,
} from "contexts/Accounts/domain";
import { useContext, useState } from "react";
import {
	currencies,
	Currency,
} from "../../../contexts/Currencies/domain/currency.vo";

export const CreateAccountPanel = ({ onCreate }: { onCreate: () => void }) => {
	const { plugin } = useContext(AppContext);
	const {
		useCases: { createAccount },
	} = useContext(AccountsContext);

	const [type, setType] = useState("asset" as AccountTypeType);
	const [assetSubType, setAssetSubType] = useState<AccountAssetSubtype>(
		AccountAssetSubtype.CASH,
	);
	const [liabilitySubType, setLiabilitySubType] =
		useState<AccountLiabilitySubtype>(AccountLiabilitySubtype.CREDIT_CARD);
	const [accountName, setAccountName] = useState("");
	const [currency, setCurrency] = useState(plugin.settings.defaultCurrency);

	const handleSubmit = () => async () => {
		await createAccount.execute(
			type === "asset"
				? Account.createAsset(
						assetSubType,
						new AccountName(accountName),
						new Currency(currency),
					)
				: Account.createLiability(
						liabilitySubType,
						new AccountName(accountName),
						new Currency(currency),
					),
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
				onChange={(type) => setType(type as AccountTypeType)}
			/>
			{type === "asset" ? (
				<Select
					id="subtype"
					label="Subtype"
					value={assetSubType}
					values={Object.values(AccountAssetSubtype)}
					onChange={(subtype) =>
						setAssetSubType(subtype as AccountAssetSubtype)
					}
				/>
			) : (
				<Select
					id="subtype"
					label="Subtype"
					value={liabilitySubType}
					values={Object.values(AccountLiabilitySubtype)}
					onChange={(subtype) =>
						setLiabilitySubType(subtype as AccountLiabilitySubtype)
					}
				/>
			)}
			<Select
				id="currency"
				label="Currency"
				value={currency}
				values={Object.keys(currencies)}
				onChange={setCurrency}
			/>
			<button onClick={handleSubmit()}>Create</button>
		</div>
	);
};
