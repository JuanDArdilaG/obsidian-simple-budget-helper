import {
	DateValueObject,
	NumberValueObject,
	PriceValueObject,
} from "@juandardilag/value-objects";
import { DateInput } from "apps/obsidian-plugin/components/Input/DateInput";
import { Input } from "apps/obsidian-plugin/components/Input/Input";
import { PriceInput } from "apps/obsidian-plugin/components/Input/PriceInput";
import {
	Select,
	SelectWithCreation,
	useAccountSelect,
	useCategorySelect,
	useSubCategorySelect,
} from "apps/obsidian-plugin/components/Select";
import { ItemsContext, TransactionsContext } from "apps/obsidian-plugin/views";
import {
	ItemName,
	ItemRecurrence,
	ItemRecurrenceFrequency,
	ScheduledItem,
} from "contexts/Items/domain";
import { OperationType } from "contexts/Shared/domain";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { useContext, useState } from "react";
import { useCreateRecurrenceForm } from "./useCreateRecurrenceForm";

export const EditItemPanel = ({
	item,
	onClose,
	context = "all-items",
}: {
	item: ScheduledItem;
	onClose: () => void;
	context?: "calendar" | "all-items";
}) => {
	const {
		useCases: { updateItem },
		updateItems,
	} = useContext(ItemsContext);
	const { brands, stores } = useContext(TransactionsContext);

	const { AccountSelect, account } = useAccountSelect({
		label: "From",
		initialValueID: item.fromSplits[0]?.accountId.value,
	});
	const { AccountSelect: ToAccountSelect, account: toAccount } =
		useAccountSelect({
			label: "To",
			initialValueID: item.toSplits[0]?.accountId.value,
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
	const [amount, setAmount] = useState(item.fromAmount.value);
	const [type, setType] = useState(item.operation.type.value);

	const [brand, setBrand] = useState(item.info?.brand?.value);
	const [store, setStore] = useState(item.info?.store?.value);

	const [date, setDate] = useState(item.recurrence.startDate.value);

	return (
		<div className="create-budget-item-modal">
			<h3>Edit Item</h3>

			{/* Context Warning */}
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
				You are editing the entire scheduled item, which will affect all
				future recurrences. To modify only a specific recurrence
				instance, use the calendar view instead.
			</div>

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
				value={new PriceValueObject(amount)}
				onChange={(val) => setAmount(val.toNumber())}
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
					if (account) {
						item.setFromSplits([
							new PaymentSplit(
								account.id,
								new TransactionAmount(amount)
							),
						]);
					}
					if (toAccount) {
						item.setToSplits([
							new PaymentSplit(
								toAccount.id,
								new TransactionAmount(amount)
							),
						]);
					}
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
