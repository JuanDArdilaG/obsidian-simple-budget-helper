import { Budget } from "budget/Budget/Budget";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { BudgetItemRecord } from "budget/BudgetItem/BugetItemRecord/BudgetItemRecord";
import { BudgetItemSimple } from "budget/BudgetItem/BudgetItemSimple";
import { useState } from "react";
import { BudgetItemRecordType } from "../../budget/BudgetItem/BugetItemRecord/BudgetItemRecord";
import { Input } from "view/components/Input";
import { Select } from "view/components/Select";
import { SelectWithCreation } from "view/components/SelectWithCreation";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";

export const EditBudgetItemRecordModal = ({
	budget,
	record,
	categories,
	onUpdate,
	close,
}: {
	budget: Budget<BudgetItem>;
	record: BudgetItemRecord;
	categories: string[];
	onUpdate: (item: BudgetItem) => Promise<void>;
	close: () => void;
}) => {
	const item = budget.getItemByID(record.itemID);

	const [name, setName] = useState(record.name);
	const [amount, setAmount] = useState(record.amount);
	const [type, setType] = useState(record.type);

	const [category, setCategory] = useState(item?.category || "");
	const [newCategory, setNewCategory] = useState("");

	const [account, setAccount] = useState(record.account);
	const [newAccount, setNewAccount] = useState("");

	const [toAccount, setToAccount] = useState("-- create new --");
	const [newToAccount, setNewToAccount] = useState("");

	const [date, setDate] = useState(record.date);
	const [time, setTime] = useState(
		record.date
			.toTimeString()
			.split(" ")[0]
			.split(":")
			.slice(0, 2)
			.join(":")
	);
	const [validation, setValidation] = useState<
		Record<string, boolean> | undefined
	>(undefined);
	const validateOnUpdate = () => ({
		name: name.length > 0,
		amount: amount.toNumber() > 0,
		account: account.length > 0,
		newAccount: account !== "-- create new --" || newAccount.length > 0,
		date: date.toString() !== "Invalid Date",
		time: time.length > 0,
		category: category.length > 0,
		toAccount: type !== "transfer" || toAccount.length > 0,
		newToAccount:
			type !== "transfer" ||
			toAccount !== "-- create new --" ||
			newToAccount.length > 0,
	});

	return (
		<div className="create-budget-item-modal">
			<h1>Edit Budget Item: {record.name}</h1>
			<Input
				id="name"
				label="Name"
				value={name}
				onChange={(name: string) => setName(name)}
				error={!validation || validation.name ? undefined : "required"}
			/>
			<Input<PriceValueObject>
				id="amount"
				label="Amount"
				value={amount}
				onChange={setAmount}
				error={
					!validation || validation.amount ? undefined : "required"
				}
			/>
			{item instanceof BudgetItemSimple && (
				<Select
					id="type"
					label="Type"
					value={type}
					values={["Income", "Expense", "Transfer"]}
					onChange={(type) =>
						setType(type.toLowerCase() as BudgetItemRecordType)
					}
				/>
			)}
			<SelectWithCreation
				id="account"
				label="From"
				item={account}
				items={budget.getAccounts()}
				onChange={(account) => setAccount(account)}
				// onCreationChange={(account) => setNewAccount(account)}
				// error={
				// 	!validation || validation.account ? undefined : "required"
				// }
			/>
			{type === "transfer" && (
				<SelectWithCreation
					id="to-account"
					label="To"
					item={toAccount}
					items={budget.getAccounts()}
					onChange={(account) => setToAccount(account)}
					// onCreationChange={(account) => setNewToAccount(account)}
					// error={
					// 	!validation || validation.toAccount
					// 		? undefined
					// 		: "required"
					// }
				/>
			)}
			<SelectWithCreation
				id="category"
				label="Category"
				item={category}
				items={categories}
				onChange={(category) => setCategory(category)}
				// onCreationChange={(category) => setNewCategory(category)}
				// error={
				// 	!validation || validation.category ? undefined : "required"
				// }
			/>
			<div className="horizontal-input">
				<input
					type="date"
					defaultValue={new Intl.DateTimeFormat("en-CA", {
						year: "numeric",
						month: "2-digit",
						day: "2-digit",
					}).format(date)}
					onChange={(e) =>
						setDate(new Date(`${e.target.value}T00:00:00`))
					}
				/>
				<input
					type="time"
					defaultValue={time}
					onChange={(e) => setTime(e.target.value)}
				/>
			</div>
			<button
				onClick={async () => {
					const validation = validateOnUpdate();
					setValidation(validation);
					if (!Object.values(validation).every((value) => value))
						return;
					date.setHours(parseInt(time.split(":")[0]));
					date.setMinutes(parseInt(time.split(":")[1]));
					date.setSeconds(0);

					const cat =
						category === "-- create new --"
							? newCategory
							: category;

					const acc =
						account === "-- create new --" ? newAccount : account;

					if (!item) return;
					if (item instanceof BudgetItemSimple) {
						item.updateHistoryRecord(
							record.id,
							name,
							acc,
							date,
							type,
							amount.toNumber(),
							cat,
							type === "transfer"
								? toAccount === "-- create new --"
									? newToAccount
									: toAccount
								: undefined
						);
					} else {
						item.updateHistoryRecord(
							record.id,
							name,
							acc,
							date,
							type,
							amount.toNumber(),
							cat
						);
					}

					await onUpdate(item);

					close();
				}}
			>
				Create
			</button>
		</div>
	);
};
