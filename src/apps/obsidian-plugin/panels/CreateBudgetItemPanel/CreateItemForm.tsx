import { useContext, useEffect, useState, PropsWithChildren } from "react";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import {
	Item,
	ItemID,
	ItemPrice,
	ItemPrimitives,
	SimpleItem,
} from "contexts/SimpleItems/domain";
import {
	AccountsContext,
	ItemsContext,
} from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import {
	Select,
	SelectWithCreation,
	useCategorySelect,
	useSubCategorySelect,
} from "apps/obsidian-plugin/components/Select";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import { useAccountSelect } from "apps/obsidian-plugin/components/Select/useAccountSelect";
import { DateValueObject } from "@juandardilag/value-objects/DateValueObject";
import { AccountID } from "contexts/Accounts/domain";
import { OperationType } from "contexts/Shared/domain";
import { Input } from "apps/obsidian-plugin/components/Input/Input";

export const CreateItemForm = ({
	items,
	onSubmit,
	close,
	children,
}: PropsWithChildren<{
	items: Item[];
	onSubmit: (item: SimpleItem) => Promise<void>;
	close: () => void;
}>) => {
	const { logger } = useLogger("CreateItemForm");

	const { getAccountByID } = useContext(AccountsContext);
	const { brands, stores } = useContext(ItemsContext);

	const [locks, setLocks] = useState<{
		[K in keyof ItemPrimitives]?: boolean;
	}>({});
	const [item, setItem] = useState<ItemPrimitives>(Item.emptyPrimitives());
	const [selectedItem, setSelectedItem] = useState<ItemPrimitives>();

	const { AccountSelect, account } = useAccountSelect({
		label: "From",
		initialValueID: item.account,
		lock: locks.account,
		setLock: (lock) => updateLock("account", lock),
	});
	const { AccountSelect: ToAccountSelect, account: toAccount } =
		useAccountSelect({
			label: "To",
			initialValueID: item.toAccount,
			lock: locks.toAccount,
			setLock: (lock) => updateLock("toAccount", lock),
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

	useEffect(() => {
		if (selectedItem) {
			logger.debug("selected item on creation", { selectedItem, locks });
			const toUpdate: Partial<ItemPrimitives> = {
				operation: !locks.operation
					? selectedItem.operation
					: undefined,
				name: !locks.name ? selectedItem.name : undefined,
				amount: !locks.amount ? selectedItem.amount : undefined,
				category: !locks.category ? selectedItem.category : undefined,
				subCategory: !locks.subCategory
					? selectedItem.subCategory
					: undefined,
				brand: !locks.brand ? selectedItem.brand : undefined,
				store: !locks.store ? selectedItem.store : undefined,
				account: !locks.account ? selectedItem.account : undefined,
				toAccount: !locks.toAccount
					? selectedItem.toAccount
					: undefined,
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
		if (newValues.amount !== undefined) newItem.amount = newValues.amount;
		if (newValues.category !== undefined)
			newItem.category = newValues.category;
		if (newValues.subCategory !== undefined)
			newItem.subCategory = newValues.subCategory;
		if (newValues.brand !== undefined) newItem.brand = newValues.brand;
		if (newValues.store !== undefined) newItem.store = newValues.store;
		if (newValues.toAccount) newItem.toAccount = newValues.toAccount;
		if (newValues.account !== undefined)
			newItem.account = newValues.account;

		logger.debug("item to create updated", {
			newItem,
		});

		setItem(newItem);
	};

	const handleSubmit = (withClose: boolean) => async () => {
		if (!item) return;

		let itemToPersist = SimpleItem.fromPrimitives({
			...item,
			id: ItemID.generate().value,
			category: category?.id.value ?? "",
			subCategory: subCategory?.id.value ?? "",
			account: account?.id.value ?? "",
			toAccount: toAccount?.id.value,
		});

		await onSubmit(itemToPersist);

		if (withClose) return close();
		setSelectedItem(undefined);
		setItem({
			id: "",
			account: locks.account ? item.account : "",
			name: locks.name ? item.name : "",
			amount: locks.amount ? item.amount : 0,
			category: locks.category ? item.category : "",
			subCategory: locks.subCategory ? item.subCategory : "",
			brand: locks.brand ? item.brand : "",
			store: locks.store ? item.store : "",
			operation: locks.operation ? item.operation : "expense",
			toAccount: locks.toAccount ? item.toAccount : "",
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
					flexDirection: "column",
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
				{CategorySelect}
				{SubCategorySelect}
			</div>
			<Select
				id="type"
				label="Type"
				value={item.operation}
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
				{item.operation === "transfer" && ToAccountSelect}
			</div>
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
			{children}
			<button onClick={handleSubmit(false)}>Save & Create Another</button>
			<button onClick={handleSubmit(true)}>Save & Finish</button>
		</div>
	);
};
