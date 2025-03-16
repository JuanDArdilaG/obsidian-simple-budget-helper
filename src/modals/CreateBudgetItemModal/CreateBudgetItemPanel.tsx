import { useContext, useEffect, useMemo, useState } from "react";
import { BudgetItem, BudgetItemValidator } from "budget/BudgetItem/BudgetItem";
import { BudgetItemSimple } from "budget/BudgetItem/BudgetItemSimple";
import { BudgetItemRecordType } from "budget/BudgetItem/BugetItemRecord/BudgetItemRecord";
import { BudgetItemRecurrent } from "budget/BudgetItem/BudgetItemRecurrent";
import {
	BudgetContext,
	FileOperationsContext,
} from "view/views/RightSidebarReactView/RightSidebarReactView";
import { Budget } from "budget/Budget/Budget";
import { Input } from "view/components/Input";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { SelectWithCreation } from "view/components/SelectWithCreation";
import { Checkbox, FormControlLabel } from "@mui/material";
import { TBudgetItem } from "../../budget/BudgetItem/BudgetItem";
import { useBITypeAndAccountsFormFields } from "./useBITypeAndAccountsFormFields";
import { Logger } from "utils/logger";
import { BudgetItemNextDate } from "budget/BudgetItem/BudgetItemNextDate";

const validator = new BudgetItemValidator();

