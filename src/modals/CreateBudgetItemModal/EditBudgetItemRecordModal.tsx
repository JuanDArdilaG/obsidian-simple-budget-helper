import { Budget } from "budget/Budget/Budget";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { BudgetItemRecord } from "budget/BudgetItem/BugetItemRecord/BudgetItemRecord";
import { BudgetItemSimple } from "budget/BudgetItem/BudgetItemSimple";
import { useState } from "react";
import { ReactMoneyInput } from "react-input-price";
import { BudgetItemRecordType } from "../../budget/BudgetItem/BugetItemRecord/BudgetItemRecord";

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
	const [amount, setAmount] = useState(record.amount.toNumber());
	const [type, setType] = useState(record.type);

	const [category, setCategory] = useState(item?.category || "");
	const [newCategory, setNewCategory] = useState("");

	const [account, setAccount] = useState(record.account);
	const [newAccount, setNewAccount] = useState("");

	const [date, setDate] = useState(record.date);
	const [time, setTime] = useState(
		record.date
			.toTimeString()
			.split(" ")[0]
			.split(":")
			.slice(0, 2)
			.join(":")
	);

	return (
		<div className="create-budget-item-modal">
			<h1>Edit Budget Item: {record.name}</h1>
			<input
				type="text"
				placeholder="Name"
				defaultValue={name}
				onChange={(e) => setName(e.target.value)}
			/>
			<ReactMoneyInput
				id="amount-input-react"
				initialValue={amount}
				onValueChange={(priceVO) => setAmount(priceVO.toNumber())}
			/>
			{item instanceof BudgetItemSimple && (
				<select
					defaultValue={type}
					onChange={(e) =>
						setType(e.target.value as BudgetItemRecordType)
					}
				>
					<option value="income">Income</option>
					<option value="expense">Expense</option>
					<option value="transfer">Transfer</option>
				</select>
			)}
			{item instanceof BudgetItemSimple && (
				<div
					style={{ display: "flex", justifyContent: "space-between" }}
				>
					<select
						defaultValue={category}
						onChange={(e) => setCategory(e.target.value)}
					>
						{categories.map((category, index) => (
							<option value={category} key={index}>
								{category}
							</option>
						))}
					</select>
					{category === "-- create new --" && (
						<input
							type="text"
							onChange={(e) => setNewCategory(e.target.value)}
						/>
					)}
				</div>
			)}
			<div style={{ display: "flex", justifyContent: "space-between" }}>
				<select
					defaultValue={account}
					onChange={(e) => setAccount(e.target.value)}
				>
					{[...budget.getAccounts(), "-- create new --"]
						.sort()
						.map((account, index) => (
							<option value={account} key={index}>
								{account}
							</option>
						))}
				</select>
				{account === "-- create new --" && (
					<input
						type="text"
						onChange={(e) => setNewAccount(e.target.value)}
					/>
				)}
			</div>
			<div>
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
					item.updateHistoryRecord(
						record.id,
						name,
						acc,
						date,
						type,
						amount,
						cat
					);

					await onUpdate(item);

					close();
				}}
			>
				Create
			</button>
		</div>
	);
};
