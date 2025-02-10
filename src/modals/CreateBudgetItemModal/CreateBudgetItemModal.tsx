import { useContext, useEffect, useMemo, useState } from "react";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { BudgetItemSimple } from "budget/BudgetItem/BudgetItemSimple";
import { BudgetItemRecordType } from "budget/BudgetItem/BugetItemRecord/BudgetItemRecord";
import { BudgetItemRecurrent } from "budget/BudgetItem/BudgetItemRecurrent";
import { FileOperationsContext } from "view/views/RightSidebarReactView/RightSidebarReactView";
import { Budget } from "budget/Budget/Budget";
import { Input } from "view/components/Input";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { SelectWithCreation } from "view/components/SelectWithCreation";
import { Select } from "view/components/Select";
import { Checkbox, FormControlLabel } from "@mui/material";
import { TBudgetItem } from "../../budget/BudgetItem/BudgetItem";

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
	const accounts = useMemo(() => [...budget.getAccounts()].sort(), [budget]);
	const categories = useMemo(
		() => [...budget.getCategories()].sort(),
		[budget]
	);
	const { refresh } = useContext(FileOperationsContext);
	const [selectedItem, setSelectedItem] = useState<BudgetItem | undefined>(
		undefined
	);

	const [item, setItem] = useState<BudgetItem>(BudgetItemSimple.empty());
	const [locks, setLocks] = useState<
		Omit<
			{
				[K in keyof TBudgetItem]: boolean;
			},
			"history" | "id" | "path"
		>
	>({
		account: false,
		name: false,
		amount: false,
		category: false,
		frequency: false,
		nextDate: false,
		toAccount: false,
		type: false,
	});
	const updateLock = (key: keyof TBudgetItem, value: boolean) => {
		setLocks({
			...locks,
			[key]: value,
		});
	};
	const [isRecurrent, setIsRecurrent] = useState(false);

	useEffect(() => {
		console.log({ selectedItem });
		if (selectedItem) {
			update({
				...selectedItem.toJSON(),
			});
			setIsRecurrent(!BudgetItemSimple.IsSimple(selectedItem));
		}
	}, [selectedItem]);

	useEffect(() => {
		update({ ...item.toJSON() });
	}, [isRecurrent]);

	useEffect(() => console.log({ itemChanged: item }), [item]);

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
		if (newValues.name !== undefined) toUpdate.name = newValues.name;
		if (newValues.date !== undefined) toUpdate.nextDate = newValues.date;
		if (newValues.type !== undefined) toUpdate.type = newValues.type;
		if (newValues.amount !== undefined) toUpdate.amount = newValues.amount;
		if (newValues.category !== undefined)
			toUpdate.category = newValues.category;
		if (newValues.toAccount) toUpdate.toAccount = newValues.toAccount;
		if (newValues.frequency !== undefined)
			toUpdate.frequency = newValues.frequency;

		if (newValues.account !== undefined)
			toUpdate.account = newValues.account;

		const newItem = isRecurrent
			? BudgetItemRecurrent.fromJSON(toUpdate)
			: BudgetItemSimple.fromJSON(toUpdate);

		newItem.setRandomId();

		console.log({
			toUpdate,
			isRecurrent,
			item: newItem,
		});

		setItem(newItem);
	};

	useEffect(() => {
		if (toEdit) setItem(toEdit);
	}, [toEdit]);

	return (
		<div className="create-budget-item-modal">
			<h1>Create Budget Item</h1>
			<SelectWithCreation<BudgetItem>
				id="name"
				label="Name"
				item={item}
				items={items}
				getLabel={(item) => {
					if (!item) return "";
					const label = `${
						item instanceof BudgetItemSimple &&
						!item.amount.isZero()
							? item.account
							: ""
					}${
						item.type === "transfer"
							? ` -> ${item.toAccount} - `
							: ""
					}${
						item.amount.isZero() ? "" : " " + item.amount.toString()
					}`;
					return label.length > 40
						? label.slice(0, 40) + "..."
						: label;
				}}
				getKey={(item) => item.name}
				setSelectedItem={setSelectedItem}
				onChange={(name) => {
					update({ name });
				}}
				isLocked={locks.name}
				setIsLocked={(value) => updateLock("name", value)}
			/>
			<SelectWithCreation
				id="category"
				label="Category"
				item={item.category}
				items={categories}
				onChange={(category) => update({ category })}
				isLocked={locks.category}
				setIsLocked={(value) => updateLock("category", value)}
			/>
			<div
				style={{
					display: "flex",
					justifyContent: "space-around",
					alignItems: "center",
				}}
			>
				<Select<BudgetItemRecordType>
					id="type"
					label="Type"
					value={item.type}
					values={["income", "expense", "transfer"]}
					onChange={(type) => update({ type })}
				/>
				<Input<PriceValueObject>
					id="amount"
					label="Amount"
					value={item.amount}
					onChange={(amount) => update({ amount: amount.toNumber() })}
					isLocked={locks.amount}
					setIsLocked={(value) => updateLock("amount", value)}
				/>
			</div>
			<div
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
					isLocked={locks.account}
					setIsLocked={(value) => updateLock("account", value)}
				/>
				{item.type === "transfer" && (
					<SelectWithCreation
						id="toAccount"
						label="Account: To"
						item={item.toAccount}
						items={accounts}
						onChange={(value) => update({ toAccount: value })}
						style={{
							flexGrow: 1,
						}}
						isLocked={locks.toAccount}
						setIsLocked={(value) => updateLock("toAccount", value)}
					/>
				)}
			</div>
			<Input<Date>
				id="date"
				label="Date"
				value={item.nextDate.toDate()}
				onChange={(nextDate) => update({ date: nextDate })}
				isLocked={locks.nextDate}
				setIsLocked={(value) => updateLock("nextDate", value)}
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
						itemToCreate: item,
					});
					await onSubmit(item);
					await refresh();
					setSelectedItem(
						BudgetItemSimple.create(
							locks.account ? item.account : "",
							locks.name ? item.name : "",
							locks.amount ? item.amount.toNumber() : 0,
							locks.category ? item.category : "",
							locks.type ? item.type : "expense",
							locks.nextDate ? item.nextDate : nextDate
						)
					);
				}}
			>
				Save & Create Another
			</button>
			<button
				onClick={async () => {
					const nextDate = new Date(item.nextDate);
					nextDate.setSeconds(0);
					console.log({ nextDate });
					console.log({
						itemToCreate: item,
					});
					await onSubmit(item);
					await refresh();
					close();
				}}
			>
				Create
			</button>
		</div>
	);
};
