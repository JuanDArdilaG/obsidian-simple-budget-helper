import { useContext, useMemo, useState } from "react";
import {
	ItemName,
	ItemRecurrence,
	ItemRecurrenceFrequency,
	ItemRecurrenceUntilDate,
	Item,
	ItemDate,
} from "contexts/Items/domain";
import { ItemsContext, TransactionsContext } from "apps/obsidian-plugin/views";
import {
	Select,
	SelectWithCreation,
	useAccountSelect,
} from "apps/obsidian-plugin/components/Select";
import { OperationType } from "contexts/Shared/domain";
import { useCategorySelect } from "apps/obsidian-plugin/components/Select/useCategorySelect";
import { useSubCategorySelect } from "apps/obsidian-plugin/components/Select/useSubCategorySelect";
import { Checkbox, FormControlLabel } from "@mui/material";
import { NumberValueObject } from "@juandardilag/value-objects";
import { Input } from "apps/obsidian-plugin/components/Input/Input";
import { PriceInput } from "apps/obsidian-plugin/components/Input/PriceInput";
import { DateInput } from "apps/obsidian-plugin/components/Input/DateInput";

export const EditItemPanel = ({
	recurrence,
	onClose,
}: {
	recurrence: { item: Item; n: NumberValueObject } | Item;
	onClose: () => void;
}) => {
	const {
		useCases: { updateItem, modifyNItemRecurrence },
		updateItems,
	} = useContext(ItemsContext);
	const { brands, stores } = useContext(TransactionsContext);

	const item = useMemo(
		() => (recurrence instanceof Item ? recurrence : recurrence.item),
		[recurrence]
	);

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

	const [date, setDate] = useState(item.date.value);
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
			<DateInput value={date} onChange={setDate} label="NextDate" />

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
					date.setSeconds(0);

					if (recurrence instanceof Item) {
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
						category &&
							!category.id.equalTo(item.category) &&
							item.updateCategory(category.id);
						subCategory &&
							!subCategory.id.equalTo(item.subCategory) &&
							item.updateSubCategory(subCategory.id);
						date !== item.date.value &&
							item.updateDate(new ItemDate(date));
						frequency &&
							frequency !== item.recurrence?.frequency.value &&
							item.updateRecurrence(
								new ItemRecurrence(
									item.id,
									item.date,
									new ItemRecurrenceFrequency(frequency),
									undefined,
									withUntilDate
										? new ItemRecurrenceUntilDate(
												untilDate ?? new Date()
										  )
										: undefined
								)
							);

						await updateItem.execute(item);
					} else {
						await modifyNItemRecurrence.execute({
							id: item.id,
							n: recurrence.n,
							modifications: {
								date:
									date !== item.date.value
										? new ItemDate(date)
										: undefined,
								account:
									account && !account.id.equalTo(item.account)
										? account?.id
										: undefined,
								toAccount:
									toAccount &&
									item.toAccount &&
									toAccount.id.equalTo(item.toAccount)
										? toAccount.id
										: undefined,
								price: !amount.equalTo(item.price)
									? amount
									: undefined,
							},
						});
					}

					updateItems();

					onClose();
				}}
			>
				Create
			</button>
		</div>
	);
};
