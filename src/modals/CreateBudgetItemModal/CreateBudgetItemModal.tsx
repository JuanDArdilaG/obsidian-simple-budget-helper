import { useEffect, useState } from "react";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { BudgetItemNextDate } from "budget/BudgetItem/BudgetItemNextDate";
import { FrequencyString } from "budget/BudgetItem/FrequencyString";
import { ReactMoneyInput } from "react-input-price";

export const CreateBudgetItemModal = ({
	id,
	categories,
	onSubmit,
	close,
	toEdit,
}: {
	id: number;
	categories: string[];
	onSubmit: (item: BudgetItem) => Promise<void>;
	close: () => void;
	toEdit?: BudgetItem;
}) => {
	const [name, setName] = useState("");
	const [amount, setAmount] = useState(0);
	const [isRecurrent, setIsRecurrent] = useState(false);
	const [frequency, setFrequency] = useState("");
	const [category, setCategory] = useState("-- create new --");
	const [type, setType] = useState("income");
	const [nextDate, setNextDate] = useState(new Date());
	const [newCategory, setNewCategory] = useState("");
	const [time, setTime] = useState(
		new Date().toTimeString().split(" ")[0].split(":").slice(0, 2).join(":")
	);

	useEffect(() => {
		if (toEdit) {
			setName(toEdit.name);
			setAmount(toEdit.amount);
			setIsRecurrent(toEdit.isRecurrent);
			setFrequency(toEdit.frequency?.toString() || "");
			setCategory(toEdit.category);
			setType(toEdit.type);
			setNextDate(toEdit.nextDate);
			setTime(
				toEdit.nextDate
					.toTimeString()
					.split(" ")[0]
					.split(":")
					.slice(0, 2)
					.join(":")
			);
		}
	}, [toEdit]);

	return (
		<div className="create-budget-item-modal">
			<h1>Create Budget Item</h1>
			<input
				type="text"
				placeholder="Name"
				onChange={(e) => setName(e.target.value)}
			/>
			<ReactMoneyInput
				id="amount-input-react"
				value={0}
				onValueChange={(priceVO) => setAmount(priceVO.toNumber())}
			/>
			<select onChange={(e) => setType(e.target.value)}>
				<option value="income">Income</option>
				<option value="expense">Expense</option>
			</select>
			<div style={{ display: "flex", justifyContent: "space-between" }}>
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
			</div>
			<div>
				<input
					type="date"
					defaultValue={new Intl.DateTimeFormat("en-CA", {
						year: "numeric",
						month: "2-digit",
						day: "2-digit",
					}).format(nextDate)}
					onChange={(e) =>
						setNextDate(new Date(`${e.target.value}T00:00:00`))
					}
				/>
				<input
					type="time"
					defaultValue={time}
					onChange={(e) => setTime(e.target.value)}
				/>
			</div>
			<div>
				<input
					id="isRecurrent"
					type="checkbox"
					onChange={(e) => setIsRecurrent(e.target.checked)}
				/>
				<label htmlFor="isRecurrent">Recurrent</label>
			</div>
			{isRecurrent && (
				<input
					type="text"
					placeholder="Frequency"
					onChange={(e) => setFrequency(e.target.value)}
				/>
			)}
			<button
				onClick={() => {
					const isRecurrent = frequency !== "";
					nextDate.setHours(parseInt(time.split(":")[0]));
					nextDate.setMinutes(parseInt(time.split(":")[1]));
					nextDate.setSeconds(0);
					const date = new BudgetItemNextDate(nextDate, isRecurrent);
					const cat =
						category === "-- create new --"
							? newCategory
							: category;

					onSubmit(
						isRecurrent
							? BudgetItem.createRecurrent(
									id,
									name,
									amount,
									cat,
									type as "income" | "expense",
									date,
									new FrequencyString(frequency),
									""
							  )
							: BudgetItem.createSimple(
									id,
									name,
									amount,
									cat,
									type as "income" | "expense",
									date
							  )
					);
					close();
				}}
			>
				Create
			</button>
		</div>
	);
};
