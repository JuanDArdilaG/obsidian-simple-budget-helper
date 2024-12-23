import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { BudgetItem } from "budget/BudgetItem";
import { useEffect, useState } from "react";
import { dateStringToDate } from "utils/date";

export const RecordBudgetItemModal = ({
	item,
	onRecord,
	onClose,
}: {
	item: BudgetItem;
	onRecord: (item: BudgetItem) => void;
	onClose: () => void;
}) => {
	const [date, setDate] = useState(new Date(item.nextDate));
	const [amount, setAmount] = useState(item.amount);

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
		<div className="record-budget-item-modal">
			<h1>Record Budget Item</h1>
			<input
				type="date"
				defaultValue={date.toISOString().split("T")[0]}
				onChange={(e) => {
					console.log({ date: dateStringToDate(e.target.value) });
					setDate(dateStringToDate(e.target.value));
				}}
			/>
			<input
				id="amount-input"
				type="text"
				placeholder="Amount"
				defaultValue={new PriceValueObject(amount).toString()}
			/>
			<button
				onClick={() => {
					console.log({ date, amount });
					item.record(date, amount);
					onRecord(item);
					onClose();
				}}
			>
				Record
			</button>
		</div>
	);
};
