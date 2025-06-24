import { PriceValueObject } from "@juandardilag/value-objects";
import { Typography } from "@mui/material";
import { PriceInput } from "apps/obsidian-plugin/components/Input/PriceInput";
import { useDateInput } from "apps/obsidian-plugin/components/Input/useDateInput";
import {
	Select,
	SelectWithCreation,
	useCategorySelect,
	useSubCategorySelect,
} from "apps/obsidian-plugin/components/Select";
import { useAccountSelect } from "apps/obsidian-plugin/components/Select/useAccountSelect";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import {
	AccountsContext,
	TransactionsContext,
} from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { AccountID } from "contexts/Accounts/domain";
import { Item, ItemID, ItemPrice, ItemPrimitives } from "contexts/Items/domain";
import { OperationType } from "contexts/Shared/domain";
import { TransactionDate } from "contexts/Transactions/domain";
import { PropsWithChildren, useContext, useEffect, useState } from "react";

export const CreateItemForm = ({
	items,
	onSubmit,
	close,
	children,
	isValid: isRecurrenceValid,
	showErrors,
	onAttemptSubmit,
}: PropsWithChildren<{
	items: Item[];
	onSubmit: (item: Item, date?: TransactionDate) => Promise<void>;
	close: () => void;
	isValid?: boolean;
	showErrors: boolean;
	onAttemptSubmit: () => void;
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
		fromSplits: false,
		toSplits: false,
	});
	const [item, setItem] = useState<ItemPrimitives>({
		...Item.emptyPrimitives(),
		fromSplits: [{ accountId: "", amount: 0 }],
		toSplits: [],
	});
	const [selectedItem, setSelectedItem] = useState<ItemPrimitives>();

	const [errors, setErrors] = useState<{
		name: string | undefined;
		fromSplits: string | undefined;
		toSplits: string | undefined;
		account: string | undefined;
		toAccount: string | undefined;
	}>({
		name: undefined,
		fromSplits: undefined,
		toSplits: undefined,
		account: undefined,
		toAccount: undefined,
	});
	const [isFormValid, setIsFormValid] = useState(false);

	const { DateInput, date } = useDateInput({
		id: "date",
	});
	const { AccountSelect } = useAccountSelect({
		label: "From",
		initialValueID: item.operation.account,
		error: showErrors ? errors.account : undefined,
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
		// Calculate total from fromSplits
		const totalAmount = (item.fromSplits || []).reduce(
			(sum, split) => sum + (split.amount || 0),
			0
		);
		const newErrors = {
			name: !item.name.trim() ? "Name is required" : undefined,
			fromSplits:
				totalAmount <= 0 ? "Amount must be greater than 0" : undefined,
			toSplits: undefined,
			account: !(item.fromSplits && item.fromSplits[0]?.accountId)
				? "Account is required"
				: undefined,
			toAccount:
				item.operation.type === "transfer" &&
				!(item.toSplits && item.toSplits[0]?.accountId)
					? "To account is required"
					: undefined,
		};
		setErrors(newErrors);
		setIsFormValid(!Object.values(newErrors).some((err) => err));
	}, [item]);

	useEffect(() => {
		if (selectedItem) {
			logger.debug("selected item on creation", { selectedItem, locks });
			const toUpdate: Partial<ItemPrimitives> = {
				operation: getLockedOrSelectedValue("operation"),
				name: getLockedOrSelectedValue("name"),
				fromSplits: getLockedOrSelectedValue("fromSplits"),
				toSplits: getLockedOrSelectedValue("toSplits"),
				category: getLockedOrSelectedValue("category"),
				subCategory: getLockedOrSelectedValue("subCategory"),
				brand: getLockedOrSelectedValue("brand"),
				store: getLockedOrSelectedValue("store"),
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
		if (newValues.fromSplits !== undefined)
			newItem.fromSplits = newValues.fromSplits;
		if (newValues.toSplits !== undefined)
			newItem.toSplits = newValues.toSplits;
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
			fromSplits: item.fromSplits,
			toSplits: item.toSplits,
			operation: item.operation,
		});
		await onSubmit(itemToPersist, new TransactionDate(date));
		if (withClose) return close();
		setSelectedItem(undefined);
		setItem({
			...Item.emptyPrimitives(),
			fromSplits: [{ accountId: "", amount: 0 }],
			toSplits: [],
		});
	};

	const handleAttemptSubmit = (withClose: boolean) => async () => {
		onAttemptSubmit();
		if (isFormValid && isRecurrenceValid) {
			await handleSubmit(withClose)();
		}
	};

	return (
		<div className="create-budget-item-modal">
			<Typography variant="h3" component="h3" gutterBottom>
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
						item.fromSplits?.[0]?.amount === 0
							? ""
							: "  " +
							  new ItemPrice(
									item.fromSplits?.[0]?.amount ?? 0
							  ).toString()
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
				error={showErrors ? errors.name : undefined}
			/>
			<div className="form-row">
				{DateInput}
				<PriceInput
					id="amount"
					label="Amount"
					isLocked={locks.price}
					setIsLocked={(value) => updateLock("price", value)}
					value={
						new PriceValueObject(
							item.fromSplits?.reduce(
								(sum, split) => sum + split.amount,
								0
							) ?? 0,
							{
								withSign: false,
								decimals: 0,
							}
						)
					}
					onChange={(amount) => update({ price: amount.toNumber() })}
					error={showErrors ? errors.fromSplits : undefined}
				/>
			</div>
			<div className="form-row">
				<Select
					id="type"
					label="Type"
					value={item.operation.type}
					values={["expense", "income", "transfer"]}
					onChange={(type) =>
						update({
							operation: {
								...item.operation,
								type: type.toLowerCase() as OperationType,
							},
						})
					}
					isLocked={locks.operation}
					setIsLocked={(value) => updateLock("operation", value)}
				/>
				{AccountSelect}
			</div>
			<div className="form-row">
				{CategorySelect}
				{SubCategorySelect}
			</div>
			<div className="form-row">
				<SelectWithCreation
					id="brand"
					label="Brand"
					item={item.brand ?? ""}
					items={brands.map((b) => b.value)}
					onChange={(brand) => update({ brand })}
					isLocked={locks.brand}
					setIsLocked={(lock) => updateLock("brand", lock)}
				/>
				<SelectWithCreation
					id="store"
					label="Store"
					item={item.store ?? ""}
					items={stores.map((s) => s.value)}
					onChange={(store) => update({ store })}
					isLocked={locks.store}
					setIsLocked={(lock) => updateLock("store", lock)}
				/>
			</div>
			{children}
			<div className="modal-button-container">
				<button onClick={handleAttemptSubmit(true)}>
					Create and close
				</button>
				<button onClick={handleAttemptSubmit(false)}>Create</button>
			</div>
		</div>
	);
};
