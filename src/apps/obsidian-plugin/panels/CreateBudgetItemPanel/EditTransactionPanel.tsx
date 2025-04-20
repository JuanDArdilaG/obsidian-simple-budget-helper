import { useContext, useState } from "react";
import { TransactionsContext } from "apps/obsidian-plugin/views";
import {
	Select,
	useAccountSelect,
	useCategorySelect,
	useSubCategorySelect,
} from "apps/obsidian-plugin/components/Select";
import {
	Transaction,
	TransactionDate,
	TransactionName,
} from "contexts/Transactions/domain";
import { Input } from "apps/obsidian-plugin/components/Input/Input";
import { useLogger } from "apps/obsidian-plugin/hooks";
import { useDateInput } from "apps/obsidian-plugin/components/Input/useDateInput";
import { PriceInput } from "apps/obsidian-plugin/components/Input/PriceInput";
import { Typography } from "@mui/material";
import { Button } from "apps/obsidian-plugin/components/Button";

export const EditTransactionPanel = ({
	transaction,
	onUpdate,
}: {
	transaction: Transaction;
	onUpdate: () => Promise<void>;
}) => {
	const { logger } = useLogger("EditTransactionPanel");
	const {
		useCases: { updateTransaction },
	} = useContext(TransactionsContext);

	const [name, setName] = useState(transaction.name.value);
	const [amount, setAmount] = useState(transaction.amount);
	const [type, setType] = useState(transaction.operation.value);
	const { CategorySelect, category } = useCategorySelect({
		initialValueID: transaction.category.value,
	});
	const { SubCategorySelect, subCategory } = useSubCategorySelect({
		category,
		initialValueID: transaction.subCategory.value,
	});
	const { AccountSelect, account } = useAccountSelect({
		label: "From",
		initialValueID: transaction.account.value,
	});
	const { AccountSelect: ToAccountSelect, account: toAccount } =
		useAccountSelect({
			label: "To",
			initialValueID: transaction.toAccount?.value,
		});
	const { DateInput, date } = useDateInput({
		dateWithTime: true,
		initialValue: transaction.date,
	});

	return (
		<div className="create-budget-item-modal">
			<Typography variant="h4" style={{ marginTop: 15 }}>
				Edit Transaction
			</Typography>
			<Input
				id="name"
				label="Name"
				value={name}
				onChange={(name) => setName(name)}
				// error={!validation || validation.name ? undefined : "required"}
			/>
			<PriceInput
				id="amount"
				label="Amount"
				value={amount}
				onChange={setAmount}
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
			{CategorySelect}
			{SubCategorySelect}
			{DateInput}
			<Button
				label="Edit"
				onClick={async () => {
					date.setSeconds(0);

					if (!account) return logger.error("account not selected");
					if (!category) return logger.error("category not selected");
					if (!subCategory)
						return logger.error("subCategory not selected");

					transaction.updateName(new TransactionName(name));
					transaction.updateDate(new TransactionDate(date));
					transaction.updateOperation(transaction.operation);
					transaction.updateAmount(amount);
					transaction.updateAccount(account.id);
					transaction.updateToAccount(toAccount?.id);
					transaction.updateCategory(category.id);
					transaction.updateSubCategory(subCategory.id);

					await updateTransaction.execute(transaction);
					await onUpdate();
				}}
			/>
		</div>
	);
};
