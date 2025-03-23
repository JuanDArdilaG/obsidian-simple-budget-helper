import { useContext, useState, useEffect } from "react";
import { ReactMoneyInput } from "react-input-price";
import { RecurrentItem } from "contexts/Items";
import { Input, SelectWithCreation } from "apps/obsidian-plugin/components";
import {
	Account,
	AccountID,
	TransactionAmount,
	TransactionDate,
} from "contexts";
import { BooleanValueObject } from "@juandardilag/value-objects/BooleanValueObject";
import { ItemsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";

export const RecordBudgetItemPanel = ({
	item,
	onRecord,
	onClose,
}: {
	item: RecurrentItem;
	onRecord: (item: RecurrentItem) => void;
	onClose: () => void;
}) => {
	const accounts: Account[] = [];
	const {
		useCases: { recordRecurrentItem },
	} = useContext(ItemsContext);

	const nowDate = new Date();
	const dateDate = item.nextDate.valueOf();
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
	const [account, setAccount] = useState(item.account.value);
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
				items={accounts.map((acc) => acc.name.value)}
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
				onClick={async () => {
					await recordRecurrentItem.execute({
						itemID: item.id,
						account: new AccountID(account),
						amount: new TransactionAmount(amount),
						date: new TransactionDate(date),
						permanentChanges: new BooleanValueObject(isPermanent),
					});
					onRecord(item);
					onClose();
				}}
			>
				Record
			</button>
		</div>
	);
};
