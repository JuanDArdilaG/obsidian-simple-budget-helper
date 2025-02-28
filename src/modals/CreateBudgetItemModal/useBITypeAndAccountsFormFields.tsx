import { Budget } from "budget/Budget/Budget";
import { BudgetItem, TBudgetItem } from "budget/BudgetItem/BudgetItem";
import { BudgetItemRecordType } from "budget/BudgetItem/BugetItemRecord/BudgetItemRecord";
import { useEffect, useMemo, useState } from "react";
import { Select } from "view/components/Select";
import { SelectWithCreation } from "view/components/SelectWithCreation";

export const useBITypeAndAccountsFormFields = ({
	item,
	budget,
	errors,
	setAccount,
	setToAccount,
	setType,
}: {
	item?: BudgetItem;
	budget: Budget<BudgetItem>;
	errors?: {
		[K in keyof Pick<
			TBudgetItem,
			"account" | "toAccount" | "type"
		>]: string;
	};
	setAccount: (account: string) => void;
	setToAccount: (account: string) => void;
	setType: (type: BudgetItemRecordType) => void;
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
	const [typeInternal, setTypeInternal] =
		useState<BudgetItemRecordType>("expense");
	const [accountInternal, setAccountInternal] = useState("");
	const [toAccountInternal, setToAccountInternal] = useState("");

	useEffect(() => {
		setTypeInternal(item?.type ?? "expense");
		setAccountInternal(item?.account ?? "");
		setToAccountInternal(item?.toAccount ?? "");
	}, [item]);

	const inputs = (
		<>
			<Select
				id="type"
				label="Type"
				value={typeInternal}
				values={{
					expense: "Expense",
					income: "Income",
					transfer: "Transfer",
				}}
				onChange={(type) => {
					setTypeInternal(type.toLowerCase() as BudgetItemRecordType);
					setType(type.toLowerCase() as BudgetItemRecordType);
				}}
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
					item={accountInternal}
					items={accounts}
					onChange={(account) => {
						setAccountInternal(account);
						setAccount(account);
					}}
					style={{
						flexGrow: 1,
					}}
					isLocked={locks.account}
					setIsLocked={(value) => updateLock("account", value)}
					error={errors?.account}
				/>
				{typeInternal === "transfer" && (
					<SelectWithCreation
						id="toAccount"
						label="Account: To"
						item={toAccountInternal}
						items={accounts}
						onChange={(account) => {
							setToAccountInternal(account);
							setToAccount(account);
						}}
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
		type: typeInternal,
		account: accountInternal,
		toAccount: toAccountInternal,
		lockType: locks.type,
		lockAccount: locks.account,
		lockToAccount: locks.toAccount,
		accountsInputs: inputs,
	};
};
