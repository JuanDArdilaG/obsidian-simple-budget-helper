import { DateValueObject } from "@juandardilag/value-objects";
import { DateInput } from "apps/obsidian-plugin/components/Input/DateInput";
import { PriceInput } from "apps/obsidian-plugin/components/Input/PriceInput";
import { Select } from "apps/obsidian-plugin/components/Select";
import { ScheduledTransactionsContext } from "apps/obsidian-plugin/views";
import { AccountsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts/AccountsContext";
import { AccountID } from "contexts/Accounts/domain";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { useContext, useState } from "react";
import {
	ItemRecurrenceInfo,
	ScheduledTransaction,
} from "../../../../contexts/ScheduledTransactions/domain";

export const EditItemRecurrencePanel = ({
	scheduledTransaction,
	recurrence: { recurrence },
	onClose,
	updateItems,
}: {
	scheduledTransaction: ScheduledTransaction;
	recurrence: {
		recurrence: ItemRecurrenceInfo;
	};
	onClose: () => void;
	updateItems?: () => void;
}) => {
	const {
		useCases: { modifyNItemRecurrence },
	} = useContext(ScheduledTransactionsContext);
	const { accounts } = useContext(AccountsContext);

	const [date, setDate] = useState<DateValueObject | undefined>(
		recurrence.date
	);

	const [fromSplits, setFromSplits] = useState(
		recurrence.fromSplits?.map((split) => ({
			accountId: split.accountId.value,
			amount: split.amount,
		})) ??
			scheduledTransaction.fromSplits.map((split) => ({
				accountId: split.accountId.value,
				amount: split.amount,
			}))
	);
	const [toSplits, setToSplits] = useState(
		recurrence.toSplits?.map((split) => ({
			accountId: split.accountId.value,
			amount: split.amount,
		})) ??
			scheduledTransaction.toSplits.map((split) => ({
				accountId: split.accountId.value,
				amount: split.amount,
			}))
	);

	return (
		<div className="create-budget-item-modal">
			<h3>Edit Item</h3>

			{/* Always show modification fields */}
			<DateInput
				value={date}
				onChange={(value) => setDate(new DateValueObject(value))}
				label="Date"
			/>

			{/* Splits Editor */}
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
							values={accounts}
							getOptionLabel={(acc) => acc.name.value}
							getOptionValue={(acc) => acc.id.value}
							onChange={(val) => {
								const newSplits = [...fromSplits];
								newSplits[idx].accountId = val;
								setFromSplits(newSplits);
							}}
						/>
						<PriceInput
							id={`from-amount-${idx}`}
							label="Amount"
							value={split.amount}
							onChange={(val) => {
								const newSplits = [...fromSplits];
								newSplits[idx].amount = val;
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
							values={accounts}
							getOptionLabel={(acc) => acc.name.value}
							getOptionValue={(acc) => acc.id.value}
							onChange={(val) => {
								const newSplits = [...toSplits];
								newSplits[idx].accountId = val;
								setToSplits(newSplits);
							}}
						/>
						<PriceInput
							id={`to-amount-${idx}`}
							label="Amount"
							value={split.amount}
							onChange={(val) => {
								const newSplits = [...toSplits];
								newSplits[idx].amount = val;
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
			{/* End Splits Editor */}

			<button
				onClick={async () => {
					// Create PaymentSplit objects from the UI state
					const fromSplitObjs = fromSplits.map(
						(s) =>
							new PaymentSplit(
								new AccountID(s.accountId),
								s.amount
							)
					);
					const toSplitObjs = toSplits.map(
						(s) =>
							new PaymentSplit(
								new AccountID(s.accountId),
								s.amount
							)
					);

					await modifyNItemRecurrence.execute({
						scheduledItemId: recurrence.scheduledTransactionId,
						occurrenceIndex: recurrence.occurrenceIndex,
						date,
						fromSplits: fromSplitObjs,
						toSplits: toSplitObjs,
					});

					// Call updateItems if provided to refresh the list
					updateItems?.();

					// Close the panel after successful update and refresh
					onClose();
				}}
			>
				Save
			</button>
		</div>
	);
};
