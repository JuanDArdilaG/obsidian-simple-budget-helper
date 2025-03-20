import { OperationType } from "contexts/Shared/domain";
import { ItemPrimitives } from "contexts/Items/domain";
import { useContext, useEffect, useState } from "react";
import {
	Select,
	SelectWithCreation,
} from "apps/obsidian-plugin/view/components";
import { AppContext } from "apps/obsidian-plugin/view";
import {
	Account,
	AccountID,
	AccountPrimitives,
} from "contexts/Accounts/domain";

export const useBITypeAndAccountsFormFields = ({
	errors,
	account,
	toAccount,
	type,
	setAccount,
	setToAccount,
	setType,
}: {
	errors?: {
		[K in keyof Pick<
			ItemPrimitives,
			"account" | "toAccount" | "operation"
		>]: string;
	};
	account?: Account;
	toAccount?: Account;
	type?: OperationType;
	setAccount: (account: AccountID) => void;
	setToAccount: (account: AccountID) => void;
	setType: (type: OperationType) => void;
}) => {
	const { accounts } = useContext(AppContext);

	const [locks, setLocks] = useState<{
		[K in keyof Pick<
			ItemPrimitives,
			"account" | "toAccount" | "operation"
		>]: boolean;
	}>({
		account: false,
		toAccount: false,
		operation: false,
	});
	const updateLock = (key: keyof ItemPrimitives, value: boolean) => {
		setLocks({
			...locks,
			[key]: value,
		});
	};
	const [typeInternal, setTypeInternal] = useState<OperationType>("expense");
	const [accountInternal, setAccountInternal] = useState<Account>();
	const [toAccountInternal, setToAccountInternal] = useState<Account>();

	useEffect(() => {
		setTypeInternal(type ?? "expense");
	}, [type]);

	useEffect(() => {
		setAccountInternal(account);
	}, [account]);

	useEffect(() => {
		setToAccountInternal(toAccount);
	}, [toAccount]);

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
					setTypeInternal(type.toLowerCase() as OperationType);
					setType(type.toLowerCase() as OperationType);
				}}
				isLocked={locks.operation}
				setIsLocked={(value) => updateLock("operation", value)}
				error={errors?.operation}
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
					item={accountInternal?.toPrimitives() ?? {}}
					items={accounts.map((acc) => acc.toPrimitives())}
					getKey={(acc: AccountPrimitives) => acc.name}
					onChange={(accountName) => {
						const account = accounts.find(
							(acc) => acc.name.value === accountName
						);
						setAccountInternal(account);
						if (!account) return;
						setAccount(account.id);
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
						item={toAccountInternal?.toPrimitives() ?? {}}
						items={accounts.map((acc) => acc.toPrimitives())}
						onChange={(accountName) => {
							const account = accounts.find(
								(acc) => acc.name.value === accountName
							);
							setToAccountInternal(account);
							if (!account) return;
							setToAccount(account.id);
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
		lockType: locks.operation,
		lockAccount: locks.account,
		lockToAccount: locks.toAccount,
		accountsInputs: inputs,
	};
};
