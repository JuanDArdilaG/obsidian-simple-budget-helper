import { useContext, useState } from "react";
import { ReactMoneyInput } from "react-input-price";
import { useAccountSelect } from "apps/obsidian-plugin/components/Select/useAccountSelect";
import {
	AccountsContext,
	ItemsContext,
	TransactionsContext,
} from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { Item, ItemRecurrenceInfo } from "contexts/Items/domain";
import {
	TransactionAmount,
	TransactionDate,
} from "contexts/Transactions/domain";
import { useLogger } from "../hooks";
import { DateInput } from "../components/Input/DateInput";
import { NumberValueObject } from "@juandardilag/value-objects";

export const RecordItemPanel = ({
	item,
	recurrence: { recurrence, n },
	onClose,
}: {
	item: Item;
	recurrence: {
		recurrence: ItemRecurrenceInfo;
		n: NumberValueObject;
	};
	onClose: () => void;
}) => {
	const { logger, debug } = useLogger("RecordItemPanel");
	debug("item", { item });
	const {
		useCases: { recordItemRecurrence, deleteItem },
	} = useContext(ItemsContext);
	const { updateAccounts } = useContext(AccountsContext);
	const { updateTransactions } = useContext(TransactionsContext);
	const { AccountSelect, account } = useAccountSelect({
		label: "From",
		initialValueID: item.operation.account.value,
	});
	const { AccountSelect: ToAccountSelect, account: toAccount } =
		useAccountSelect({
			label: "To",
			initialValueID: item.operation.toAccount?.value,
		});
	const [date, setDate] = useState<Date>(recurrence.date.value);
	const [amount, setAmount] = useState(item.price.value);
	const [isPermanent, setIsPermanent] = useState(false);

	return (
		<div className="record-budget-item-modal">
			<h3>Record:</h3>
			{AccountSelect}
			{item.operation.type.isTransfer() && ToAccountSelect}
			<DateInput label="Date" value={date} onChange={setDate} />
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
					// if (recurrence instanceof Item || !item.recurrence) {
					// 	await recordItem.execute({
					// 		itemID: item.id,
					// 		account: account?.id,
					// 		toAccount: toAccount?.id,
					// 		amount: new TransactionAmount(amount),
					// 		date: new TransactionDate(date),
					// 		permanentChanges: isPermanent,
					// 	});
					// } else {
					await recordItemRecurrence.execute({
						itemID: item.id,
						n,
						account: account?.id,
						toAccount: toAccount?.id,
						amount: new TransactionAmount(amount),
						date: new TransactionDate(date),
						permanentChanges: isPermanent,
					});
					// }
					if (!item.recurrence) {
						logger.debug("eliminating", { item });
						await deleteItem.execute(item.id);
					}
					onClose();
					updateAccounts();
					updateTransactions();
				}}
			>
				Record
			</button>
		</div>
	);
};
