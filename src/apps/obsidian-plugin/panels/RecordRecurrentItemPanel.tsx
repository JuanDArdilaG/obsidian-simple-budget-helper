import { useContext, useState, useEffect } from "react";
import { ReactMoneyInput } from "react-input-price";
import { RecurrentItem } from "contexts/Items";
import { Input, useAccountSelect } from "apps/obsidian-plugin/components";
import { TransactionAmount, TransactionDate } from "contexts";
import {
	AccountsContext,
	ItemsContext,
	TransactionsContext,
} from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";

export const RecordRecurrentItemPanel = ({
	item,
	onClose,
}: {
	item: RecurrentItem;
	onClose: () => void;
}) => {
	const {
		useCases: { recordRecurrentItem },
	} = useContext(ItemsContext);
	const { updateAccounts } = useContext(AccountsContext);
	const { updateTransactions } = useContext(TransactionsContext);
	const { AccountSelect, account } = useAccountSelect({
		label: "Account",
		initialValueID: item.account,
	});
	useEffect(() => {
		console.log({
			accountChanged: account,
			item,
			accountFromItem: item.account,
		});
	}, [account, item]);
	const [date, setDate] = useState<Date>(item.nextDate.valueOf());
	const [amount, setAmount] = useState(0);
	const [isPermanent, setIsPermanent] = useState(false);

	return (
		<div className="record-budget-item-modal">
			<h3>Record:</h3>
			{AccountSelect}
			<Input<Date>
				dateWithTime
				id="date"
				label="Date"
				value={date}
				onChange={(date) => setDate(date)}
			/>
			<ReactMoneyInput
				id="amount-input-react"
				initialValue={item.price.toNumber()}
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
						account: account?.id,
						amount: new TransactionAmount(amount),
						date: new TransactionDate(date),
						permanentChanges: isPermanent,
					});
					updateAccounts();
					updateTransactions();
					onClose();
				}}
			>
				Record
			</button>
		</div>
	);
};
