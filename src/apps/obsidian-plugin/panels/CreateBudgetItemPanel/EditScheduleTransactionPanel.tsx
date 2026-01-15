import {
	DateValueObject,
	StringValueObject,
} from "@juandardilag/value-objects";
import { DateInput } from "apps/obsidian-plugin/components/Input/DateInput";
import { PriceInput } from "apps/obsidian-plugin/components/Input/PriceInput";
import { ScheduledTransactionsContext } from "apps/obsidian-plugin/views";
import { AccountsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts/AccountsContext";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { useContext, useState } from "react";
import {
	ItemRecurrenceFrequency,
	ScheduledTransaction,
} from "../../../../contexts/ScheduledTransactions/domain";
import { Input } from "../../components/Input/Input";

export const EditScheduleTransactionPanel = ({
	scheduledTransaction,
	onClose,
	updateItems,
}: {
	scheduledTransaction: ScheduledTransaction;
	onClose: () => void;
	updateItems?: () => void;
}) => {
	const {
		useCases: {
			editScheduledTransactionName,
			editScheduledTransactionAmount,
			editScheduledTransactionFrequency,
			editScheduledTransactionStartDate,
		},
	} = useContext(ScheduledTransactionsContext);
	const { accounts } = useContext(AccountsContext);

	const [date, setDate] = useState<DateValueObject>(
		scheduledTransaction.recurrencePattern.startDate
	);

	const [name, setName] = useState<string>(scheduledTransaction.name.value);

	const [amount, setAmount] = useState<TransactionAmount>(
		scheduledTransaction.originAmount
	);

	const [frequency, setFrequency] = useState<string | undefined>(
		scheduledTransaction.recurrencePattern.frequency?.value
	);

	return (
		<div className="edit-schedule-transaction-panel">
			<h3>Edit Scheduled Transaction</h3>

			<DateInput
				value={date}
				onChange={(value) => setDate(new DateValueObject(value))}
				label="Start Date"
			/>

			<Input<string>
				id="scheduled-transaction-name-input"
				label="Name"
				value={name}
				onChange={setName}
			/>

			<PriceInput
				id="scheduled-transaction-amount-input"
				value={amount}
				onChange={setAmount}
				label="Amount"
				prefix={
					accounts.find((acc) =>
						acc.id.equalTo(
							scheduledTransaction.originAccounts[0].accountId
						)
					)?.currency.symbol ?? "$"
				}
			/>

			{frequency !== undefined && (
				<Input<string>
					id="scheduled-transaction-frequency-input"
					label="Frequency"
					value={frequency}
					onChange={setFrequency}
				/>
			)}

			<button
				onClick={async () => {
					if (name !== scheduledTransaction.name.value)
						await editScheduledTransactionName.execute({
							id: scheduledTransaction.id,
							name: new StringValueObject(name),
						});

					if (
						amount.value !== scheduledTransaction.originAmount.value
					)
						await editScheduledTransactionAmount.execute({
							id: scheduledTransaction.id,
							amount,
						});

					if (
						date.toString() !==
						scheduledTransaction.recurrencePattern.startDate.toString()
					)
						await editScheduledTransactionStartDate.execute({
							id: scheduledTransaction.id,
							startDate: date,
						});
					if (
						frequency &&
						frequency !==
							scheduledTransaction.recurrencePattern.frequency
								?.value
					) {
						await editScheduledTransactionFrequency.execute({
							id: scheduledTransaction.id,
							frequency: new ItemRecurrenceFrequency(frequency),
						});
					}
					updateItems?.();
					onClose();
				}}
			>
				Save
			</button>
		</div>
	);
};
