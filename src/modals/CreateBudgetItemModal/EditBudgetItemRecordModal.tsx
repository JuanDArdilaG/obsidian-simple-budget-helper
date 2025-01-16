import { Budget } from "budget/Budget/Budget";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { BudgetItemRecord } from "budget/BudgetItem/BudgetItemRecord";
import { useState } from "react";
import { ReactMoneyInput } from "react-input-price";

export const EditBudgetItemRecordModal = ({
	budget,
	record,
	onUpdate,
	close,
}: {
	budget: Budget;
	record: BudgetItemRecord;
	onUpdate: (item: BudgetItem) => Promise<void>;
	close: () => void;
}) => {
	const [name, setName] = useState(record.name);
	const [amount, setAmount] = useState(record.amount);
	const [type, setType] = useState(record.type);
	const [date, setDate] = useState(record.date);
	const [time, setTime] = useState(
		record.date
			.toTimeString()
			.split(" ")[0]
			.split(":")
			.slice(0, 2)
			.join(":")
	);

	// useEffect(() => {
	// 	if (record) {
	// 		setName(record.name);
	// 		setAmount(record.amount);
	// 		setType(record.type);
	// 		setDate(record.date);
	// 		setTime(
	// 			record.date
	// 				.toTimeString()
	// 				.split(" ")[0]
	// 				.split(":")
	// 				.slice(0, 2)
	// 				.join(":")
	// 		);
	// 	}
	// }, [record]);

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
				value={amount}
				onValueChange={(priceVO) => setAmount(priceVO.toNumber())}
			/>
			<select
				defaultValue={type}
				onChange={(e) =>
					setType(e.target.value as "income" | "expense")
				}
			>
				<option value="income">Income</option>
				<option value="expense">Expense</option>
			</select>
			{/* <div style={{ display: "flex", justifyContent: "space-between" }}>
					<select onChange={(e) => setCategory(e.target.value)}>
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
				</div> */}
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

					const item = budget.getItemByID(record.itemID);

					console.log({
						item,
						name,
						amount,
						type,
						date,
					});

					if (!item) return;
					item.updateHistoryRecord(
						record.id,
						name,
						date,
						type,
						amount
					);

					await onUpdate(item);
					// await updateItemFile(item, "modify");

					close();
				}}
			>
				Create
			</button>
		</div>
	);
};
