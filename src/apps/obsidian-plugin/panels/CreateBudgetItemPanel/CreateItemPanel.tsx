import { useContext, useEffect, useMemo, useState } from "react";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { Checkbox, FormControlLabel } from "@mui/material";
import {
	Item,
	ItemID,
	ItemPrice,
	ItemPrimitives,
	SimpleItem,
} from "contexts/Items/domain";
import { Input } from "apps/obsidian-plugin/components/Input";
import {
	AccountsContext,
	CategoriesContext,
	ItemsContext,
	TransactionsContext,
} from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import {
	Select,
	SelectWithCreation,
} from "apps/obsidian-plugin/components/Select";
import {
	AccountID,
	AccountName,
	Category,
	CategoryID,
	CategoryName,
	OperationType,
	SubCategory,
	SubCategoryID,
	SubCategoryName,
	TransactionDate,
} from "contexts";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import { RecurrentItem } from "../../../../contexts/Items/domain/RecurrentItem/recurrent-item.entity";
import { useAccountSelect } from "apps/obsidian-plugin/components/Select/AccountSelect";

export const CreateItemPanel = ({ close }: { close: () => void }) => {
	const logger = useLogger("CreateItemPanel");
	const {
		useCases: { createCategory, createSubCategory },
	} = useContext(CategoriesContext);
	const {
		useCases: { getAllUniqueItemsByName, createItem, recordSimpleItem },
	} = useContext(ItemsContext);

	const { accounts, getAccountByID, updateAccounts } =
		useContext(AccountsContext);
	const accountNames = useMemo(
		() => accounts.map((acc) => acc.name.value).sort(),
		[accounts]
	);
	const { updateTransactions } = useContext(TransactionsContext);
	const {
		categories,
		categoriesWithSubcategories,
		getCategoryByID,
		getSubCategoryByID,
	} = useContext(CategoriesContext);
	const { brands, stores } = useContext(ItemsContext);

	const [items, setItems] = useState<Item[]>([]);
	useEffect(() => {
		getAllUniqueItemsByName.execute().then((items) => setItems(items));
	}, [getAllUniqueItemsByName]);

	useEffect(() => {
		logger.title("unique items for creation").obj({ items }).log();
	}, [items]);

	const [locks, setLocks] = useState<{
		[K in keyof ItemPrimitives]?: boolean;
	}>({});
	const updateLock = (key: keyof ItemPrimitives, value: boolean) => {
		setLocks({
			...locks,
			[key]: value,
		});
	};
	const [item, setItem] = useState<ItemPrimitives>(Item.emptyPrimitives());
	const { AccountSelect, account } = useAccountSelect({
		label: "Account: From",
		initialValueID: item.account ? new AccountID(item.account) : undefined,
		lock: locks.account,
		setLock: (lock) => updateLock("account", lock),
	});
	const subCategories = useMemo(
		() =>
			item.category
				? categoriesWithSubcategories.find((catWithSubs) =>
						catWithSubs.category.name.equalTo(
							new CategoryName(item.category)
						)
				  )?.subCategories ?? []
				: [],
		[item.category]
	);

	const [selectedItem, setSelectedItem] = useState<ItemPrimitives>();

	const [isRecurrent, setIsRecurrent] = useState(false);

	const operation = useMemo(() => item.operation, [item.operation]);

	useEffect(() => {
		if (selectedItem) {
			logger.debug("selected item on creation", { selectedItem, locks });
			const toUpdate: Partial<ItemPrimitives> = {};
			if (!locks.operation) toUpdate.operation = selectedItem.operation;
			if (!locks.name) toUpdate.name = selectedItem.name;
			if (!locks.amount) toUpdate.amount = selectedItem.amount;
			if (!locks.category) {
				const category = getCategoryByID(
					new CategoryID(selectedItem.category)
				);
				toUpdate.category = category?.name.value;
			}
			if (!locks.subCategory) {
				const subCategory = getSubCategoryByID(
					new SubCategoryID(selectedItem.subCategory)
				);
				toUpdate.subCategory = subCategory?.name.value;
			}
			if (!locks.brand) toUpdate.brand = selectedItem.brand;
			if (!locks.store) toUpdate.store = selectedItem.store;
			if (!locks.nextDate) toUpdate.nextDate = selectedItem.nextDate;
			if (!locks.account) {
				const account = getAccountByID(
					new AccountID(selectedItem.account)
				);
				toUpdate.account = account?.name.value;
			}
			if (!locks.toAccount) {
				const toAccount = selectedItem.toAccount
					? getAccountByID(new AccountID(selectedItem.toAccount))
					: undefined;
				toUpdate.toAccount = toAccount?.name.value;
			}
			if (!locks.frequency) toUpdate.frequency = selectedItem.frequency;

			logger.debug("item to update on creation", {
				toUpdate,
				isRecurrent: !!selectedItem.frequency,
			});

			setIsRecurrent(!!selectedItem.frequency);
			update(toUpdate);
		}
	}, [selectedItem]);

	const update = (newValues: Partial<ItemPrimitives>) => {
		const newItem = { ...item };
		logger.debug("updating item to create", {
			prevValues: newItem,
			newValues,
		});
		if (newValues.name !== undefined) newItem.name = newValues.name;
		if (newValues.nextDate !== undefined)
			newItem.nextDate = newValues.nextDate;
		if (newValues.operation !== undefined)
			newItem.operation = newValues.operation;
		if (newValues.amount !== undefined) newItem.amount = newValues.amount;
		if (newValues.category !== undefined)
			newItem.category = newValues.category;
		if (newValues.subCategory !== undefined)
			newItem.subCategory = newValues.subCategory;
		if (newValues.brand !== undefined) newItem.brand = newValues.brand;
		if (newValues.store !== undefined) newItem.store = newValues.store;
		if (newValues.toAccount) newItem.toAccount = newValues.toAccount;
		if (newValues.frequency !== undefined)
			newItem.frequency = newValues.frequency;
		if (newValues.account !== undefined)
			newItem.account = newValues.account;

		logger.debug("item to create updated", {
			isRecurrent,
			newItem,
		});

		setItem(newItem);
	};

	const handleSubmit = (withClose: boolean) => async () => {
		if (!item) return;
		const categoryName = new CategoryName(item.category);
		let category = categories.find((cat) => cat.name.equalTo(categoryName));
		if (!category) {
			category = Category.create(categoryName);
			await createCategory.execute(category);
		}

		const subCategoryName = new SubCategoryName(item.subCategory);
		let subCategory = subCategories.find((sub) =>
			sub.name.equalTo(subCategoryName)
		);
		if (!subCategory) {
			subCategory = SubCategory.create(category.id, subCategoryName);
			await createSubCategory.execute(subCategory);
		}

		const toAccount = item.toAccount
			? accounts.find((acc) =>
					acc.name.equalTo(new AccountName(item.toAccount ?? ""))
			  )?.id.value
			: undefined;

		const date = item.nextDate ?? new Date();
		let itemToPersist: Item;
		const itemPrimitives = {
			...item,
			id: ItemID.generate().value,
			category: category.id.value,
			subCategory: subCategory.id.value,
			account: account?.id.value ?? "",
			toAccount,
		};
		if (isRecurrent) {
			itemToPersist = RecurrentItem.fromPrimitives({
				...itemPrimitives,
				nextDate: date,
				frequency: item.frequency ?? "",
			});
		} else {
			itemToPersist = SimpleItem.fromPrimitives(itemPrimitives);
			await recordSimpleItem.execute({
				item: itemToPersist,
				date: new TransactionDate(date),
			});
			updateAccounts();
		}
		await createItem.execute(itemToPersist);

		updateTransactions();

		if (withClose) close();
		setSelectedItem(undefined);
		setItem({
			id: "",
			account: locks.account ? item.account : accountNames[0],
			name: locks.name ? item.name : "",
			amount: locks.amount ? item.amount : 0,
			category: locks.category ? item.category : "",
			subCategory: locks.subCategory ? item.subCategory : "",
			brand: locks.brand ? item.brand : "",
			store: locks.store ? item.store : "",
			operation: locks.operation ? item.operation : "expense",
			nextDate: locks.nextDate ? item.nextDate : new Date(),
			toAccount: locks.toAccount ? item.toAccount : accountNames[0],
		});
	};

	return (
		<div className="create-budget-item-modal">
			<h1>Create Item</h1>
			<SelectWithCreation<ItemPrimitives>
				id="name"
				label="Name"
				item={item}
				items={items.map((item) => item.toPrimitives())}
				getLabel={(item) => {
					if (!item) return "";
					const label = `${
						getAccountByID(new AccountID(item.account))?.name.value
					}${
						item.operation === "transfer" && item.toAccount
							? ` -> ${
									getAccountByID(
										new AccountID(item.toAccount)
									)?.name.value
							  } - `
							: ""
					}${
						item.amount === 0
							? ""
							: "  " + new ItemPrice(item.amount).toString()
					}`;
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
					items={categories.map((cat) => cat.name.value).sort()}
					onChange={(category) => update({ category })}
					isLocked={locks.category}
					setIsLocked={(value) => updateLock("category", value)}
					// error={validation.check("category") ?? undefined}
				/>
				<SelectWithCreation
					id="subcategory"
					label="SubCategory"
					style={{ flexGrow: 1 }}
					item={item.subCategory}
					items={subCategories.map((sub) => sub.name.value).sort()}
					onChange={(subCategory) => update({ subCategory })}
					isLocked={locks.subCategory}
					setIsLocked={(value) => updateLock("subCategory", value)}
					// error={validation.check("subcategory") ?? undefined}
				/>
			</div>
			<Select
				id="type"
				label="Type"
				value={operation}
				values={["expense", "income", "transfer"]}
				onChange={(operation) => {
					update({
						operation: operation.toLowerCase() as OperationType,
					});
				}}
				isLocked={locks.operation}
				setIsLocked={(value) => updateLock("operation", value)}
				// error={errors?.operation}
			/>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					gap: "10px",
				}}
			>
				{AccountSelect}
				<Select
					id="account"
					label="Account: From"
					value={item.account}
					values={["", ...accountNames]}
					onChange={(account) => update({ account })}
					isLocked={locks.account}
					setIsLocked={(value) => updateLock("account", value)}
					// error={errors?.account}
				/>
				{operation === "transfer" && (
					<Select
						id="toAccount"
						label="Account: To"
						value={item.toAccount ?? ""}
						values={["", ...accountNames]}
						onChange={(toAccount) => update({ toAccount })}
						isLocked={locks.toAccount}
						setIsLocked={(value) => updateLock("toAccount", value)}
						// error={errors?.toAccount}
					/>
				)}
			</div>
			<Input<Date>
				id="date"
				label="Date"
				value={item.nextDate ?? new Date()}
				onChange={(nextDate) => update({ nextDate })}
				isLocked={locks.nextDate}
				setIsLocked={(value) => updateLock("nextDate", value)}
				// error={validation.check("nextDate") ?? undefined}
			/>
			{item.operation === "expense" && (
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
