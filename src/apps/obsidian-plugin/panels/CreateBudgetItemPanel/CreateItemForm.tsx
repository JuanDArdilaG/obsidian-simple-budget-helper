import {
	useContext,
	useEffect,
	useMemo,
	useState,
	PropsWithChildren,
} from "react";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
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
	ItemsContext,
} from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import {
	Select,
	SelectWithCreation,
	useCategorySelect,
	useSubCategorySelect,
} from "apps/obsidian-plugin/components/Select";
import { AccountID, CategoryID, OperationType, SubCategoryID } from "contexts";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import { useAccountSelect } from "apps/obsidian-plugin/components/Select/AccountSelect";
import { DateValueObject } from "@juandardilag/value-objects/DateValueObject";

export const CreateItemForm = ({
	items,
	onSubmit,
	close,
	children,
}: PropsWithChildren<{
	items: Item[];
	onSubmit: (item: SimpleItem, date: DateValueObject) => Promise<void>;
	close: () => void;
}>) => {
	const logger = useLogger("CreateItemForm");

	const { getAccountByID } = useContext(AccountsContext);
	const { brands, stores } = useContext(ItemsContext);

	useEffect(() => {
		logger.title("unique items for creation").obj({ items }).log();
	}, [items]);

	const [locks, setLocks] = useState<{
		[K in keyof ItemPrimitives]?: boolean;
	}>({});
	const [internalItem, setInternalItem] = useState<ItemPrimitives>(
		Item.emptyPrimitives()
	);
	const [selectedItem, setSelectedItem] = useState<ItemPrimitives>();

	const { AccountSelect, account } = useAccountSelect({
		label: "From",
		initialValueID: internalItem.account
			? new AccountID(internalItem.account)
			: undefined,
		lock: locks.account,
		setLock: (lock) => updateLock("account", lock),
	});
	const { AccountSelect: ToAccountSelect, account: toAccount } =
		useAccountSelect({
			label: "To",
			initialValueID: internalItem.toAccount
				? new AccountID(internalItem.toAccount)
				: undefined,
			lock: locks.toAccount,
			setLock: (lock) => updateLock("toAccount", lock),
		});
	const { CategorySelect, category } = useCategorySelect({
		initialValueID: internalItem.category
			? new CategoryID(internalItem.category)
			: undefined,
		lock: locks.category,
		setLock: (lock) => updateLock("category", lock),
	});
	const { SubCategorySelect, subCategory } = useSubCategorySelect({
		category,
		initialValueID: internalItem.subCategory
			? new SubCategoryID(internalItem.subCategory)
			: undefined,
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
				nextDate: !locks.nextDate ? selectedItem.nextDate : undefined,
				frequency: !locks.frequency
					? selectedItem.frequency
					: undefined,
				untilDate: !locks.untilDate
					? selectedItem.untilDate
					: undefined,
			};

			logger.debug("item to update on creation", {
				toUpdate,
				isRecurrent: !!selectedItem.frequency,
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
		const newItem = { ...internalItem };
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

		if (newValues.nextDate !== undefined)
			newItem.nextDate = newValues.nextDate;
		if (newValues.frequency !== undefined)
			newItem.frequency = newValues.frequency;
		if (newValues.untilDate !== undefined)
			newItem.untilDate = newValues.untilDate;

		logger.debug("item to create updated", {
			newItem,
		});

		setInternalItem(newItem);
	};

	const handleSubmit = (withClose: boolean) => async () => {
		if (!internalItem) return;

		let itemToPersist = SimpleItem.fromPrimitives({
			...internalItem,
			id: ItemID.generate().value,
			category: category?.id.value ?? "",
			subCategory: subCategory?.id.value ?? "",
			account: account?.id.value ?? "",
			toAccount: toAccount?.id.value,
		});

		await onSubmit(
			itemToPersist,
			internalItem.nextDate
				? new DateValueObject(internalItem.nextDate)
				: DateValueObject.now()
		);

		if (withClose) return close();
		setSelectedItem(undefined);
		setInternalItem({
			id: "",
			account: locks.account ? internalItem.account : "",
			name: locks.name ? internalItem.name : "",
			amount: locks.amount ? internalItem.amount : 0,
			category: locks.category ? internalItem.category : "",
			subCategory: locks.subCategory ? internalItem.subCategory : "",
			brand: locks.brand ? internalItem.brand : "",
			store: locks.store ? internalItem.store : "",
			operation: locks.operation ? internalItem.operation : "expense",
			toAccount: locks.toAccount ? internalItem.toAccount : "",
			nextDate: locks.nextDate ? internalItem.nextDate : new Date(),
			frequency: locks.frequency ? internalItem.frequency : undefined,
			untilDate: locks.untilDate ? internalItem.untilDate : undefined,
		});
	};

	return (
		<div className="create-budget-item-modal">
			<h1>Create Item</h1>
			<SelectWithCreation<ItemPrimitives>
				id="name"
				label="Name"
				item={internalItem}
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
					value={new PriceValueObject(internalItem.amount)}
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
				value={internalItem.operation}
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
				{internalItem.operation === "transfer" && ToAccountSelect}
			</div>
			<Input<Date>
				dateWithTime
				id="date"
				label="Date"
				value={internalItem.nextDate ?? new Date()}
				onChange={(nextDate) => update({ nextDate })}
				isLocked={locks.nextDate}
				setIsLocked={(value) => updateLock("nextDate", value)}
				// error={validation.check("nextDate") ?? undefined}
			/>
			{internalItem.operation === "expense" && (
				<>
					<SelectWithCreation
						id="brand"
						label="Brand"
						style={{ flexGrow: 1 }}
						item={internalItem.brand ?? ""}
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
						item={internalItem.store ?? ""}
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
