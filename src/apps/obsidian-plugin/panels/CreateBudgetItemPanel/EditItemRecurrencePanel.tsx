import { useContext, useState } from "react";
import {
	Item,
	ItemDate,
	ItemRecurrenceInfo,
	ERecurrenceState,
} from "contexts/Items/domain";
import { ItemsContext, TransactionsContext } from "apps/obsidian-plugin/views";
import {
	Select,
	SelectWithCreation,
	useAccountSelect,
} from "apps/obsidian-plugin/components/Select";
import { OperationType } from "contexts/Shared/domain";
import { Checkbox, FormControlLabel } from "@mui/material";
import { NumberValueObject } from "@juandardilag/value-objects";
import { Input } from "apps/obsidian-plugin/components/Input/Input";
import { PriceInput } from "apps/obsidian-plugin/components/Input/PriceInput";
import { DateInput } from "apps/obsidian-plugin/components/Input/DateInput";

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
		updateItems,
	} = useContext(ItemsContext);
	const { brands, stores } = useContext(TransactionsContext);

	const { AccountSelect, account } = useAccountSelect({
		label: "From",
		initialValueID: recurrence.account?.value,
	});
	const { AccountSelect: ToAccountSelect, account: toAccount } =
		useAccountSelect({
			label: "To",
			initialValueID: recurrence.toAccount?.value,
		});

	const [name, setName] = useState(item.name.value);
	const [amount, setAmount] = useState(item.price);
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
			<PriceInput
				id="amount"
				label="Amount"
				value={amount}
				onChange={setAmount}
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
			{AccountSelect}
			{type === "transfer" ? ToAccountSelect : undefined}
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
				// error={
				// 	!validation || validation.frequency ? undefined : "required"
				// }
			/>
			<button
				onClick={async () => {
					// if (recurrence instanceof Item && item.recurrence) {
					// 	account &&
					// 		!account.id.equalTo(item.account) &&
					// 		item.updateAccount(account.id);
					// 	toAccount &&
					// 		item.toAccount &&
					// 		toAccount.id.equalTo(item.toAccount) &&
					// 		item.updateToAccount(toAccount?.id);
					// 	!amount.equalTo(item.price) && item.updatePrice(amount);
					// 	name !== item.name.value &&
					// 		item.updateName(new ItemName(name));
					// 	category &&
					// 		!category.id.equalTo(item.category) &&
					// 		item.updateCategory(category.id);
					// 	subCategory &&
					// 		!subCategory.id.equalTo(item.subCategory) &&
					// 		item.updateSubCategory(subCategory.id);
					// 	frequency &&
					// 		frequency !== item.recurrence?.frequency.value &&
					// 		item.updateRecurrence(
					// 			new ItemRecurrence(
					// 				item.id,
					// 				item.recurrence.startDate,
					// 				new ItemRecurrenceFrequency(frequency),
					// 				withUntilDate
					// 					? new ItemRecurrenceUntilDate(
					// 							untilDate ?? new Date()
					// 					  )
					// 					: undefined
					// 			)
					// 		);

					// 	await updateItem.execute(item);
					// } else {
					await modifyNItemRecurrence.execute({
						id: item.id,
						n: n,
						newRecurrence: new ItemRecurrenceInfo(
							date !== recurrence.date.value
								? new ItemDate(date)
								: recurrence.date,
							ERecurrenceState.PENDING,
							!amount.equalTo(item.price) ? amount : item.price,
							account &&
							!account.id.equalTo(item.operation.account)
								? account?.id
								: undefined,
							toAccount &&
							item.operation.toAccount &&
							toAccount.id.equalTo(item.operation.toAccount)
								? toAccount.id
								: undefined
						),
					});
					// }

					updateItems();

					onClose();
				}}
			>
				Create
			</button>
		</div>
	);
};
