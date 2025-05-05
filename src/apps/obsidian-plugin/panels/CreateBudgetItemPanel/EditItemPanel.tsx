import { useContext, useState } from "react";
import {
	Item,
	ItemDate,
	ItemName,
	ItemRecurrence,
	ItemRecurrenceFrequency,
	ItemRecurrenceUntilDate,
} from "contexts/Items/domain";
import { ItemsContext, TransactionsContext } from "apps/obsidian-plugin/views";
import {
	Select,
	SelectWithCreation,
	useAccountSelect,
	useCategorySelect,
	useSubCategorySelect,
} from "apps/obsidian-plugin/components/Select";
import { OperationType } from "contexts/Shared/domain";
import { Checkbox, FormControlLabel } from "@mui/material";
import { Input } from "apps/obsidian-plugin/components/Input/Input";
import { PriceInput } from "apps/obsidian-plugin/components/Input/PriceInput";
import { DateInput } from "apps/obsidian-plugin/components/Input/DateInput";
import { DateValueObject } from "@juandardilag/value-objects";

export const EditItemPanel = ({
	item,
	onClose,
}: {
	item: Item;
	onClose: () => void;
}) => {
	const {
		useCases: { updateItem },
		updateItems,
	} = useContext(ItemsContext);
	const { brands, stores } = useContext(TransactionsContext);

	const { AccountSelect, account } = useAccountSelect({
		label: "From",
		initialValueID: item.account.value,
	});
	const { AccountSelect: ToAccountSelect, account: toAccount } =
		useAccountSelect({
			label: "To",
			initialValueID: item.toAccount?.value,
		});
	const { CategorySelect, category } = useCategorySelect({
		initialValueID: item.category.value,
	});
	const { SubCategorySelect, subCategory } = useSubCategorySelect({
		category,
		initialValueID: item.subCategory.value,
	});

	const [name, setName] = useState(item.name.value);
	const [amount, setAmount] = useState(item.price);
	const [type, setType] = useState(item.operation.value);

	const [brand, setBrand] = useState(item.info?.value.brand?.value);
	const [store, setStore] = useState(item.info?.value.store?.value);
	const [frequency, setFrequency] = useState(
		item.recurrence?.frequency.value
	);

	const [date, setDate] = useState(
		item.recurrence?.startDate.value ?? item.recurrences[0].date
	);
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
			{CategorySelect}
			{SubCategorySelect}
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
					account &&
						!account.id.equalTo(item.account) &&
						item.updateAccount(account.id);
					toAccount &&
						item.toAccount &&
						toAccount.id.equalTo(item.toAccount) &&
						item.updateToAccount(toAccount?.id);
					!amount.equalTo(item.price) && item.updatePrice(amount);
					name !== item.name.value &&
						item.updateName(new ItemName(name));
					if (!item.recurrence)
						item.recurrences[0].updateDate(new ItemDate(date));
					category &&
						!category.id.equalTo(item.category) &&
						item.updateCategory(category.id);
					subCategory &&
						!subCategory.id.equalTo(item.subCategory) &&
						item.updateSubCategory(subCategory.id);
					item.recurrence &&
						item.updateRecurrence(
							new ItemRecurrence(
								item.id,
								new DateValueObject(date),
								new ItemRecurrenceFrequency(
									frequency ?? item.recurrence.frequency.value
								),
								withUntilDate && untilDate
									? new ItemRecurrenceUntilDate(untilDate)
									: item.recurrence.untilDate
							)
						);

					await updateItem.execute(item);

					updateItems();

					onClose();
				}}
			>
				Create
			</button>
		</div>
	);
};
