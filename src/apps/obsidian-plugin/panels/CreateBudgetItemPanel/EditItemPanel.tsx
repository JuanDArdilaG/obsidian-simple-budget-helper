import { useContext, useState, useEffect } from "react";
import { Typography } from "@mui/material";
import {
	Item,
	ItemName,
	ItemPrice,
	ItemPrimitives,
	ItemRecurrence,
	ItemRecurrenceFrequency,
} from "contexts/Items/domain";
import { ItemsContext, TransactionsContext } from "apps/obsidian-plugin/views";
import {
	Select,
	SelectWithCreation,
	useAccountSelect,
	useCategorySelect,
	useSubCategorySelect,
} from "apps/obsidian-plugin/components/Select";
import { OperationType } from "contexts/Shared/domain";
import { PriceInput } from "apps/obsidian-plugin/components/Input/PriceInput";
import { useDateInput } from "apps/obsidian-plugin/components/Input/useDateInput";
import { PriceValueObject, DateValueObject, NumberValueObject } from "@juandardilag/value-objects";
import { useCreateRecurrenceForm } from "./useCreateRecurrenceForm";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";

export const EditItemPanel = ({
	item,
	onClose,
}: {
	item: Item;
	onClose: () => void;
}) => {
	const { logger } = useLogger("EditItemPanel");
	const {
		useCases: { updateItem },
		updateItems,
	} = useContext(ItemsContext);
	const { brands, stores } = useContext(TransactionsContext);

	// Convert item to primitives for form management
	const [itemPrimitives, setItemPrimitives] = useState<ItemPrimitives>(item.toPrimitives());
	
	const [errors, setErrors] = useState<{
		name: string | undefined;
		price: string | undefined;
		account: string | undefined;
		toAccount: string | undefined;
	}>({
		name: undefined,
		price: undefined,
		account: undefined,
		toAccount: undefined,
	});
	
	const [showErrors, setShowErrors] = useState(false);
	const [isFormValid, setIsFormValid] = useState(false);

	const { DateInput, date } = useDateInput({
		id: "date",
		initialValue: item.recurrence.startDate.value,
	});

	const { AccountSelect, account } = useAccountSelect({
		label: "From",
		initialValueID: item.operation.account.value,
		error: showErrors ? errors.account : undefined,
	});
	
	const { AccountSelect: ToAccountSelect, account: toAccount } =
		useAccountSelect({
			label: "To",
			initialValueID: item.operation.toAccount?.value,
			error: showErrors ? errors.toAccount : undefined,
		});
		
	const { CategorySelect, category } = useCategorySelect({
		initialValueID: item.category.value,
	});
	
	const { SubCategorySelect, subCategory } = useSubCategorySelect({
		category,
		initialValueID: item.subCategory.value,
	});

	const {
		RecurrenceForm,
		untilDate,
		frequencyString,
		recurrenceType,
		recurrences,
	} = useCreateRecurrenceForm({ recurrence: item.recurrence });

	// Form validation
	useEffect(() => {
		const newErrors = {
			name: !itemPrimitives.name.trim() ? "Name is required" : undefined,
			price: itemPrimitives.price <= 0 ? "Amount must be greater than 0" : undefined,
			account: !account ? "Account is required" : undefined,
			toAccount:
				itemPrimitives.operation.type === "transfer" && !toAccount
					? "To account is required"
					: undefined,
		};
		setErrors(newErrors);
		setIsFormValid(!Object.values(newErrors).some((err) => err));
	}, [itemPrimitives, account, toAccount]);

	const updateItemPrimitives = (updates: Partial<ItemPrimitives>) => {
		const newItem = { ...itemPrimitives };
		logger.debug("updating item to edit", {
			prevValues: newItem,
			updates,
		});
		
		if (updates.name !== undefined) newItem.name = updates.name;
		if (updates.operation !== undefined) newItem.operation = updates.operation;
		if (updates.price !== undefined) newItem.price = updates.price;
		if (updates.category !== undefined) newItem.category = updates.category;
		if (updates.subCategory !== undefined) newItem.subCategory = updates.subCategory;
		if (updates.brand !== undefined) newItem.brand = updates.brand;
		if (updates.store !== undefined) newItem.store = updates.store;
		if (updates.operation?.toAccount !== undefined)
			newItem.operation.toAccount = updates.operation?.toAccount;
		if (updates.operation?.account !== undefined)
			newItem.operation.account = updates.operation?.account;

		logger.debug("item to edit updated", { newItem });
		setItemPrimitives(newItem);
	};

	const handleSubmit = async () => {
		setShowErrors(true);
		
		if (!isFormValid) {
			logger.debug("Form is not valid", { errors });
			return;
		}

		try {
			// Update the item with new values
			account && item.operation.updateAccount(account.id);
			item.operation.updateToAccount(toAccount?.id);
			item.updatePrice(new ItemPrice(itemPrimitives.price));
			item.updateName(new ItemName(itemPrimitives.name));
			item.recurrence.updateStartDate(new DateValueObject(date));
			category && item.updateCategory(category.id);
			subCategory && item.updateSubCategory(subCategory.id);
			
			// Update brand and store if they have changed
			if (itemPrimitives.brand !== item.info?.value.brand?.value) {
				// Handle brand update if needed
			}
			if (itemPrimitives.store !== item.info?.value.store?.value) {
				// Handle store update if needed  
			}
			
			item.updateRecurrence(
				recurrenceType === "oneTime"
					? ItemRecurrence.oneTime(new DateValueObject(date))
					: recurrenceType === "infinite"
					? ItemRecurrence.infinite(
							new DateValueObject(date),
							new ItemRecurrenceFrequency(frequencyString)
					  )
					: untilDate
					? ItemRecurrence.untilDate(
							new DateValueObject(date),
							new ItemRecurrenceFrequency(frequencyString),
							new DateValueObject(untilDate)
					  )
					: ItemRecurrence.untilNRecurrences(
							new DateValueObject(date),
							new ItemRecurrenceFrequency(frequencyString),
							new NumberValueObject(recurrences)
					  )
			);

			await updateItem.execute(item);
			updateItems();
			onClose();
		} catch (error) {
			logger.error("Failed to update item", { error });
		}
	};

	return (
		<div className="create-budget-item-modal">
			<Typography variant="h3" component="h3" gutterBottom>
				Edit Item
			</Typography>
			
			<SelectWithCreation
				id="name"
				label="Name"
				item={itemPrimitives.name}
				items={[]} // No existing items for edit form
				onChange={(name) => updateItemPrimitives({ name })}
				error={showErrors ? errors.name : undefined}
			/>
			
			<div className="form-row">
				{DateInput}
				<PriceInput
					id="amount"
					label="Amount"
					value={new PriceValueObject(itemPrimitives.price, {
						withSign: false,
						decimals: 0,
					})}
					onChange={(amount) => updateItemPrimitives({ price: amount.toNumber() })}
					error={showErrors ? errors.price : undefined}
				/>
			</div>
			
			<div className="form-row">
				<Select
					id="type"
					label="Type"
					value={itemPrimitives.operation.type}
					values={["expense", "income", "transfer"]}
					onChange={(type) =>
						updateItemPrimitives({
							operation: {
								...itemPrimitives.operation,
								type: type.toLowerCase() as OperationType,
							},
						})
					}
				/>
				{AccountSelect}
				{itemPrimitives.operation.type === "transfer" && ToAccountSelect}
			</div>
			
			<div className="form-row">
				{CategorySelect}
				{SubCategorySelect}
			</div>
			
			<div className="form-row">
				<SelectWithCreation
					id="brand"
					label="Brand"
					item={itemPrimitives.brand ?? ""}
					items={brands.map((b) => b.value)}
					onChange={(brand) => updateItemPrimitives({ brand })}
				/>
				<SelectWithCreation
					id="store"
					label="Store"
					item={itemPrimitives.store ?? ""}
					items={stores.map((s) => s.value)}
					onChange={(store) => updateItemPrimitives({ store })}
				/>
			</div>
			
			{RecurrenceForm}
			
			<div className="modal-button-container">
				<button onClick={handleSubmit} disabled={showErrors && !isFormValid}>
					Update Item
				</button>
				<button onClick={onClose}>
					Cancel
				</button>
			</div>
		</div>
	);
};
