import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { useContext, useState, useMemo, useEffect } from "react";
import { ReactMoneyInput } from "react-input-price";
import { BudgetContext } from "../RightSidebarReactView";
import { SelectWithCreation } from "view/components/SelectWithCreation";
import { Input } from "view/components/Input";

export const RecordBudgetItemPanel = ({
	item,
	onRecord,
	onClose,
}: {
	item: BudgetItem;
	onRecord: (item: BudgetItem) => void;
	onClose: () => void;
}) => {
	const { budget } = useContext(BudgetContext);
	const accounts = useMemo(() => [...budget.getAccounts()], [budget]);

	const nowDate = new Date();
	const dateDate = item.nextDate.toDate();
	const [date, setDate] = useState<Date>(
		new Date(
			dateDate.getFullYear(),
			dateDate.getMonth(),
			dateDate.getDate(),
			nowDate.getHours(),
			nowDate.getMinutes(),
			0,
			0
		)
	);
	const [account, setAccount] = useState(item.account);
	useEffect(() => {
		console.log({
			accountChanged: account,
			item,
			accountFromItem: item.account,
		});
	}, [account, item]);
	const [amount, setAmount] = useState(0);
	const [isPermanent, setIsPermanent] = useState(false);

	return (
		<div className="record-budget-item-modal">
			<h3>Record:</h3>
			<SelectWithCreation
				id="account"
				label="Account"
				item={account}
				items={accounts}
				setSelectedItem={setAccount}
				onChange={(acc) => {
					if (acc !== undefined && acc !== account) {
						console.log({
							title: "setting account",
							old: account,
							new: acc,
						});
						setAccount(acc);
					}
				}}
			/>
			<Input<Date>
				id="date"
				label="Date"
				value={date}
				onChange={(date) => setDate(date)}
			/>
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
					item.record(date, account, amount, isPermanent);
					onRecord(item);
					onClose();
				}}
			>
				Record
			</button>
		</div>
	);
};
