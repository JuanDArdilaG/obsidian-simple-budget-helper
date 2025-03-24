import { useContext, useEffect, useMemo, useState } from "react";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { TransactionsContext } from "apps/obsidian-plugin/views";
import {
	Input,
	Select,
	SelectWithCreation,
} from "apps/obsidian-plugin/components";
import {
	Transaction,
	TransactionDate,
	TransactionName,
} from "contexts/Transactions";
import { Account, AccountID, AccountName } from "contexts/Accounts";
import { useAccounts, useCategories } from "apps/obsidian-plugin/hooks";
import { Category, CategoryID, Subcategory, SubcategoryID } from "contexts";

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
	getSubCategoryByID: (id: SubcategoryID) => Subcategory | undefined;
	onUpdate: () => Promise<void>;
}) => {
	const {
		useCases: { updateTransaction },
	} = useContext(TransactionsContext);

	const { subCategories, categories } = useCategories();
	const { accounts, getAccountByName } = useAccounts();

	const [name, setName] = useState(transaction.name.value);
	const [amount, setAmount] = useState(transaction.amount);
	const [type, setType] = useState(transaction.operation.value);
	const [categoryName, setCategoryName] = useState(
		getCategoryByID(transaction.categoryID)?.name.value
	);
	const [subCategoryName, setSubCategoryName] = useState(
		getSubCategoryByID(transaction.subCategory)?.name.value
	);

	const [accountName, setAccountName] = useState(
		getAccountByID(transaction.account)?.name.value
	);
	const [toAccountName, setToAccountName] = useState(
		transaction.toAccount
			? getAccountByID(transaction.toAccount)?.name.value
			: undefined
	);

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
			<SelectWithCreation
				id="account"
				label="From"
				item={accountName ?? ""}
				items={accounts.map((acc) => acc.name.value)}
				onChange={(account) => setAccountName(account ?? "")}
				// error={
				// !validation || validation.account ? undefined : "required"
				// }
			/>
			{type === "transfer" && (
				<SelectWithCreation
					id="to-account"
					label="To"
					item={toAccountName ?? ""}
					items={accounts.map((acc) => acc.name.value)}
					onChange={(account) => setToAccountName(account ?? "")}
					// error={
					// !validation || validation.toAccount
					// 		? undefined
					// 		: "required"
					// }
				/>
			)}
			<SelectWithCreation
				id="category"
				label="Category"
				item={categoryName ?? ""}
				items={categories.map((cat) => cat.name.value)}
				onChange={(category) => setCategoryName(category ?? "")}
				// error={
				// !validation || validation.category ? undefined : "required"
				// }
			/>
			<SelectWithCreation
				id="subcategory"
				label="SubCategory"
				item={subCategoryName ?? ""}
				items={subCategories.map((sub) => sub.name.value)}
				onChange={(category) => setSubCategoryName(category ?? "")}
				// error={
				// !validation || validation.subCategory
				// 		? undefined
				// 		: "required"
				// }
			/>
			<Input<Date>
				id="date"
				label="Date"
				value={date}
				onChange={setDate}
				// error={!validation || validation.date ? undefined : "required"}
			/>
			<button
				onClick={async () => {
					date.setSeconds(0);

					const account = getAccountByName(
						new AccountName(accountName ?? "")
					);

					if (!account) return;

					transaction.update(
						new TransactionName(name),
						account.id,
						new TransactionDate(date),
						transaction.operation,
						amount
					);

					await updateTransaction.execute(transaction);
					await onUpdate();
				}}
			>
				Create
			</button>
		</div>
	);
};
