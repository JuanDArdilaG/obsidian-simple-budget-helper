import { useContext, useState } from "react";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import {
	AccountsContext,
	CategoriesContext,
	TransactionsContext,
} from "apps/obsidian-plugin/views";
import {
	Input,
	Select,
	SelectWithCreation,
	useAccountSelect,
} from "apps/obsidian-plugin/components";
import {
	Transaction,
	TransactionDate,
	TransactionName,
} from "contexts/Transactions";
import { Account, AccountID, AccountName } from "contexts/Accounts";
import { Category, CategoryID, SubCategory, SubCategoryID } from "contexts";

export const EditTransactionPanel = ({
	transaction,
	getAccountByID,
	getCategoryByID,
	getSubCategoryByID,
	onUpdate,
}: {
	transaction: Transaction;
	getAccountByID: (id: AccountID) => Account | undefined;
	getCategoryByID: (id: CategoryID) => Category | undefined;
	getSubCategoryByID: (id: SubCategoryID) => SubCategory | undefined;
	onUpdate: () => Promise<void>;
}) => {
	const {
		useCases: { updateTransaction },
	} = useContext(TransactionsContext);

	const { subCategories, categories } = useContext(CategoriesContext);
	const { accounts, getAccountByName } = useContext(AccountsContext);

	const [name, setName] = useState(transaction.name.value);
	const [amount, setAmount] = useState(transaction.amount);
	const [type, setType] = useState(transaction.operation.value);
	const [categoryName, setCategoryName] = useState(
		getCategoryByID(transaction.categoryID)?.name.valueOf()
	);
	const [subCategoryName, setSubCategoryName] = useState(
		getSubCategoryByID(transaction.subCategory)?.name.valueOf()
	);
	const { AccountSelect, account } = useAccountSelect({
		label: "From",
		initialValueID: transaction.account,
	});
	const { AccountSelect: ToAccountSelect, account: toAccount } =
		useAccountSelect({
			label: "To",
			initialValueID: transaction.toAccount,
		});

	const [date, setDate] = useState(transaction.date.valueOf());

	return (
		<div className="create-budget-item-modal">
			<h3>Edit Account Record</h3>
			<Input
				id="name"
				label="Name"
				value={name}
				onChange={(name) => setName(name)}
				// error={!validation || validation.name ? undefined : "required"}
			/>
			<Input<PriceValueObject>
				id="amount"
				label="Amount"
				value={amount}
				onChange={setAmount}
				// error={
				// !validation || validation.amount ? undefined : "required"
				// }
			/>
			<Select
				id="type"
				label="Type"
				value={type}
				values={["expense", "transfer", "income"]}
				onChange={(type) => setType(type)}
			/>
			{AccountSelect}
			{type === "transfer" && ToAccountSelect}
			<SelectWithCreation
				id="category"
				label="Category"
				item={categoryName ?? ""}
				items={categories.map((cat) => cat.name.valueOf())}
				onChange={(category) => setCategoryName(category ?? "")}
				// error={
				// !validation || validation.category ? undefined : "required"
				// }
			/>
			<SelectWithCreation
				id="subcategory"
				label="SubCategory"
				item={subCategoryName ?? ""}
				items={subCategories.map((sub) => sub.name.valueOf())}
				onChange={(category) => setSubCategoryName(category ?? "")}
				// error={
				// !validation || validation.subCategory
				// 		? undefined
				// 		: "required"
				// }
			/>
			<Input<Date>
				dateWithTime
				id="date"
				label="Date"
				value={date}
				onChange={setDate}
				// error={!validation || validation.date ? undefined : "required"}
			/>
			<button
				onClick={async () => {
					date.setSeconds(0);

					if (!account) return console.error("account not selected");

					transaction.updateName(new TransactionName(name));
					transaction.updateDate(new TransactionDate(date));
					transaction.updateOperation(transaction.operation);
					transaction.updateAmount(amount);
					transaction.updateAccount(account.id);
					transaction.updateToAccount(toAccount?.id);

					await updateTransaction.execute(transaction);
					await onUpdate();
				}}
			>
				Create
			</button>
		</div>
	);
};
