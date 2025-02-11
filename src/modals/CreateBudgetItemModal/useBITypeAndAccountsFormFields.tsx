import { Budget } from "budget/Budget/Budget";
import { BudgetItem, TBudgetItem } from "budget/BudgetItem/BudgetItem";
import { BudgetItemRecordType } from "budget/BudgetItem/BugetItemRecord/BudgetItemRecord";
import { Validator } from "budget/BudgetItem/Validator";
import { useMemo, useState } from "react";
import { Select } from "view/components/Select";
import { SelectWithCreation } from "view/components/SelectWithCreation";

export const useBITypeAndAccountsFormFields = ({
	item,
	budget,
	errors,
}: {
	item?: BudgetItem;
	budget: Budget<BudgetItem>;
	errors?: {
		[K in keyof Pick<
			TBudgetItem,
			"account" | "toAccount" | "type"
		>]: string;
	};
}) => {
	const accounts = useMemo(() => [...budget.getAccounts()], [budget]);

	const [locks, setLocks] = useState<{
		[K in keyof Pick<
			TBudgetItem,
			"account" | "toAccount" | "type"
		>]: boolean;
	}>({
		account: false,
		toAccount: false,
		type: false,
	});
	const updateLock = (key: keyof TBudgetItem, value: boolean) => {
		setLocks({
			...locks,
			[key]: value,
		});
	};
	const [type, setType] = useState<BudgetItemRecordType>(
		item?.type ?? "expense"
	);
	const [account, setAccount] = useState(item?.account ?? "");
	const [toAccount, setToAccount] = useState(item?.toAccount || "");

	const inputs = (
		<>
			<Select
				id="type"
				label="Type"
				value={type}
				values={{
					expense: "Expense",
					income: "Income",
					transfer: "Transfer",
				}}
				onChange={(type) =>
					setType(type.toLowerCase() as BudgetItemRecordType)
				}
				isLocked={locks.type}
				setIsLocked={(value) => updateLock("type", value)}
				error={errors?.type}
			/>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					gap: "10px",
				}}
			>
				<SelectWithCreation
					id="account"
					label="Account: From"
					item={account}
					items={accounts}
					onChange={setAccount}
					style={{
						flexGrow: 1,
					}}
					isLocked={locks.account}
					setIsLocked={(value) => updateLock("account", value)}
					error={errors?.account}
				/>
				{type === "transfer" && (
					<SelectWithCreation
						id="toAccount"
						label="Account: To"
						item={toAccount}
						items={accounts}
						onChange={setToAccount}
						style={{
							flexGrow: 1,
						}}
						isLocked={locks.toAccount}
						setIsLocked={(value) => updateLock("toAccount", value)}
						error={errors?.toAccount}
					/>
				)}
			</div>
		</>
	);

	return {
		type,
		account,
		toAccount,
		lockAccount: locks.account,
		lockToAccount: locks.toAccount,
		// setAccount,
		// setToAccount,
		accountsInputs: inputs,
	};
};
