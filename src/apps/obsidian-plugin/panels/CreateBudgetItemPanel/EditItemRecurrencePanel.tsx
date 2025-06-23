import { NumberValueObject } from "@juandardilag/value-objects";
import { Checkbox, FormControlLabel } from "@mui/material";
import { DateInput } from "apps/obsidian-plugin/components/Input/DateInput";
import { Input } from "apps/obsidian-plugin/components/Input/Input";
import { PriceInput } from "apps/obsidian-plugin/components/Input/PriceInput";
import {
	Select,
	SelectWithCreation,
	useAccountSelect,
} from "apps/obsidian-plugin/components/Select";
import { ItemsContext, TransactionsContext } from "apps/obsidian-plugin/views";
import {
	ERecurrenceState,
	Item,
	ItemDate,
	ItemRecurrenceInfo,
} from "contexts/Items/domain";
import { OperationType } from "contexts/Shared/domain";
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
			/>
			<button
				onClick={async () => {
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
