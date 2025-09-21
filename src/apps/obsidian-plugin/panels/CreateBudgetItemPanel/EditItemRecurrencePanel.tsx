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
import { AccountID } from "contexts/Accounts/domain";
import {
	ItemBrand,
	ItemDate,
	ItemName,
	ItemRecurrenceInfo,
	ItemStore,
	ScheduledItem,
} from "contexts/Items/domain";
import { ItemOperation, OperationType } from "contexts/Shared/domain";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { useContext, useState } from "react";

export const EditItemRecurrencePanel = ({
	item,
	recurrence: { recurrence, n },
	onClose,
	context = "calendar",
	updateItems,
}: {
	item: ScheduledItem;
	recurrence: {
		recurrence: ItemRecurrenceInfo;
		n: NumberValueObject;
	};
	onClose: () => void;
	context?: "calendar" | "all-items";
	updateItems?: () => void;
}) => {
	const {
		useCases: { modifyNItemRecurrence, updateScheduledItem: updateItem },
	} = useContext(ItemsContext);
	const { brands, stores } = useContext(TransactionsContext);
	const { accounts } = useContext(AccountsContext);

	// Check if this is a single recurrence item
	const isSingleRecurrence = item.recurrence.isOneTime();

	// For calendar context, only show modification fields
	const isCalendarContext = context === "calendar";

	const [name, setName] = useState(item.name.value);
	const [type, setType] = useState(item.operation.type.value);

	const [brand, setBrand] = useState(
		recurrence.brand?.value ?? item.info?.brand?.value
	);
	const [store, setStore] = useState(
		recurrence.store?.value ?? item.info?.store?.value
	);
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
		recurrence.fromSplits?.map((split) => ({
			accountId: split.accountId.value,
			amount: split.amount,
		})) ??
			item.fromSplits.map((split) => ({
				accountId: split.accountId.value,
				amount: split.amount,
			}))
	);
	const [toSplits, setToSplits] = useState(
		recurrence.toSplits?.map((split) => ({
			accountId: split.accountId.value,
			amount: split.amount,
		})) ??
			item.toSplits.map((split) => ({
				accountId: split.accountId.value,
				amount: split.amount,
			}))
	);

	return (
		<div className="create-budget-item-modal">
			<h3>Edit Item</h3>

			{/* Context Warning - Only show for non-single recurrence items */}
			{!isSingleRecurrence && context === "calendar" && (
				<div
					style={{
						padding: "12px",
						marginBottom: "16px",
						backgroundColor: "var(--background-warning)",
						border: "1px solid var(--color-orange)",
						borderRadius: "6px",
						color: "var(--text-normal)",
						fontSize: "14px",
					}}
				>
					<strong>⚠️ Single Recurrence Edit</strong>
					<br />
					You are editing only this specific recurrence instance. To
					modify the entire scheduled item (affecting all future
					recurrences), use the "All Scheduled Items" tab instead.
				</div>
			)}

			{!isSingleRecurrence && context === "all-items" && (
				<div
					style={{
						padding: "12px",
						marginBottom: "16px",
						backgroundColor: "var(--background-warning)",
						border: "1px solid var(--color-orange)",
						borderRadius: "6px",
						color: "var(--text-normal)",
						fontSize: "14px",
					}}
				>
					<strong>⚠️ Full Item Edit</strong>
					<br />
					You are editing the entire scheduled item, which will affect
					all future recurrences. To modify only a specific recurrence
					instance, use the calendar view instead.
				</div>
			)}

			{/* Only show non-modification fields when not in calendar context */}
			{!isCalendarContext && (
				<>
					<Input
						id="name"
						label="Name"
						value={name}
						onChange={(name: string) => setName(name)}
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
					<FormControlLabel
						control={
							<Checkbox
								checked={withUntilDate}
								onChange={(e) => {
									const checked = e.target.checked;
									setUntilDate(
										checked ? new Date() : undefined
									);
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
					<Input<string>
						id="frequency"
						label="Frequency"
						value={frequency ?? ""}
						onChange={setFrequency}
					/>
				</>
			)}

			{/* Always show modification fields */}
			<DateInput value={date} onChange={setDate} label="Date" />

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

			{/* Save button - Different logic for single vs recurring items */}
			{isSingleRecurrence ? (
				// For single recurrence items, update the entire item
				typeof updateItem.execute === "function" ? (
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

							// Create a copy of the item and update it
							const updatedItem = item.copy();

							// Update basic properties only if not in calendar context
							if (!isCalendarContext) {
								updatedItem.updateName(new ItemName(name));
								updatedItem.updateOperation(
									ItemOperation.fromPrimitives({ type })
								);
							}

							// Update splits
							updatedItem.setFromSplits(fromSplitObjs);
							updatedItem.setToSplits(toSplitObjs);

							// Update recurrence with new date and brand/store
							const newRecurrence = new ItemRecurrenceInfo(
								new ItemDate(date),
								recurrence.state,
								fromSplitObjs,
								toSplitObjs,
								brand ? new ItemBrand(brand) : undefined,
								store ? new ItemStore(store) : undefined
							);

							// Update the recurrence
							updatedItem.modifyRecurrence(0, newRecurrence);

							await updateItem.execute(updatedItem);

							// Call updateItems if provided to refresh the list
							updateItems?.();

							// Close the panel after successful update and refresh
							onClose();
						}}
					>
						Save
					</button>
				) : null
			) : // For recurring items, use the existing modifyNItemRecurrence logic
			typeof modifyNItemRecurrence.execute === "function" ? (
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

						// Create the new recurrence info with custom splits and brand/store
						const newRecurrence = new ItemRecurrenceInfo(
							new ItemDate(date),
							recurrence.state,
							fromSplitObjs,
							toSplitObjs,
							brand ? new ItemBrand(brand) : undefined,
							store ? new ItemStore(store) : undefined
						);

						await modifyNItemRecurrence.execute({
							id: item.id,
							n,
							newRecurrence,
						});

						// Call updateItems if provided to refresh the list
						updateItems?.();

						// Close the panel after successful update and refresh
						onClose();
					}}
				>
					Save
				</button>
			) : null}
		</div>
	);
};
