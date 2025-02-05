import { useContext, useEffect, useMemo, useState } from "react";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { BudgetItemSimple } from "budget/BudgetItem/BudgetItemSimple";
import { BudgetItemRecurrent } from "budget/BudgetItem/BudgetItemRecurrent";
import { BudgetItemRecordType } from "budget/BudgetItem/BugetItemRecord/BudgetItemRecord";
import { Budget } from "budget/Budget/Budget";
import { FileOperationsContext } from "view/views/RightSidebarReactView/RightSidebarReactView";
import { Input } from "view/components/Input";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { SelectWithCreation } from "view/components/SelectWithCreation";
import { Select } from "view/components/Select";
import { Checkbox, FormControlLabel } from "@mui/material";

export const CreateBudgetItemModal = ({
	budget,
	onSubmit,
	close,
	toEdit,
}: {
	budget: Budget<BudgetItem>;
	onSubmit: (item: BudgetItem) => Promise<void>;
	close: () => void;
	toEdit?: BudgetItem;
}) => {
	const items = useMemo(
		() =>
			budget.items
				.filter((item, index, self) => {
					return (
						index === self.findIndex((o) => o.name === item.name)
					);
				})
				.sort((a, b) => a.name.localeCompare(b.name)),
		[budget]
	);
	// const history = useMemo(() => budget.getHistory(), [budget]);
	const accounts = useMemo(() => [...budget.getAccounts()].sort(), [budget]);
	const categories = useMemo(
		() => [...budget.getCategories()].sort(),
		[budget]
	);
	const { refresh } = useContext(FileOperationsContext);
	const [selectedItem, setSelectedItem] = useState<BudgetItem | undefined>(
		undefined
	);

	const [name, setName] = useState("");
	const [item, setItem] = useState<BudgetItem>(BudgetItemSimple.empty());
	const names = useMemo(() => items.map((item) => item.name), [items]);
	const [isRecurrent, setIsRecurrent] = useState(false);

	useEffect(() => {
		console.log({ selectedItem });
		if (selectedItem) {
			setName(selectedItem.name);
			setItem(selectedItem);
			setIsRecurrent(!BudgetItemSimple.IsSimple(selectedItem));
		}
	}, [selectedItem]);

	useEffect(() => {
		update({});
	}, [isRecurrent]);

	useEffect(() => console.log({ item }), [item]);

	const update = (newValues: {
		name?: string;
		account?: string;
		date?: Date;
		type?: BudgetItemRecordType;
		amount?: number;
		frequency?: string;
		category?: string;
		toAccount?: string;
	}) => {
		const toUpdate = item.toJSON();
		console.log({ toUpdate: { ...toUpdate }, newValues });
		if (newValues.name) {
			toUpdate.name = newValues.name;
			setName(newValues.name);
		}
		if (newValues.date) toUpdate.nextDate = newValues.date;
		if (newValues.type) toUpdate.type = newValues.type;
		if (newValues.amount) toUpdate.amount = newValues.amount;
		if (newValues.category) toUpdate.category = newValues.category;
		if (newValues.toAccount) toUpdate.toAccount = newValues.toAccount;
		if (newValues.frequency) toUpdate.frequency = newValues.frequency;

		if (newValues.account) toUpdate.account = newValues.account;

		console.log({
			toUpdate,
			isRecurrent,
			item: isRecurrent
				? BudgetItemRecurrent.fromJSON(toUpdate)
				: BudgetItemSimple.fromJSON(toUpdate),
		});

		setItem(
			isRecurrent
				? BudgetItemRecurrent.fromJSON(toUpdate)
				: BudgetItemSimple.fromJSON(toUpdate)
		);
	};

	useEffect(() => {
		if (toEdit) setItem(toEdit);
	}, [toEdit]);

	return (
		<div className="create-budget-item-modal">
			<h1>Create Budget Item</h1>
			<SelectWithCreation
				id="name"
				label="Name"
				item={name}
				items={names}
				getLabel={(name) => {
					if (!name) return "";
					const item = items.find((i) => i.name === name);
					if (!item) return "";
					return `${name}${
						item instanceof BudgetItemSimple &&
						!item.amount.isZero()
							? " - " + item.account
							: ""
					}${
						item.type === "transfer"
							? ` -> ${item.toAccount} - `
							: ""
					}${
						item.amount.isZero() ? "" : " " + item.amount.toString()
					}`;
				}}
				onCreationChange={(name) => update({ name })}
				onChange={(name) => {
					const item = items.find(
						(i) => i.name === name.split(" $")[0]
					);
					console.log({
						onChangeName: name.split(" $")[0],
						items,
						item,
					});
					if (item) {
						setSelectedItem(item);
					} else {
						update({ name: name.split(" $")[0] });
					}
				}}
			/>
			{/* <SelectWithCreation
				id="category"
				label="Category"
				item={item.category}
				items={categories}
				onChange={(category) => update({ category })}
			/> */}
			<Input<PriceValueObject>
				id="amount"
				label="Amount"
				value={item.amount}
				onChange={(amount) => update({ amount: amount.toNumber() })}
			/>
			<Select<BudgetItemRecordType>
				id="type"
				label="Type"
				value={item.type}
				values={["income", "expense", "transfer"]}
				onChange={(type) => update({ type })}
			/>
			{/* <div
				style={{
					display: "flex",
					justifyContent: "space-between",
					gap: "10px",
				}}
			>
				<SelectWithCreation
					id="account"
					label="Account: From"
					item={item.account}
					items={accounts}
					onChange={(value) => update({ account: value })}
					style={{
						flexGrow: 1,
					}}
				/>
				{item.type === "transfer" && (
					<SelectWithCreation
						id="toAccount"
						label="Account: To"
						item={item.toAccount ?? ""}
						items={accounts}
						onChange={(value) => update({ toAccount: value })}
						style={{
							flexGrow: 1,
						}}
					/>
				)}
			</div> */}
			<Input<Date>
				id="date"
				label="Date"
				value={item.nextDate.toDate()}
				onChange={(nextDate) => update({ date: nextDate })}
			/>
			<div style={{ display: "flex", alignItems: "center" }}>
				<FormControlLabel
					control={
						<Checkbox
							checked={isRecurrent}
							onChange={(e) => setIsRecurrent(e.target.checked)}
						/>
					}
					label="Recurrent"
				/>
				{isRecurrent && (
					<Input<string>
						id="frequency"
						label="Frequency"
						value={
							item instanceof BudgetItemRecurrent
								? item.frequency.toString()
								: ""
						}
						onChange={(frequency) => update({ frequency })}
					/>
				)}
			</div>
			<button
				onClick={async () => {
					const nextDate = new Date(item.nextDate);
					nextDate.setSeconds(0);
					console.log({ nextDate });
					console.log({
						item,
					});
					// await onSubmit(item);
					await refresh();
					close();
				}}
			>
				Create
			</button>
		</div>
	);
};
