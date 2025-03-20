import { useContext, useMemo, useState } from "react";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { RecurrentItem } from "contexts/Items/domain";
import { AppContext } from "apps/obsidian-plugin/view";
import {
	Input,
	Select,
	SelectWithCreation,
} from "apps/obsidian-plugin/view/components";
import { OperationType } from "contexts/Shared/domain";

export const EditBudgetItemRecurrentPanel = ({
	item,
	onEdit,
	onClose,
}: {
	item: RecurrentItem;
	onEdit: (item: RecurrentItem) => Promise<void>;
	onClose: () => void;
}) => {
	const {
		categoriesWithSubcategories,
		categories,
		accounts,
		brands,
		stores,
	} = useContext(AppContext);

	const [category, setCategory] = useState(item.category.value);
	const subCategories = useMemo(
		() =>
			categoriesWithSubcategories.find(
				(catWithSubs) => catWithSubs.category.id.value === category
			)?.subCategories ?? [],
		[category]
	);

	const [name, setName] = useState(item.name.value);
	const [amount, setAmount] = useState(item.amount);
	const [type, setType] = useState(item.operation.value);

	const [subCategory, setSubCategory] = useState(item.subCategory.value);

	const [brand, setBrand] = useState(item.brand?.value);
	const [store, setStore] = useState(item.store?.value);

	const [account, setAccount] = useState(item.account.value);

	const [frequency, setFrequency] = useState(item.frequency.value);

	const [date, setDate] = useState(item.nextDate.valueOf());
	const [validation, setValidation] = useState<
		Record<string, boolean> | undefined
	>(undefined);
	// const validateOnUpdate = () => ({
	// 	name: name.length > 0,
	// 	amount: amount.toNumber() > 0,
	// 	account: account.length > 0,
	// 	date: date.toString() !== "Invalid Date",
	// 	category: category.length > 0,
	// 	subCategory: subCategory.length > 0,
	// 	frequency: frequency.length > 0,
	// });

	return (
		<div className="create-budget-item-modal">
			<h3>Edit Account Record</h3>
			<Input
				id="name"
				label="Name"
				value={name}
				onChange={(name: string) => setName(name)}
				error={!validation || validation.name ? undefined : "required"}
			/>
			<Input<PriceValueObject>
				id="amount"
				label="Amount"
				value={amount}
				onChange={setAmount}
				error={
					!validation || validation.amount ? undefined : "required"
				}
			/>
			<Select
				id="type"
				label="Type"
				value={type}
				values={{
					expense: "Expense",
					transfer: "Transfer",
					income: "Income",
				}}
				onChange={(type) =>
					setType(type.toLowerCase() as OperationType)
				}
			/>
			<SelectWithCreation
				id="account"
				label="From"
				item={account}
				items={accounts.map((acc) => acc.name.value)}
				onChange={(account) => setAccount(account ?? "")}
				error={
					!validation || validation.account ? undefined : "required"
				}
			/>
			<SelectWithCreation
				id="category"
				label="Category"
				item={category}
				items={categories.map((cat) => cat.name.value)}
				onChange={(category) => setCategory(category ?? "")}
				error={
					!validation || validation.category ? undefined : "required"
				}
			/>
			<SelectWithCreation
				id="subcategory"
				label="SubCategory"
				item={subCategory}
				items={subCategories.map((sub) => sub.name.value)}
				onChange={(sub) => setSubCategory(sub ?? "")}
				error={
					!validation || validation.subCategory
						? undefined
						: "required"
				}
			/>
			<Input<Date>
				id="date"
				label="Date"
				value={date}
				onChange={setDate}
				error={!validation || validation.date ? undefined : "required"}
			/>
			<SelectWithCreation
				id="brand"
				label="Brand"
				item={brand ?? ""}
				items={brands.map((b) => b.value)}
				onChange={setBrand}
			/>
			<SelectWithCreation
				id="store"
				label="Store"
				item={store ?? ""}
				items={stores.map((s) => s.value)}
				onChange={setStore}
			/>
			<Input
				id="frequency"
				label="Frequency"
				value={frequency}
				onChange={(freq) => setFrequency(freq ?? "")}
				error={
					!validation || validation.frequency ? undefined : "required"
				}
			/>
			<button
				onClick={async () => {
					// const validation = validateOnUpdate();
					// console.log({ validation });
					// setValidation(validation);
					// if (!Object.values(validation).every((value) => value))
					// 	return;

					date.setSeconds(0);

					// await onEdit(
					// 	new BudgetItemRecurrent(
					// 		item.id,
					// 		name,
					// 		account,
					// 		amount.toNumber(),
					// 		category,
					// 		subCategory,
					// 		brand,
					// 		store,
					// 		type,
					// 		new BudgetItemNextDate(date, true),
					// 		item.path,
					// 		new FrequencyString(frequency),
					// 		item.history
					// 	)
					// );

					onClose();
				}}
			>
				Create
			</button>
		</div>
	);
};
