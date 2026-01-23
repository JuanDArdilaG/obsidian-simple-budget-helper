import {
	DateValueObject,
	StringValueObject,
} from "@juandardilag/value-objects";
import { HorizontalRule } from "@mui/icons-material";
import { DateInput } from "apps/obsidian-plugin/components/Input/DateInput";
import { PriceInput } from "apps/obsidian-plugin/components/Input/PriceInput";
import { RadioSelect } from "apps/obsidian-plugin/components/RadioSelect";
import { Select } from "apps/obsidian-plugin/components/Select";
import { ScheduledTransactionsContext } from "apps/obsidian-plugin/views";
import { AccountsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts/AccountsContext";
import { AccountSplit } from "contexts/Transactions/domain/account-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { useContext, useState } from "react";
import {
	ItemRecurrenceInfo,
	RecurrencePattern,
	ScheduledTransaction,
} from "../../../../contexts/ScheduledTransactions/domain";
import { Input } from "../../components/Input/Input";
import { RecurrencePatternFormV2 } from "../../components/v2/RecurrencePatternFormV2";

export const EditScheduledTransactionPanel = ({
	scheduledTransaction,
	recurrence,
	onClose,
	updateItems,
	initialScope,
}: {
	scheduledTransaction: ScheduledTransaction;
	recurrence: ItemRecurrenceInfo;
	onClose: () => void;
	updateItems?: () => void;
	initialScope: "single" | "all";
}) => {
	const {
		useCases: {
			modifyNItemRecurrence,
			editScheduledTransactionName,
			editScheduledTransactionAmount,
			editScheduledTransactionRecurrencePattern,
		},
	} = useContext(ScheduledTransactionsContext);
	const { accounts } = useContext(AccountsContext);

	const [date, setDate] = useState<DateValueObject>(recurrence.date);
	const [name, setName] = useState<string>(scheduledTransaction.name.value);
	const [recurrencePattern, setRecurrencePattern] =
		useState<RecurrencePattern>(scheduledTransaction.recurrencePattern);

	const [editScope, setEditScope] = useState<"single" | "all">(initialScope);

	const [originAccounts, setOriginAccounts] = useState(
		recurrence.originAccounts?.map((split) => ({
			accountId: split.account.id.value,
			amount: split.amount,
		})) ??
			scheduledTransaction.originAccounts.map((split) => ({
				accountId: split.account.id.value,
				amount: split.amount,
			})),
	);
	const [destinationAccounts, setDestinationAccounts] = useState(
		recurrence.destinationAccounts?.map((account) => ({
			accountId: account.account.id.value,
			amount: account.amount,
		})) ??
			scheduledTransaction.destinationAccounts.map((account) => ({
				accountId: account.account.id.value,
				amount: account.amount,
			})),
	);

	return (
		<div className="create-budget-item-modal">
			<h3>Edit Scheduled Transaction</h3>

			<RadioSelect
				id="editScope"
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
				value={editScope}
				options={[
					{ value: "single", label: "Edit only this occurrence" },
					{ value: "all", label: "Edit all future occurrences" },
				]}
				onChange={(value) => {
					console.log({ value });
					setEditScope(value as "single" | "all");
				}}
				row
			/>

			<HorizontalRule style={{ width: "100%" }} />

			{editScope === "all" && (
				<Input<string>
					id="scheduled-transaction-name-input"
					label="Name"
					value={name}
					onChange={setName}
				/>
			)}

			{editScope === "all" && (
				<RecurrencePatternFormV2
					initialPattern={recurrencePattern}
					onChange={setRecurrencePattern}
				/>
			)}

			{editScope === "single" && (
				<DateInput
					value={date}
					onChange={(value) => setDate(new DateValueObject(value))}
					label="Date"
				/>
			)}

			{/* Splits Editor */}
			<div>
				<h4>Origin Accounts</h4>
				{originAccounts.map((split, idx) => (
					<div
						key={split.accountId}
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
								const newSplits = [...originAccounts];
								newSplits[idx].accountId = val;
								setOriginAccounts(newSplits);
							}}
						/>
						<PriceInput
							id={`from-amount-${idx}`}
							placeholder="Amount"
							value={split.amount}
							onChange={(val) => {
								const newOriginAccounts = [...originAccounts];
								newOriginAccounts[idx].amount = val;
								setOriginAccounts(newOriginAccounts);
							}}
							prefix={
								accounts.find(
									(acc) => acc.id.value === split.accountId,
								)?.currency.symbol || "$"
							}
						/>
						<button
							onClick={() =>
								setOriginAccounts(
									originAccounts.filter((_, i) => i !== idx),
								)
							}
						>
							Remove
						</button>
					</div>
				))}
				<button
					onClick={() =>
						setOriginAccounts([
							...originAccounts,
							{
								accountId: accounts[0]?.id.value || "",
								amount: new TransactionAmount(0),
							},
						])
					}
				>
					Add Accounts
				</button>
			</div>
			{scheduledTransaction.operation.type.isTransfer() && (
				<div>
					<h4>Destination Accounts</h4>
					{destinationAccounts.map((split, idx) => (
						<div
							key={split.accountId}
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
									const newSplits = [...destinationAccounts];
									newSplits[idx].accountId = val;
									setDestinationAccounts(newSplits);
								}}
							/>
							<PriceInput
								id={`to-amount-${idx}`}
								placeholder="Amount"
								value={split.amount}
								onChange={(val) => {
									const newDestinationAccounts = [
										...destinationAccounts,
									];
									newDestinationAccounts[idx].amount = val;
									setDestinationAccounts(
										newDestinationAccounts,
									);
								}}
								prefix={
									accounts.find(
										(acc) =>
											acc.id.value === split.accountId,
									)?.currency.symbol || "$"
								}
							/>
							<button
								onClick={() =>
									setDestinationAccounts(
										destinationAccounts.filter(
											(_, i) => i !== idx,
										),
									)
								}
							>
								Remove
							</button>
						</div>
					))}
					<button
						onClick={() =>
							setDestinationAccounts([
								...destinationAccounts,
								{
									accountId: accounts[0]?.id.value || "",
									amount: new TransactionAmount(0),
								},
							])
						}
					>
						Add Account
					</button>
				</div>
			)}
			{/* End Splits Editor */}

			<button
				onClick={async () => {
					if (editScope === "single") {
						const fromSplitObjs = originAccounts.map((s) =>
							AccountSplit.fromPrimitives(
								accounts.find(
									(acc) => acc.id.value === s.accountId,
								)!,
								{
									accountId: s.accountId,
									amount: s.amount.value,
								},
							),
						);
						const toSplitObjs = destinationAccounts.map((s) =>
							AccountSplit.fromPrimitives(
								accounts.find(
									(acc) => acc.id.value === s.accountId,
								)!,
								{
									accountId: s.accountId,
									amount: s.amount.value,
								},
							),
						);

						await modifyNItemRecurrence.execute({
							scheduledItemId: recurrence.scheduledTransactionId,
							occurrenceIndex: recurrence.occurrenceIndex,
							date,
							fromSplits: fromSplitObjs,
							toSplits: toSplitObjs,
						});
					} else {
						if (name !== scheduledTransaction.name.value)
							await editScheduledTransactionName.execute({
								id: scheduledTransaction.id,
								name: new StringValueObject(name),
							});

						const amount = originAccounts.reduce(
							(acc, curr) => acc.plus(curr.amount),
							new TransactionAmount(0),
						);
						if (
							amount.value !==
							scheduledTransaction.originAmount.value
						)
							await editScheduledTransactionAmount.execute({
								id: scheduledTransaction.id,
								amount,
							});

						if (
							!recurrencePattern.equalTo(
								scheduledTransaction.recurrencePattern,
							)
						) {
							await editScheduledTransactionRecurrencePattern.execute(
								{
									id: scheduledTransaction.id,
									recurrencePattern,
								},
							);
						}
					}

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
