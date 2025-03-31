import { useContext, useEffect, useState } from "react";
import { ReactMoneyInput } from "react-input-price";
import { useAccountSelect } from "apps/obsidian-plugin/components/Select/useAccountSelect";
import {
	AccountsContext,
	ItemsContext,
	TransactionsContext,
} from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { ScheduledItem } from "contexts/ScheduledItems/domain";
import {
	TransactionAmount,
	TransactionDate,
} from "contexts/Transactions/domain";
import { useLogger } from "../hooks";
import { Input } from "apps/obsidian-plugin/components/Input/Input";

export const RecordScheduledItemPanel = ({
	item,
	onClose,
}: {
	item: ScheduledItem;
	onClose: () => void;
}) => {
	const logger = useLogger("RecordScheduledItemPanel");
	useEffect(() => {
		logger.debug("item", { item });
	}, []);
	const {
		useCases: { recordScheduledItem, deleteScheduledItem },
		updateScheduledItems,
	} = useContext(ItemsContext);
	const { updateAccounts } = useContext(AccountsContext);
	const { updateTransactions } = useContext(TransactionsContext);
	const { AccountSelect, account } = useAccountSelect({
		label: "From",
		initialValueID: item.account.value,
	});
	const { AccountSelect: ToAccountSelect, account: toAccount } =
		useAccountSelect({
			label: "To",
			initialValueID: item.toAccount?.value,
		});
	// useEffect(() => {
	// 	console.log({
	// 		accountChanged: account,
	// 		item,
	// 		accountFromItem: item.account,
	// 	});
	// }, [account, item]);
	const [date, setDate] = useState<Date>(item.date.value);
	const [amount, setAmount] = useState(item.price.valueOf());
	const [isPermanent, setIsPermanent] = useState(false);

	return (
		<div className="record-budget-item-modal">
			<h3>Record:</h3>
			{AccountSelect}
			{item.operation.isTransfer() && ToAccountSelect}
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
					await recordScheduledItem.execute({
						itemID: item.id,
						account: account?.id,
						toAccount: toAccount?.id,
						amount: new TransactionAmount(amount),
						date: new TransactionDate(date),
						permanentChanges: isPermanent,
					});
					if (!item.recurrence)
						await deleteScheduledItem.execute(item.id);
					updateScheduledItems();
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
