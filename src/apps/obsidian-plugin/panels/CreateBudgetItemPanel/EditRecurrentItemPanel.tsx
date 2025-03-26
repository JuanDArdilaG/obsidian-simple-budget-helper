import { useContext, useMemo, useState } from "react";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import {
	ItemName,
	RecurrentItem,
	RecurrentItemNextDate,
} from "contexts/Items/domain";
import {
	AccountsContext,
	CategoriesContext,
	ItemsContext,
} from "apps/obsidian-plugin/views";
import {
	Input,
	Select,
	SelectWithCreation,
} from "apps/obsidian-plugin/components";
import { OperationType } from "contexts/Shared/domain";
import { AccountName, CategoryName, SubCategoryName } from "contexts";

export const EditRecurrentItemPanel = ({
	item,
	onClose,
	setUpdateItems,
}: {
	item: RecurrentItem;
	onClose: () => void;
	setUpdateItems: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
	const {
		useCases: { updateItem },
	} = useContext(ItemsContext);
	const { brands, stores } = useContext(ItemsContext);
	const {
		categoriesWithSubcategories,
		categories,
		getCategoryByID,
		getSubCategoryByID,
		getCategoryByName,
		getSubCategoryByName,
	} = useContext(CategoriesContext);

	const { accounts, getAccountByID, getAccountByName } =
		useContext(AccountsContext);
	const accountNames = useMemo(
		() => accounts.map((acc) => acc.name.value).sort(),
		[accounts]
	);

	const [category, setCategory] = useState(
		getCategoryByID(item.category)?.name.value ?? ""
	);
	const subCategories = useMemo(
		() =>
			categoriesWithSubcategories.find(
				(catWithSubs) => catWithSubs.category.name.value === category
			)?.subCategories ?? [],
		[category]
	);

	const [name, setName] = useState(item.name.value);
	const [amount, setAmount] = useState(item.price);
	const [type, setType] = useState(item.operation.value);

	const [subCategory, setSubCategory] = useState(
		getSubCategoryByID(item.subCategory)?.name.value ?? ""
	);

	const [brand, setBrand] = useState(item.brand?.value);
	const [store, setStore] = useState(item.store?.value);

	const [account, setAccount] = useState(
		getAccountByID(item.account)?.name.value ?? ""
	);

	const [toAccount, setToAccount] = useState(
		item.toAccount ? getAccountByID(item.toAccount)?.name.value : undefined
	);

	const [frequency, setFrequency] = useState(item.frequency.value);

	const [date, setDate] = useState(item.nextDate.valueOf());
	const [validation, setValidation] = useState<
		Record<string, boolean> | undefined
	>(undefined);

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
				values={["expense", "income", "transfer"]}
				onChange={(type) =>
					setType(type.toLowerCase() as OperationType)
				}
			/>
			<Select
				id="account"
				label="From"
				value={account}
				values={["", ...accountNames]}
				onChange={(account) => setAccount(account ?? "")}
				error={
					!validation || validation.account ? undefined : "required"
				}
			/>
			{type === "transfer" && (
				<Select
					id="toAccount"
					label="To"
					value={toAccount ?? ""}
					values={["", ...accountNames]}
					onChange={(account) => setToAccount(account)}
					error={
						!validation || validation.account
							? undefined
							: "required"
					}
				/>
			)}
			<SelectWithCreation
				id="category"
				label="Category"
				item={category}
				items={categories.map((cat) => cat.name.value).sort()}
				onChange={(category) => setCategory(category ?? "")}
				error={
					!validation || validation.category ? undefined : "required"
				}
			/>
			<SelectWithCreation
				id="subcategory"
				label="SubCategory"
				item={subCategory}
				items={subCategories.map((sub) => sub.name.value).sort()}
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
			{type === "transfer" && (
				<Input
					id="frequency"
					label="Frequency"
					value={frequency}
					onChange={(freq) => setFrequency(freq ?? "")}
					error={
						!validation || validation.frequency
							? undefined
							: "required"
					}
				/>
			)}
			<button
				onClick={async () => {
					date.setSeconds(0);

					item.update({
						name: new ItemName(name),
						account: getAccountByName(new AccountName(account))?.id,
						toAccount: toAccount
							? getAccountByName(new AccountName(toAccount))?.id
							: undefined,
						amount,
						category: getCategoryByName(new CategoryName(category))
							?.id,
						subCategory: getSubCategoryByName(
							new SubCategoryName(subCategory)
						)?.id,
						nextDate: new RecurrentItemNextDate(date),
					});

					await updateItem.execute(item);
					setUpdateItems(true);

					onClose();
				}}
			>
				Create
			</button>
		</div>
	);
};