export const CreateBudgetItemPanel = ({
	budget,
	close,
}: {
	budget: Budget<BudgetItem>;
	close: () => void;
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
	const [item, setItem] = useState<BudgetItem>(BudgetItemSimple.empty());
	const categories = useMemo(
		() => [...budget.getCategories({ order: "asc" })],
		[budget]
	);
	const subCategories = useMemo(
		() => [
			...budget.getSubCategories({
				category: item.category,
				sort: { order: "asc" },
			}),
		],
		[budget, item.category]
	);
	const brands = useMemo(
		() => [...budget.getBrands({ order: "asc" })],
		[budget]
	);
	const stores = useMemo(
		() => [...budget.getStores({ order: "asc" })],
		[budget]
	);

	const { refresh, itemOperations } = useContext(FileOperationsContext);
	const { updateBudget } = useContext(BudgetContext);
	const [selectedItem, setSelectedItem] = useState<BudgetItem | undefined>(
		undefined
	);

	const [locks, setLocks] = useState<
		Omit<
			{
				[K in keyof TBudgetItem]: boolean;
			},
			"history" | "id" | "path" | "account" | "toAccount" | "type"
		>
	>({
		name: false,
		amount: false,
		category: false,
		subcategory: false,
		brand: false,
		store: false,
		frequency: false,
		nextDate: false,
	});
	const updateLock = (key: keyof TBudgetItem, value: boolean) => {
		setLocks({
			...locks,
			[key]: value,
		});
	};
	const [isRecurrent, setIsRecurrent] = useState(false);

	const {
		accountsInputs,
		account,
		toAccount,
		type,
		lockAccount,
		lockToAccount,
		lockType,
	} = useBITypeAndAccountsFormFields({
		budget,
		item,
		setAccount: (account) => update({ account }),
		setToAccount: (account) => update({ toAccount: account }),
		setType: (type) => update({ type }),
	});

	useEffect(() => {
		console.log({ selectedItem });
		if (selectedItem) {
			const json = selectedItem.toJSON();
			const toUpdate: Partial<TBudgetItem> = {};
			Logger.debug(
				"type and accounts fields",
				{
					lockAccount,
					lockToAccount,
					type,
					account,
					toAccount,
					lockType,
				},
				{ on: false }
			);
			if (!lockType) toUpdate.type = json.type;
			if (!locks.name) toUpdate.name = json.name;
			if (!locks.amount) toUpdate.amount = json.amount;
			if (!locks.category) toUpdate.category = json.category;
			if (!locks.subcategory) toUpdate.subcategory = json.subcategory;
			if (!locks.brand) toUpdate.brand = json.brand;
			if (!locks.store) toUpdate.store = json.store;
			if (!locks.nextDate) toUpdate.nextDate = json.nextDate;
			if (!lockToAccount) toUpdate.toAccount = json.toAccount;
			if (!lockAccount) toUpdate.account = json.account;
			if (!locks.frequency) toUpdate.frequency = json.frequency;

			setIsRecurrent(!BudgetItemSimple.IsSimple(selectedItem));
			update(toUpdate);
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
		subcategory?: string;
		toAccount?: string;
		brand?: string;
		store?: string;
	}) => {
		const toUpdate = item.toJSON();
		console.log({ toUpdate: { ...toUpdate }, newValues });
		if (newValues.name !== undefined) toUpdate.name = newValues.name;
		if (newValues.date !== undefined) toUpdate.nextDate = newValues.date;
		if (newValues.type !== undefined) toUpdate.type = newValues.type;
		if (newValues.amount !== undefined) toUpdate.amount = newValues.amount;
		if (newValues.category !== undefined)
			toUpdate.category = newValues.category;
		if (newValues.subcategory !== undefined)
			toUpdate.subcategory = newValues.subcategory;
		if (newValues.brand !== undefined) toUpdate.brand = newValues.brand;
		if (newValues.store !== undefined) toUpdate.store = newValues.store;
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
			isRecurrent,
			newValues,
			toUpdate,
			item: newItem,
		});

		setItem(newItem);
	};

	const [validation, setValidation] = useState(validator.getAllTrue());

	const handleSubmit = (withClose: boolean) => async () => {
		const nextDate = new Date(item.nextDate);
		nextDate.setSeconds(0);
		console.log({ nextDate });
		console.log({
			itemToCreate: item,
		});
		item.update({
			account,
			toAccount,
			type,
		});
		const result = validator.validate(item);
		if (!result) return setValidation(result);

		await itemOperations(item, "add");
		await updateBudget();

		await refresh();

		if (withClose) close();
		setSelectedItem(
			BudgetItemSimple.create(
				lockAccount ? item.account : "",
				locks.name ? item.name : "",
				locks.amount ? item.amount.toNumber() : 0,
				locks.category ? item.category : "",
				locks.subcategory ? item.subCategory : "",
				locks.brand ? item.brand : "",
				locks.store ? item.store : "",
				"expense",
				locks.nextDate
					? item.nextDate
					: new BudgetItemNextDate(new Date())
			)
		);
	};

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
				error={validation.check("name") ?? undefined}
			/>
			<div
				style={{
					display: "flex",
					alignItems: "space-around",
				}}
			>
				<Input<PriceValueObject>
					id="amount"
					label="Amount"
					style={{ flexGrow: 1 }}
					value={item.amount}
					onChange={(amount) => update({ amount: amount.toNumber() })}
					isLocked={locks.amount}
					setIsLocked={(value) => updateLock("amount", value)}
					error={validation.check("amount") ?? undefined}
				/>
				<SelectWithCreation
					id="category"
					label="Category"
					style={{ flexGrow: 1 }}
					item={item.category}
					items={categories}
					onChange={(category) => update({ category })}
					isLocked={locks.category}
					setIsLocked={(value) => updateLock("category", value)}
					error={validation.check("category") ?? undefined}
				/>
				<SelectWithCreation
					id="subcategory"
					label="SubCategory"
					style={{ flexGrow: 1 }}
					item={item.subCategory}
					items={subCategories}
					onChange={(subcategory) => update({ subcategory })}
					isLocked={locks.subcategory}
					setIsLocked={(value) => updateLock("subcategory", value)}
					error={validation.check("subcategory") ?? undefined}
				/>
			</div>
			{accountsInputs}
			<Input<Date>
				id="date"
				label="Date"
				value={item.nextDate.toDate()}
				onChange={(nextDate) => update({ date: nextDate })}
				isLocked={locks.nextDate}
				setIsLocked={(value) => updateLock("nextDate", value)}
				error={validation.check("nextDate") ?? undefined}
			/>
			{type === "expense" && (
				<>
					<SelectWithCreation
						id="brand"
						label="Brand"
						style={{ flexGrow: 1 }}
						item={item.brand}
						items={brands}
						onChange={(brand) => update({ brand })}
						isLocked={locks.brand}
						setIsLocked={(value) => updateLock("brand", value)}
						error={validation.check("brand") ?? undefined}
					/>
					<SelectWithCreation
						id="store"
						label="Store"
						style={{ flexGrow: 1 }}
						item={item.store}
						items={stores}
						onChange={(store) => update({ store })}
						isLocked={locks.store}
						setIsLocked={(value) => updateLock("store", value)}
						error={validation.check("store") ?? undefined}
					/>
				</>
			)}
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
						isLocked={locks.frequency}
						setIsLocked={(value) => updateLock("frequency", value)}
						error={validation.check("frequency") ?? undefined}
					/>
				)}
			</div>
			<button onClick={handleSubmit(false)}>Save & Create Another</button>
			<button onClick={handleSubmit(true)}>Save & Finish</button>
		</div>
	);
};
