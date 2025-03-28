import { useContext, useState } from "react";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import {
	ItemName,
	RecurrentItem,
	RecurrentItemNextDate,
} from "contexts/Items/domain";
import { ItemsContext } from "apps/obsidian-plugin/views";
import {
	Input,
	Select,
	SelectWithCreation,
	useAccountSelect,
} from "apps/obsidian-plugin/components";
import { OperationType } from "contexts/Shared/domain";
import { useCategorySelect } from "apps/obsidian-plugin/components/Select/CategorySelect";
import { useSubCategorySelect } from "apps/obsidian-plugin/components/Select/SubCategorySelect";
import { Checkbox, FormControlLabel } from "@mui/material";

export const EditRecurrentItemPanel = ({
	item,
	onClose,
}: {
	item: RecurrentItem;
	onClose: () => void;
}) => {
	const {
		useCases: { updateItem },
	} = useContext(ItemsContext);
	const { brands, stores } = useContext(ItemsContext);

	const { AccountSelect, account } = useAccountSelect({
		label: "From",
		initialValueID: item.account,
	});
	const { AccountSelect: ToAccountSelect, account: toAccount } =
		useAccountSelect({ label: "To", initialValueID: item.toAccount });
	const { CategorySelect, category } = useCategorySelect({
		initialValueID: item.category,
	});
	const { SubCategorySelect, subCategory } = useSubCategorySelect({
		initialValueID: item.subCategory,
	});

	const [name, setName] = useState(item.name.value);
	const [amount, setAmount] = useState(item.price);
	const [type, setType] = useState(item.operation.value);

	const [brand, setBrand] = useState(item.brand?.value);
	const [store, setStore] = useState(item.store?.value);
	const [frequency, setFrequency] = useState(item.frequency?.value);

	const [date, setDate] = useState(item.nextDate.valueOf());
	const [untilDate, setUntilDate] = useState(item.untilDate?.valueOf());
	const [withUntilDate, setWithUntilDate] = useState(!!item.untilDate);
	const [validation, setValidation] = useState<
		Record<string, boolean> | undefined
	>(undefined);

	return (
		<div className="create-budget-item-modal">
			<h3>Edit Recurrent Item</h3>
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

					item.update({
						name: new ItemName(name),
						account: account?.id,
						toAccount: toAccount?.id,
						amount,
						category: category?.id,
						subCategory: subCategory?.id,
						nextDate: new RecurrentItemNextDate(date),
					});
					if (withUntilDate)
						item.updateUntilDate(
							new RecurrentItemNextDate(untilDate ?? new Date())
						);

					await updateItem.execute(item);

					onClose();
				}}
			>
				Create
			</button>
		</div>
	);
};
