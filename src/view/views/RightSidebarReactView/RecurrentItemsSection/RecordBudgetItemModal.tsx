import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { useContext, useState } from "react";
import { ReactMoneyInput } from "react-input-price";
import { BudgetContext } from "../RightSidebarReactView";

export const RecordBudgetItemModal = ({
	item,
	onRecord,
	onClose,
}: {
	item: BudgetItem;
	onRecord: (item: BudgetItem) => void;
	onClose: () => void;
}) => {
	const { budget } = useContext(BudgetContext);
	const [date, setDate] = useState(new Date(item.nextDate));
	const [account, setAccount] = useState("");
	const [newAccount, setNewAccount] = useState("");
	const [time, setTime] = useState(
		new Date(item.nextDate)
			.toTimeString()
			.split(" ")[0]
			.split(":")
			.slice(0, 2)
			.join(":")
	);
	const [amount, setAmount] = useState(0);
	const [isPermanent, setIsPermanent] = useState(true);

	return (
		<div className="record-budget-item-modal">
			<h1>Record Budget Item</h1>
			<div style={{ display: "flex", justifyContent: "space-between" }}>
				<select onChange={(e) => setAccount(e.target.value)}>
					{budget.getAccounts().map((account, index) => (
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
			<ReactMoneyInput
				id="amount-input-react"
				initialValue={item.amount.toNumber()}
				onValueChange={(priceVO) => setAmount(priceVO.toNumber())}
			/>
			<div style={{ display: "flex", alignItems: "center" }}>
				<input
					id="permanent-input"
					type="checkbox"
					placeholder="isPermanent"
					onChange={(e) => {
						setIsPermanent(e.target.checked);
					}}
				/>
				<label htmlFor="permanent-input">Modify recurrence</label>
			</div>
			<button
				onClick={() => {
					date.setHours(parseInt(time.split(":")[0]));
					date.setMinutes(parseInt(time.split(":")[1]));
					date.setSeconds(0);
					const acc =
						account === "-- create new --" ? newAccount : account;
					item.record(date, acc, amount, isPermanent);
					onRecord(item);
					onClose();
				}}
			>
				Record
			</button>
		</div>
	);
};
