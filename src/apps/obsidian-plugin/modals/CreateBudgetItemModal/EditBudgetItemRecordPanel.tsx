import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { BudgetItemRecord } from "budget/BudgetItem/BugetItemRecord/BudgetItemRecord";
import { BudgetItemSimple } from "budget/BudgetItem/BudgetItemSimple";
import { useContext, useMemo, useState } from "react";
import { BudgetItemRecordType } from "../../budget/BudgetItem/BugetItemRecord/BudgetItemRecord";
import { Input } from "view/components/Input";
import { Select } from "view/components/Select";
import { SelectWithCreation } from "view/components/SelectWithCreation";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { BudgetContext } from "view/views/RightSidebarReactView/RightSidebarReactView";

export const EditBudgetItemRecordPanel = ({
	record,
	onUpdate,
}: {
	record: BudgetItemRecord;
	onUpdate: (item: BudgetItem) => Promise<void>;
}) => {
	const { budget } = useContext(BudgetContext);
	const categories = useMemo(
		() => budget.getCategories({ order: "asc" }),
		[budget]
	);
	const item = useMemo(() => budget.getItemByID(record.itemID), [budget]);

	const [name, setName] = useState(record.name);
	const [amount, setAmount] = useState(record.amount);
	const [type, setType] = useState(record.type);

	const [category, setCategory] = useState(item?.category || "");
	const subCategories = useMemo(
		() => budget.getSubCategories({ category, sort: { order: "asc" } }),
		[budget, category]
	);
	const [subCategory, setSubCategory] = useState(item?.subCategory || "");

	const [account, setAccount] = useState(record.account);

	const [toAccount, setToAccount] = useState(record.toAccount || "");

	const [date, setDate] = useState(record.date);
	const [validation, setValidation] = useState<
		Record<string, boolean> | undefined
	>(undefined);
	const validateOnUpdate = () => ({
		name: name.length > 0,
		amount: amount.toNumber() > 0,
		account: account.length > 0,
		date: date.toString() !== "Invalid Date",
		category: category.length > 0,
		subCategory: subCategory.length > 0,
		toAccount: type !== "transfer" || toAccount.length > 0,
	});

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
			{item instanceof BudgetItemSimple && (
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
						setType(type.toLowerCase() as BudgetItemRecordType)
					}
				/>
			)}
			<SelectWithCreation
				id="account"
				label="From"
				item={account}
				items={budget.getAccounts()}
				onChange={(account) => setAccount(account ?? "")}
				error={
					!validation || validation.account ? undefined : "required"
				}
			/>
			{type === "transfer" && (
				<SelectWithCreation
					id="to-account"
					label="To"
					item={toAccount}
					items={budget.getAccounts()}
					onChange={(account) => setToAccount(account ?? "")}
					error={
						!validation || validation.toAccount
							? undefined
							: "required"
					}
				/>
			)}
			{item instanceof BudgetItemSimple && (
				<>
					<SelectWithCreation
						id="category"
						label="Category"
						item={category}
						items={categories}
						onChange={(category) => setCategory(category ?? "")}
						error={
							!validation || validation.category
								? undefined
								: "required"
						}
					/>
					<SelectWithCreation
						id="subcategory"
						label="SubCategory"
						item={subCategory}
						items={subCategories}
						onChange={(category) => setSubCategory(category ?? "")}
						error={
							!validation || validation.subCategory
								? undefined
								: "required"
						}
					/>
				</>
			)}
			<Input<Date>
				id="date"
				label="Date"
				value={date}
				onChange={setDate}
				error={!validation || validation.date ? undefined : "required"}
			/>
			<button
				onClick={async () => {
					const validation = validateOnUpdate();
					setValidation(validation);
					if (!Object.values(validation).every((value) => value))
						return;

					date.setSeconds(0);

					if (!item) return;
					if (item instanceof BudgetItemSimple) {
						item.updateHistoryRecord(
							record.id,
							name,
							account,
							date,
							type,
							amount.toNumber(),
							category,
							subCategory,
							type === "transfer" ? toAccount : undefined
						);
					} else {
						item.updateHistoryRecord(
							record.id,
							name,
							account,
							date,
							type,
							amount.toNumber(),
							category,
							subCategory
						);
					}

					await onUpdate(item);
				}}
			>
				Create
			</button>
		</div>
	);
};
