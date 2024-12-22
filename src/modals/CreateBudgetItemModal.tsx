import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { useEffect, useState } from "react";
import { BudgetItem } from "src/budget/BudgetItem";
import { BudgetItemNextDate } from "src/budget/BudgetItemNextDate";
import { FrequencyString } from "src/budget/FrequencyString";

export const CreateBudgetItemModal = ({
	categories,
	onSubmit,
	close,
}: {
	categories: string[];
	onSubmit: (item: BudgetItem) => Promise<void>;
	close: () => void;
}) => {
	const [name, setName] = useState("");
	const [amount, setAmount] = useState(0);
	const [frequency, setFrequency] = useState("");
	const [category, setCategory] = useState("-- create new --");
	const [nextDate, setNextDate] = useState(new Date());

	useEffect(() => {
		const amountInput = document.getElementById(
			"amount-input"
		) as HTMLInputElement;
		if (amountInput) {
			PriceValueObject.parseInput(amountInput, (price) => {
				setAmount(PriceValueObject.fromString(price).toNumber());
			});
		}
	}, []);

	return (
		<div className="create-budget-item-modal">
			<h1>Create Budget Item</h1>
			<input
				type="text"
				placeholder="Name"
				onChange={(e) => setName(e.target.value)}
			/>
			<input
				id="amount-input"
				type="text"
				placeholder="Amount"
				onChange={(e) => setAmount(Number(e.target.value))}
			/>
			<input
				type="text"
				placeholder="Frequency"
				onChange={(e) => setFrequency(e.target.value)}
			/>
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
						onChange={(e) => setCategory(e.target.value)}
					/>
				)}
			</div>
			<input
				type="date"
				onChange={(e) =>
					setNextDate(new Date(`${e.target.value}T00:00:00`))
				}
			/>
			<button
				onClick={() => {
					close();
					onSubmit(
						new BudgetItem(
							name,
							amount,
							category,
							new BudgetItemNextDate(nextDate),
							new FrequencyString(frequency)
						)
					);
				}}
			>
				Create
			</button>
		</div>
	);
};
