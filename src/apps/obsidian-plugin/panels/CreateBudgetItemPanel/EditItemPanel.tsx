import { useContext, useState } from "react";
import {
	Item,
	ItemName,
	ItemRecurrence,
	ItemRecurrenceFrequency,
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
import { Input } from "apps/obsidian-plugin/components/Input/Input";
import { PriceInput } from "apps/obsidian-plugin/components/Input/PriceInput";
import { DateInput } from "apps/obsidian-plugin/components/Input/DateInput";
import {
	DateValueObject,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { useCreateRecurrenceForm } from "./useCreateRecurrenceForm";

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
		initialValueID: item.operation.account.value,
	});
	const { AccountSelect: ToAccountSelect, account: toAccount } =
		useAccountSelect({
			label: "To",
			initialValueID: item.operation.toAccount?.value,
		});
	const { CategorySelect, category } = useCategorySelect({
		initialValueID: item.category.value,
	});
	const { SubCategorySelect, subCategory } = useSubCategorySelect({
		category,
		initialValueID: item.subCategory.value,
	});

	const {
		RecurrenceForm,
		untilDate,
		frequencyString,
		recurrenceType,
		recurrences,
	} = useCreateRecurrenceForm({ recurrence: item.recurrence });

	const [name, setName] = useState(item.name.value);
	const [amount, setAmount] = useState(item.price);
	const [type, setType] = useState(item.operation.type.value);

	const [brand, setBrand] = useState(item.info?.value.brand?.value);
	const [store, setStore] = useState(item.info?.value.store?.value);

	const [date, setDate] = useState(item.recurrence.startDate.value);

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
			{RecurrenceForm}
			<button
				onClick={async () => {
					account && item.operation.updateAccount(account.id);
					item.operation.updateToAccount(toAccount?.id);
					item.updatePrice(amount);
					item.updateName(new ItemName(name));
					item.recurrence.updateStartDate(new DateValueObject(date));
					category && item.updateCategory(category.id);
					subCategory && item.updateSubCategory(subCategory.id);
					item.updateRecurrence(
						recurrenceType === "oneTime"
							? ItemRecurrence.oneTime(new DateValueObject(date))
							: recurrenceType === "infinite"
							? ItemRecurrence.infinite(
									new DateValueObject(date),
									new ItemRecurrenceFrequency(frequencyString)
							  )
							: untilDate
							? ItemRecurrence.untilDate(
									new DateValueObject(date),
									new ItemRecurrenceFrequency(
										frequencyString
									),
									new DateValueObject(untilDate)
							  )
							: ItemRecurrence.untilNRecurrences(
									new DateValueObject(date),
									new ItemRecurrenceFrequency(
										frequencyString
									),
									new NumberValueObject(recurrences)
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
