import { NumberValueObject } from "@juandardilag/value-objects";
import {
	AccountsContext,
	ItemsContext,
	TransactionsContext,
} from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { Item, ItemRecurrenceInfo } from "contexts/Items/domain";
import {
	TransactionAmount,
	TransactionDate,
} from "contexts/Transactions/domain";
import { useContext, useState } from "react";
import { ReactMoneyInput } from "react-input-price";
import { DateInput } from "../components/Input/DateInput";
import { Select } from "../components/Select/Select";
import { useLogger } from "../hooks";

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
	const { accounts } = useContext(AccountsContext);
	const [fromSplits, setFromSplits] = useState(
		item.fromSplits.map((split) => ({
			accountId: split.accountId.value,
			amount: split.amount,
		}))
	);
	const [toSplits, setToSplits] = useState(
		item.toSplits.map((split) => ({
			accountId: split.accountId.value,
			amount: split.amount,
		}))
	);
	const [date, setDate] = useState<Date>(recurrence.date.value);
	const [isPermanent, setIsPermanent] = useState(false);

	return (
		<div className="record-budget-item-modal">
			<h3>Record:</h3>
			<div>
				<h4>From Splits</h4>
				{fromSplits.map((split, idx) => (
					<div
						key={idx}
						style={{
							display: "flex",
							gap: 8,
							alignItems: "center",
						}}
					>
						<Select
							id={`from-account-${idx}`}
							label="Account"
							value={split.accountId}
							values={accounts.map((acc) => acc.id.value)}
							onChange={(val) => {
								const newSplits = [...fromSplits];
								newSplits[idx].accountId = val;
								setFromSplits(newSplits);
							}}
						/>
						<ReactMoneyInput
							id={`from-amount-${idx}`}
							initialValue={split.amount.toNumber()}
							onValueChange={(priceVO) => {
								const newSplits = [...fromSplits];
								newSplits[idx].amount = new TransactionAmount(
									priceVO.toNumber()
								);
								setFromSplits(newSplits);
							}}
						/>
						<button
							onClick={() =>
								setFromSplits(
									fromSplits.filter((_, i) => i !== idx)
								)
							}
						>
							Remove
						</button>
					</div>
				))}
				<button
					onClick={() =>
						setFromSplits([
							...fromSplits,
							{
								accountId: accounts[0]?.id.value || "",
								amount: new TransactionAmount(0),
							},
						])
					}
				>
					Add Split
				</button>
			</div>
			<div>
				<h4>To Splits</h4>
				{toSplits.map((split, idx) => (
					<div
						key={idx}
						style={{
							display: "flex",
							gap: 8,
							alignItems: "center",
						}}
					>
						<Select
							id={`to-account-${idx}`}
							label="Account"
							value={split.accountId}
							values={accounts.map((acc) => acc.id.value)}
							onChange={(val) => {
								const newSplits = [...toSplits];
								newSplits[idx].accountId = val;
								setToSplits(newSplits);
							}}
						/>
						<ReactMoneyInput
							id={`to-amount-${idx}`}
							initialValue={split.amount.toNumber()}
							onValueChange={(priceVO) => {
								const newSplits = [...toSplits];
								newSplits[idx].amount = new TransactionAmount(
									priceVO.toNumber()
								);
								setToSplits(newSplits);
							}}
						/>
						<button
							onClick={() =>
								setToSplits(
									toSplits.filter((_, i) => i !== idx)
								)
							}
						>
							Remove
						</button>
					</div>
				))}
				<button
					onClick={() =>
						setToSplits([
							...toSplits,
							{
								accountId: accounts[0]?.id.value || "",
								amount: new TransactionAmount(0),
							},
						])
					}
				>
					Add Split
				</button>
			</div>
			<DateInput label="Date" value={date} onChange={setDate} />
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
					// Only the first split of each is used due to current use case limitations
					await recordItemRecurrence.execute({
						itemID: item.id,
						n,
						account: fromSplits[0]
							? new AccountID(fromSplits[0].accountId)
							: undefined,
						toAccount: toSplits[0]
							? new AccountID(toSplits[0].accountId)
							: undefined,
						amount: fromSplits[0]
							? fromSplits[0].amount
							: undefined,
						date: new TransactionDate(date),
						permanentChanges: isPermanent,
					});
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
