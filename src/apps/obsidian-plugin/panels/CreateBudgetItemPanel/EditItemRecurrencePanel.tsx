import { NumberValueObject } from "@juandardilag/value-objects";
import { Checkbox, FormControlLabel } from "@mui/material";
import { DateInput } from "apps/obsidian-plugin/components/Input/DateInput";
import { Input } from "apps/obsidian-plugin/components/Input/Input";
import { PriceInput } from "apps/obsidian-plugin/components/Input/PriceInput";
import {
	Select,
	SelectWithCreation,
} from "apps/obsidian-plugin/components/Select";
import { ItemsContext, TransactionsContext } from "apps/obsidian-plugin/views";
import { AccountsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts/AccountsContext";
import { Item, ItemRecurrenceInfo } from "contexts/Items/domain";
import { OperationType } from "contexts/Shared/domain";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { useContext, useState } from "react";

export const EditItemRecurrencePanel = ({
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
	const {
		useCases: { modifyNItemRecurrence },
	} = useContext(ItemsContext);
	const { brands, stores } = useContext(TransactionsContext);
	const { accounts } = useContext(AccountsContext);

	const [name, setName] = useState(item.name.value);
	const [type, setType] = useState(item.operation.type.value);

	const [brand, setBrand] = useState(item.info?.value.brand?.value);
	const [store, setStore] = useState(item.info?.value.store?.value);
	const [frequency, setFrequency] = useState(
		item.recurrence?.frequency?.value
	);

	const [date, setDate] = useState(recurrence.date.value);
	const [untilDate, setUntilDate] = useState(
		item.recurrence?.untilDate?.value
	);
	const [withUntilDate, setWithUntilDate] = useState(
		!!item.recurrence?.untilDate
	);

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

	return (
		<div className="create-budget-item-modal">
			<h3>Edit Item</h3>
			<Input
				id="name"
				label="Name"
				value={name}
				onChange={(name: string) => setName(name)}
				// error={!validation || validation.name ? undefined : "required"}
			/>
			<Select
				id="type"
				label="Type"
				value={type}
				values={["expense", "income", "transfer"]}
				onChange={(type) =>
					setType(type.toLowerCase() as OperationType)
				}
			/>
			<DateInput value={date} onChange={setDate} label="Date" />

			<FormControlLabel
				control={
					<Checkbox
						checked={withUntilDate}
						onChange={(e) => {
							const checked = e.target.checked;
							setUntilDate(checked ? new Date() : undefined);
							setWithUntilDate(checked);
						}}
					/>
				}
				label="With Until Date"
			/>
			{withUntilDate ? (
				<DateInput
					value={untilDate}
					onChange={setUntilDate}
					label="Until Date"
				/>
			) : undefined}
			<SelectWithCreation
				id="brand"
				label="Brand"
				item={brand ?? ""}
				items={brands.map((b) => b.value)}
				onChange={setBrand}
			/>
			<SelectWithCreation
				id="store"
				label="Store"
				item={store ?? ""}
				items={stores.map((s) => s.value)}
				onChange={setStore}
			/>
			<Input<string>
				id="frequency"
				label="Frequency"
				value={frequency ?? ""}
				onChange={setFrequency}
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
							values={accounts.map((acc) => acc.id.value)}
							onChange={(val) => {
								const newSplits = [...fromSplits];
								newSplits[idx].accountId = val;
								setFromSplits(newSplits);
							}}
						/>
						<span>
							{accounts.find(
								(acc) => acc.id.value === split.accountId
							)?.name.value || ""}
						</span>
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
							values={accounts.map((acc) => acc.id.value)}
							onChange={(val) => {
								const newSplits = [...toSplits];
								newSplits[idx].accountId = val;
								setToSplits(newSplits);
							}}
						/>
						<span>
							{accounts.find(
								(acc) => acc.id.value === split.accountId
							)?.name.value || ""}
						</span>
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
			{typeof modifyNItemRecurrence.execute === "function" ? (
				<button
					onClick={async () => {
						// If split editing is not supported in recurrence modification, show warning
						// Otherwise, pass splits as needed
						// Example: (if supported)
						// const fromSplitObjs = fromSplits.map(s => new PaymentSplit(new AccountID(s.accountId), new TransactionAmount(s.amount)));
						// const toSplitObjs = toSplits.map(s => new PaymentSplit(new AccountID(s.accountId), new TransactionAmount(s.amount)));
						// await modifyNItemRecurrence.execute({ ... , fromSplits: fromSplitObjs, toSplits: toSplitObjs, ... });
						// updateItems();
						// onClose();
						// For now, if not supported, just show a warning:
						alert(
							"Split editing for recurrences is not yet supported. Only non-split fields will be updated."
						);
					}}
				>
					Save
				</button>
			) : null}
		</div>
	);
};
