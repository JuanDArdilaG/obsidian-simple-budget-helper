import { useContext, useMemo, useState } from "react";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { ItemName } from "contexts/SimpleItems/domain";
import { ItemsContext } from "apps/obsidian-plugin/views";
import {
	Select,
	SelectWithCreation,
	useAccountSelect,
} from "apps/obsidian-plugin/components/Select";
import { OperationType } from "contexts/Shared/domain";
import { useCategorySelect } from "apps/obsidian-plugin/components/Select/useCategorySelect";
import { useSubCategorySelect } from "apps/obsidian-plugin/components/Select/useSubCategorySelect";
import { Checkbox, FormControlLabel } from "@mui/material";
import {
	ScheduledItem,
	ScheduledItemDate,
	ScheduledItemNextDate,
} from "contexts/ScheduledItems/domain";
import { NumberValueObject } from "@juandardilag/value-objects/NumberValueObject";
import { Input } from "apps/obsidian-plugin/components/Input/Input";

export const EditScheduledItemPanel = ({
	recurrence,
	onClose,
}: {
	recurrence: { item: ScheduledItem; n: NumberValueObject } | ScheduledItem;
	onClose: () => void;
}) => {
	const {
		useCases: {
			updateScheduledItemUseCase,
			modifyNScheduledItemRecurrence,
		},
		updateScheduledItems,
	} = useContext(ItemsContext);
	const { brands, stores } = useContext(ItemsContext);

	const item = useMemo(
		() =>
			recurrence instanceof ScheduledItem ? recurrence : recurrence.item,
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
		initialValueID: item.subCategory.value,
	});

	const [name, setName] = useState(item.name.value);
	const [amount, setAmount] = useState(item.price);
	const [type, setType] = useState(item.operation.value);

	const [brand, setBrand] = useState(item.brand?.value);
	const [store, setStore] = useState(item.store?.value);
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
	const [validation, setValidation] = useState<
		Record<string, boolean> | undefined
	>(undefined);

	return (
		<div className="create-budget-item-modal">
			<h3>Edit Scheduled Item</h3>
			<Input
				id="name"
				label="Name"
				value={name}
				onChange={(name: string) => setName(name)}
				error={!validation || validation.name ? undefined : "required"}
			/>
			<Input<PriceValueObject>
				id="amount"
				label="Amount"
				value={amount}
				onChange={setAmount}
				error={
					!validation || validation.amount ? undefined : "required"
				}
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
			<Input<Date>
				dateWithTime={false}
				id="date"
				label="Next Date"
				value={date}
				onChange={setDate}
				error={!validation || validation.date ? undefined : "required"}
			/>

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
				<Input<Date>
					dateWithTime={false}
					id="date"
					label="Until Date"
					value={untilDate}
					onChange={setUntilDate}
					error={
						!validation || validation.untilDate
							? undefined
							: "required"
					}
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
			{type === "transfer" && (
				<Input<string>
					id="frequency"
					label="Frequency"
					value={frequency ?? ""}
					onChange={setFrequency}
					error={
						!validation || validation.frequency
							? undefined
							: "required"
					}
				/>
			)}
			<button
				onClick={async () => {
					date.setSeconds(0);

					if (recurrence instanceof ScheduledItem) {
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
							item.updateDate(new ScheduledItemDate(date));

						if (withUntilDate)
							item.recurrence?.updateUntilDate(
								new ScheduledItemNextDate(
									untilDate ?? new Date()
								)
							);
						await updateScheduledItemUseCase.execute(item);
					} else {
						await modifyNScheduledItemRecurrence.execute({
							id: item.id,
							n: recurrence.n,
							modifications: {
								date:
									date !== item.date.value
										? new ScheduledItemDate(date)
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

					updateScheduledItems();

					onClose();
				}}
			>
				Create
			</button>
		</div>
	);
};
