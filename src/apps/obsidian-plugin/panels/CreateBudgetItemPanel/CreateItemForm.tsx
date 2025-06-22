import { useContext, useEffect, useState, PropsWithChildren } from "react";
import { PriceValueObject } from "@juandardilag/value-objects";
import { Item, ItemID, ItemPrice, ItemPrimitives } from "contexts/Items/domain";
import {
	AccountsContext,
	TransactionsContext,
} from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import {
	Select,
	SelectWithCreation,
	useCategorySelect,
	useSubCategorySelect,
} from "apps/obsidian-plugin/components/Select";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import { useAccountSelect } from "apps/obsidian-plugin/components/Select/useAccountSelect";
import { AccountID } from "contexts/Accounts/domain";
import { OperationType } from "contexts/Shared/domain";
import { useDateInput } from "apps/obsidian-plugin/components/Input/useDateInput";
import { TransactionDate } from "contexts/Transactions/domain";
import { PriceInput } from "apps/obsidian-plugin/components/Input/PriceInput";
import { Typography } from "@mui/material";

export const CreateItemForm = ({
	items,
	onSubmit,
	close,
	children,
}: PropsWithChildren<{
	items: Item[];
	onSubmit: (item: Item, date?: TransactionDate) => Promise<void>;
	close: () => void;
}>) => {
	const { logger } = useLogger("CreateItemForm");

	const { getAccountByID } = useContext(AccountsContext);
	const { brands, stores } = useContext(TransactionsContext);

	const [locks, setLocks] = useState<{
		[K in keyof Omit<Required<ItemPrimitives>, "id">]: boolean;
	}>({
		name: false,
		price: false,
		brand: false,
		category: false,
		subCategory: false,
		store: false,
		operation: false,
		recurrence: false,
		updatedAt: false,
	});
	const [item, setItem] = useState<ItemPrimitives>(Item.emptyPrimitives());
	const [selectedItem, setSelectedItem] = useState<ItemPrimitives>();

	const { DateInput, date } = useDateInput({
		id: "date",
	});
	const { AccountSelect, account } = useAccountSelect({
		label: "From",
		initialValueID: item.operation.account,
		// lock: locks.account,
		// setLock: (lock) => updateLock("account", lock),
	});
	const { AccountSelect: ToAccountSelect, account: toAccount } =
		useAccountSelect({
			label: "To",
			initialValueID: item.operation.toAccount,
			// lock: locks.toAccount,
			// setLock: (lock) => updateLock("toAccount", lock),
		});
	const { CategorySelect, category } = useCategorySelect({
		initialValueID: item.category,
		lock: locks.category,
		setLock: (lock) => updateLock("category", lock),
	});
	const { SubCategorySelect, subCategory } = useSubCategorySelect({
		category,
		initialValueID: item.subCategory,
		lock: locks.subCategory,
		setLock: (lock) => updateLock("subCategory", lock),
	});

	const getLockedOrSelectedValue = <T,>(
		key: keyof Omit<ItemPrimitives, "id">
	): T | undefined => {
		if (locks[key]) return item[key] as T;
		return (selectedItem?.[key] as T) ?? undefined;
	};

	useEffect(() => {
		if (selectedItem) {
			logger.debug("selected item on creation", { selectedItem, locks });
			const toUpdate: Partial<ItemPrimitives> = {
				operation: getLockedOrSelectedValue("operation"),
				name: getLockedOrSelectedValue("name"),
				price: getLockedOrSelectedValue("price"),
				category: getLockedOrSelectedValue("category"),
				subCategory: getLockedOrSelectedValue("subCategory"),
				brand: getLockedOrSelectedValue("brand"),
				store: getLockedOrSelectedValue("store"),
				// account: getLockedOrSelectedValue("account"),
				// toAccount: getLockedOrSelectedValue("toAccount"),
			};

			logger.debug("item to update on creation", {
				toUpdate,
			});
			update(toUpdate);
		}
	}, [selectedItem]);

	const updateLock = (key: keyof ItemPrimitives, value: boolean) => {
		setLocks({
			...locks,
			[key]: value,
		});
	};

	const update = (newValues: Partial<ItemPrimitives>) => {
		const newItem = { ...item };
		logger.debug("updating item to create", {
			prevValues: newItem,
			newValues,
		});
		if (newValues.name !== undefined) newItem.name = newValues.name;
		if (newValues.operation !== undefined)
			newItem.operation = newValues.operation;
		if (newValues.price !== undefined) newItem.price = newValues.price;
		if (newValues.category !== undefined)
			newItem.category = newValues.category;
		if (newValues.subCategory !== undefined)
			newItem.subCategory = newValues.subCategory;
		if (newValues.brand !== undefined) newItem.brand = newValues.brand;
		if (newValues.store !== undefined) newItem.store = newValues.store;
		if (newValues.operation?.toAccount)
			newItem.operation.toAccount = newValues.operation?.toAccount;
		if (newValues.operation?.account !== undefined)
			newItem.operation.account = newValues.operation?.account;

		logger.debug("item to create updated", {
			newItem,
		});

		setItem(newItem);
	};

	const handleSubmit = (withClose: boolean) => async () => {
		if (!item) return;

		const itemToPersist = Item.fromPrimitives({
			...item,
			id: ItemID.generate().value,
			category: category?.id.value ?? "",
			subCategory: subCategory?.id.value ?? "",
			operation: {
				...item.operation,
				account: account?.id.value ?? "",
				toAccount: toAccount?.id.value,
			},
		});

		await onSubmit(itemToPersist, new TransactionDate(date));

		if (withClose) return close();
		setSelectedItem(undefined);
		setItem({
			id: "",
			name: locks.name ? item.name : "",
			price: locks.price ? item.price : 0,
			category: locks.category ? item.category : "",
			subCategory: locks.subCategory ? item.subCategory : "",
			brand: locks.brand ? item.brand : "",
			store: locks.store ? item.store : "",
			recurrence: {
				recurrences: [],
				startDate: new Date(),
			},
			operation: {
				// type: locks.operation ? item.operation : "expense",
				type: "expense",
				// account: locks.account ? item.account : "",
				account: item.operation.account,
				// toAccount: locks.toAccount ? item.toAccount : "",
				toAccount: item.operation.toAccount,
			},
			updatedAt: new Date().toISOString(),
		});
	};

	return (
		<div className="create-budget-item-modal">
			<Typography variant="h3" component="h3">
				Create Item
			</Typography>
			<SelectWithCreation<ItemPrimitives>
				id="name"
				label="Name"
				item={item}
				items={items.map((item) => item.toPrimitives())}
				getLabel={(item) => {
					if (!item) return "";
					const label = `${item.name} - ${
						getAccountByID(new AccountID(item.operation.account))
							?.name.value
					}${
						item.operation.type === "transfer" &&
						item.operation.toAccount
							? ` -> ${
									getAccountByID(
										new AccountID(item.operation.toAccount)
									)?.name.value
							  } - `
							: ""
					}${
						item.price === 0
							? ""
							: "  " + new ItemPrice(item.price).toString()
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
					justifyContent: "space-between",
					gap: "5px",
				}}
			>
				{DateInput}
				<PriceInput
					id="amount"
					label="Amount"
					isLocked={locks.price}
					setIsLocked={(value) => updateLock("price", value)}
					value={
						new PriceValueObject(item.price, {
							withSign: false,
							decimals: 0,
						})
					}
					onChange={(amount) => update({ price: amount.toNumber() })}
				/>
			</div>
			<div style={{ display: "flex", justifyContent: "space-between" }}>
				{CategorySelect}
				{SubCategorySelect}
			</div>
			<Select
				id="type"
				label="Type"
				value={item.operation.type}
				values={["expense", "income", "transfer"]}
				onChange={(operation) => {
					update({
						operation: {
							...item.operation,
							type: operation.toLowerCase() as OperationType,
						},
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
				{item.operation.type === "transfer" && ToAccountSelect}
			</div>
			{item.operation.type === "expense" && (
				<div
					style={{ display: "flex", justifyContent: "space-between" }}
				>
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
				</div>
			)}
			{children}
			<button onClick={handleSubmit(false)}>Save & Create Another</button>
			<button onClick={handleSubmit(true)}>Save & Finish</button>
		</div>
	);
};
