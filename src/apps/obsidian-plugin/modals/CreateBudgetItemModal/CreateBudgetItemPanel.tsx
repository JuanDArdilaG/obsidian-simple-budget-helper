import { useContext, useEffect, useState } from "react";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { Checkbox, FormControlLabel } from "@mui/material";
import { useBITypeAndAccountsFormFields } from "./useBITypeAndAccountsFormFields";
import { Logger } from "../../../../contexts/Shared/infrastructure/logger";
import { SelectWithCreation } from "apps/obsidian-plugin/view/components/SelectWithCreation";
import {
	Item,
	ItemBrand,
	ItemCategory,
	ItemID,
	ItemName,
	ItemOperation,
	ItemPrice,
	ItemPrimitives,
	ItemStore,
	ItemSubcategory,
} from "contexts/Items/domain";
import { AccountID } from "contexts/Accounts/domain";
import { Input } from "apps/obsidian-plugin/view/components/Input";
import {
	GetAllUniqueItemsByNameUseCase,
	CreateSimpleItemUseCase,
} from "contexts/Items/application";
import { AppContext } from "apps/obsidian-plugin/view";

export const CreateBudgetItemPanel = ({
	createSimpleItemUseCase,
	getAllUniqueItemsByNameUseCase,
	close,
}: {
	createSimpleItemUseCase: CreateSimpleItemUseCase;
	getAllUniqueItemsByNameUseCase: GetAllUniqueItemsByNameUseCase;
	close: () => void;
}) => {
	const { refresh, categoriesWithSubcategories, stores, brands } =
		useContext(AppContext);
	const [items, setItems] = useState<ItemPrimitives[]>([]);
	useEffect(() => {
		getAllUniqueItemsByNameUseCase
			.execute()
			.then((res) => setItems(res.map((r) => r.toPrimitives())));
	}, [getAllUniqueItemsByNameUseCase]);

	const [item, setItem] = useState<ItemPrimitives>(Item.emptyPrimitives());

	const [selectedItem, setSelectedItem] = useState<ItemPrimitives>(
		Item.emptyPrimitives()
	);

	const [locks, setLocks] = useState<
		Omit<
			{
				[K in keyof ItemPrimitives]: boolean;
			},
			"id" | "account" | "toAccount" | "operation"
		>
	>({
		name: false,
		amount: false,
		category: false,
		subCategory: false,
		brand: false,
		store: false,
		frequency: false,
		nextDate: false,
	});
	const updateLock = (key: keyof ItemPrimitives, value: boolean) => {
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
		setAccount: (accountID) => update({ account: accountID.value }),
		setToAccount: (accountID) => update({ toAccount: accountID.value }),
		setType: (type) => update({ operation: type }),
	});

	useEffect(() => {
		console.log({ selectedItem });
		if (selectedItem) {
			const toUpdate: Partial<ItemPrimitives> = {};
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
			if (!lockType) toUpdate.operation = selectedItem.operation;
			if (!locks.name) toUpdate.name = selectedItem.name;
			if (!locks.amount) toUpdate.amount = selectedItem.amount;
			if (!locks.category) toUpdate.category = selectedItem.category;
			if (!locks.subCategory)
				toUpdate.subCategory = selectedItem.subCategory;
			if (!locks.brand) toUpdate.brand = selectedItem.brand;
			if (!locks.store) toUpdate.store = selectedItem.store;
			if (!locks.nextDate) toUpdate.nextDate = selectedItem.nextDate;
			if (!lockToAccount) toUpdate.toAccount = selectedItem.toAccount;
			if (!lockAccount) toUpdate.account = selectedItem.account;
			if (!locks.frequency) toUpdate.frequency = selectedItem.frequency;

			setIsRecurrent(!!selectedItem.frequency);
			update(toUpdate);
		}
	}, [selectedItem]);

	useEffect(() => {
		update({ ...item });
	}, [isRecurrent]);

	useEffect(() => console.log({ itemChanged: item }), [item]);

	const update = (newValues: Partial<ItemPrimitives>) => {
		console.log({ toUpdate: { ...item }, newValues });
		if (newValues.name !== undefined) item.name = newValues.name;
		if (newValues.nextDate !== undefined)
			item.nextDate = newValues.nextDate;
		if (newValues.operation !== undefined)
			item.operation = newValues.operation;
		if (newValues.amount !== undefined) item.amount = newValues.amount;
		if (newValues.category !== undefined)
			item.category = newValues.category;
		if (newValues.subCategory !== undefined)
			item.subCategory = newValues.subCategory;
		if (newValues.brand !== undefined) item.brand = newValues.brand;
		if (newValues.store !== undefined) item.store = newValues.store;
		if (newValues.toAccount) item.toAccount = newValues.toAccount;
		if (newValues.frequency !== undefined)
			item.frequency = newValues.frequency;
		if (newValues.account !== undefined) item.account = newValues.account;

		item.id = ItemID.generate().value;
		const newItem = isRecurrent
			? {
					...item,
					nextDate: item.nextDate ?? new Date(),
					frequency: item.frequency ?? "",
			  }
			: item;

		console.log({
			isRecurrent,
			newValues,
			item,
			newItem,
		});

		setItem(newItem);
	};

	const handleSubmit = (withClose: boolean) => async () => {
		if (!item) return;
		// const nextDate = new Date(item.nextDate);
		// nextDate.setSeconds(0);
		// console.log({ nextDate });
		console.log({
			itemToCreate: item,
		});

		item.account = account?.id.value ?? "";
		item.toAccount = toAccount?.id.value ?? "";
		item.operation = type;

		if (isRecurrent) {
		} else {
			await createSimpleItemUseCase.execute({
				id: ItemID.generate(),
				name: new ItemName(item.name),
				category: new ItemCategory(item.category),
				subCategory: new ItemSubcategory(item.subCategory),
				operation: new ItemOperation(item.operation),
				amount: new ItemPrice(item.amount),
				account: new AccountID(item.account),
				brand: item.brand ? new ItemBrand(item.brand) : undefined,
				store: item.store ? new ItemStore(item.store) : undefined,
				toAccount: item.toAccount
					? new AccountID(item.toAccount)
					: undefined,
			});
		}

		await refresh();

		if (withClose) close();
		setSelectedItem({
			id: "",
			account: lockAccount ? item.account : "",
			name: locks.name ? item.name : "",
			amount: locks.amount ? item.amount : 0,
			category: locks.category ? item.category : "",
			subCategory: locks.subCategory ? item.subCategory : "",
			brand: locks.brand ? item.brand : "",
			store: locks.store ? item.store : "",
			operation: "expense",
			nextDate: locks.nextDate ? item.nextDate : new Date(),
		});
	};

	return (
		<div className="create-budget-item-modal">
			<h1>Create Budget Item</h1>
			<SelectWithCreation<ItemPrimitives>
				id="name"
				label="Name"
				item={item}
				items={items}
				getLabel={(item) => {
					if (!item) return "";
					const label = `${item.account}${
						item.operation === "transfer"
							? ` -> ${item.toAccount} - `
							: ""
					}${item.amount === 0 ? "" : " " + item.amount}`;
					return label.length > 40
						? label.slice(0, 40) + "..."
						: label;
				}}
				getKey={(item) => item.name}
				setSelectedItem={setSelectedItem}
				onChange={(name) => update({ name })}
				isLocked={locks.name}
				setIsLocked={(value) => updateLock("name", value)}
				// error={validation.check("name") ?? undefined}
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
					value={new PriceValueObject(item.amount)}
					onChange={(amount) => update({ amount: amount.toNumber() })}
					isLocked={locks.amount}
					setIsLocked={(value) => updateLock("amount", value)}
					// error={validation.check("amount") ?? undefined}
				/>
				<SelectWithCreation
					id="category"
					label="Category"
					style={{ flexGrow: 1 }}
					item={item.category}
					items={categoriesWithSubcategories.map(
						(catWithSubs) => catWithSubs.category.name.value
					)}
					onChange={(category) => update({ category })}
					isLocked={locks.category}
					setIsLocked={(value) => updateLock("category", value)}
					// error={validation.check("category") ?? undefined}
				/>
				<SelectWithCreation
					id="subcategory"
					label="SubCategory"
					style={{ flexGrow: 1 }}
					item={
						categoriesWithSubcategories
							.find(
								(catWithSubs) =>
									item.category ===
									catWithSubs.category.name.value
							)
							?.subCategories.find(
								(sub) => sub.id.value === item.subCategory
							)?.name ?? ""
					}
					items={
						categoriesWithSubcategories
							.find(
								(catWithSubs) =>
									item.category ===
									catWithSubs.category.name.value
							)
							?.subCategories.map((sub) => sub.name.value) ?? []
					}
					onChange={(subCategory) => update({ subCategory })}
					isLocked={locks.subCategory}
					setIsLocked={(value) => updateLock("subCategory", value)}
					// error={validation.check("subcategory") ?? undefined}
				/>
			</div>
			{accountsInputs}
			<Input<Date>
				id="date"
				label="Date"
				value={item.nextDate}
				onChange={(nextDate) => update({ nextDate })}
				isLocked={locks.nextDate}
				setIsLocked={(value) => updateLock("nextDate", value)}
				// error={validation.check("nextDate") ?? undefined}
			/>
			{type === "expense" && (
				<>
					<SelectWithCreation
						id="brand"
						label="Brand"
						style={{ flexGrow: 1 }}
						item={item.brand ?? ""}
						items={brands.map((brand) => brand.value)}
						onChange={(brand) => update({ brand })}
						isLocked={locks.brand}
						setIsLocked={(value) => updateLock("brand", value)}
						// error={validation.check("brand") ?? undefined}
					/>
					<SelectWithCreation
						id="store"
						label="Store"
						style={{ flexGrow: 1 }}
						item={item.store ?? ""}
						items={stores.map((store) => store.value)}
						onChange={(store) => update({ store })}
						isLocked={locks.store}
						setIsLocked={(value) => updateLock("store", value)}
						// error={validation.check("store") ?? undefined}
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
						value={item.frequency}
						onChange={(frequency) => update({ frequency })}
						isLocked={locks.frequency}
						setIsLocked={(value) => updateLock("frequency", value)}
						// error={validation.check("frequency") ?? undefined}
					/>
				)}
			</div>
			<button onClick={handleSubmit(false)}>Save & Create Another</button>
			<button onClick={handleSubmit(true)}>Save & Finish</button>
		</div>
	);
};
