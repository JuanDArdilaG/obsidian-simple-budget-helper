import { useContext, useMemo, useState } from "react";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import {
	Transaction,
	TransactionDate,
	TransactionName,
} from "contexts/Transactions/domain";
import { AppContext } from "apps/obsidian-plugin/view";
import {
	Input,
	Select,
	SelectWithCreation,
} from "apps/obsidian-plugin/view/components";
import { OperationType } from "contexts/Shared/domain";
import { UpdateTransactionUseCase } from "contexts/Transactions/application";
import { AccountID } from "contexts";

export const EditTransactionPanel = ({
	transaction,
	onUpdate,
}: {
	transaction: Transaction;
	onUpdate: () => Promise<void>;
}) => {
	const { categoriesWithSubcategories, accounts, container, categories } =
		useContext(AppContext);

	const updateTransactionUseCase = container.resolve(
		"updateTransactionUseCase"
	) as UpdateTransactionUseCase;

	const [name, setName] = useState(transaction.name.value);
	const [amount, setAmount] = useState(transaction.amount);
	const [type, setType] = useState(transaction.operation.value);
	const [category, setCategory] = useState(transaction.category.value);
	const subCategories = useMemo(
		() =>
			categoriesWithSubcategories.find(
				(catWithSubs) => catWithSubs.category.id.value === category
			)?.subCategories ?? [],
		[category]
	);
	const [subCategory, setSubCategory] = useState(
		transaction.subCategory.value
	);

	const [account, setAccount] = useState(transaction.account.value);
	const [toAccount, setToAccount] = useState(transaction.toAccount?.value);

	const [date, setDate] = useState(transaction.date.valueOf());
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
	// 	toAccount: type !== "transfer" || toAccount.length > 0,
	// });

	return (
		<div className="create-budget-item-modal">
			<h3>Edit Account Record</h3>
			<Input
				id="name"
				label="Name"
				value={name}
				onChange={(name) => setName(name)}
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
			{type === "transfer" && (
				<SelectWithCreation
					id="to-account"
					label="To"
					item={toAccount ?? ""}
					items={accounts.map((acc) => acc.name.value)}
					onChange={(account) => setToAccount(account ?? "")}
					error={
						!validation || validation.toAccount
							? undefined
							: "required"
					}
				/>
			)}
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
				onChange={(category) => setSubCategory(category ?? "")}
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
			<button
				onClick={async () => {
					// const validation = validateOnUpdate();
					// setValidation(validation);
					// if (!Object.values(validation).every((value) => value))
					// 	return;

					date.setSeconds(0);

					transaction.update(
						new TransactionName(name),
						new AccountID(account),
						new TransactionDate(date),
						transaction.operation,
						amount
					);

					await updateTransactionUseCase.execute(transaction);
					await onUpdate();
				}}
			>
				Create
			</button>
		</div>
	);
};
