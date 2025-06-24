import { Typography } from "@mui/material";
import { Button } from "apps/obsidian-plugin/components/Button";
import { Input } from "apps/obsidian-plugin/components/Input/Input";
import { PriceInput } from "apps/obsidian-plugin/components/Input/PriceInput";
import { useDateInput } from "apps/obsidian-plugin/components/Input/useDateInput";
import {
	Select,
	useCategorySelect,
	useSubCategorySelect,
} from "apps/obsidian-plugin/components/Select";
import { useLogger } from "apps/obsidian-plugin/hooks";
import { TransactionsContext } from "apps/obsidian-plugin/views";
import { AccountsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts/AccountsContext";
import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import {
	Transaction,
	TransactionDate,
	TransactionName,
} from "contexts/Transactions/domain";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { useContext, useState } from "react";

export const EditTransactionPanel = ({
	transaction,
	onUpdate,
	onClose,
}: {
	transaction: Transaction;
	onUpdate: () => Promise<void>;
	onClose: () => void;
}) => {
	const { logger } = useLogger("EditTransactionPanel");
	const {
		useCases: { updateTransaction },
	} = useContext(TransactionsContext);
	const { accounts } = useContext(AccountsContext);

	const [name, setName] = useState(transaction.name.value);
	const [type, setType] = useState(transaction.operation.value);
	const { CategorySelect, category } = useCategorySelect({
		initialValueID: transaction.category.value,
	});
	const { SubCategorySelect, subCategory } = useSubCategorySelect({
		category,
		initialValueID: transaction.subCategory.value,
	});
	const [fromSplits, setFromSplits] = useState(
		transaction.fromSplits.map((split) => ({
			accountId: split.accountId.value,
			amount: split.amount,
		}))
	);
	const [toSplits, setToSplits] = useState(
		transaction.toSplits.map((split) => ({
			accountId: split.accountId.value,
			amount: split.amount,
		}))
	);
	const { DateInput, date } = useDateInput({
		initialValue: transaction.date,
	});

	// Helper function for price:
	const getTransactionSplitPrice = () => {
		if (type === "transfer" || type === "expense") {
			return new TransactionAmount(
				fromSplits.reduce((sum, s) => sum + s.amount.value, 0)
			);
		} else {
			return new TransactionAmount(
				toSplits.reduce((sum, s) => sum + s.amount.value, 0)
			);
		}
	};

	return (
		<div className="create-budget-item-modal">
			<Typography
				variant="h4"
				style={{ marginTop: 15, color: "var(--text-normal)" }}
			>
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
				value={getTransactionSplitPrice()}
				onChange={() => {
					/* Handle split-based editing if needed */
				}}
			/>
			<Select
				id="type"
				label="Type"
				value={type}
				values={["expense", "transfer", "income"]}
				onChange={(type) => setType(type)}
			/>
			{CategorySelect}
			{SubCategorySelect}
			{DateInput}
			{/* Splits Editor */}
			<div>
				<h4>From Splits</h4>
				{fromSplits.map((split, idx) => (
					<div
						key={idx}
						style={{
							display: "flex",
							gap: 8,
							alignItems: "center",
						}}
					>
						<Select
							id={`from-account-${idx}`}
							label="Account"
							value={split.accountId}
							values={accounts.map((acc) => acc.id.value)}
							onChange={(val) => {
								const newSplits = [...fromSplits];
								newSplits[idx].accountId = val;
								setFromSplits(newSplits);
							}}
						/>
						<PriceInput
							id={`from-amount-${idx}`}
							label="Amount"
							value={split.amount}
							onChange={(val) => {
								const newSplits = [...fromSplits];
								newSplits[idx].amount = val;
								setFromSplits(newSplits);
							}}
						/>
						<button
							onClick={() =>
								setFromSplits(
									fromSplits.filter((_, i) => i !== idx)
								)
							}
						>
							Remove
						</button>
					</div>
				))}
				<button
					onClick={() =>
						setFromSplits([
							...fromSplits,
							{
								accountId: accounts[0]?.id.value || "",
								amount: new TransactionAmount(0),
							},
						])
					}
				>
					Add Split
				</button>
			</div>
			<div>
				<h4>To Splits</h4>
				{toSplits.map((split, idx) => (
					<div
						key={idx}
						style={{
							display: "flex",
							gap: 8,
							alignItems: "center",
						}}
					>
						<Select
							id={`to-account-${idx}`}
							label="Account"
							value={split.accountId}
							values={accounts.map((acc) => acc.id.value)}
							onChange={(val) => {
								const newSplits = [...toSplits];
								newSplits[idx].accountId = val;
								setToSplits(newSplits);
							}}
						/>
						<PriceInput
							id={`to-amount-${idx}`}
							label="Amount"
							value={split.amount}
							onChange={(val) => {
								const newSplits = [...toSplits];
								newSplits[idx].amount = val;
								setToSplits(newSplits);
							}}
						/>
						<button
							onClick={() =>
								setToSplits(
									toSplits.filter((_, i) => i !== idx)
								)
							}
						>
							Remove
						</button>
					</div>
				))}
				<button
					onClick={() =>
						setToSplits([
							...toSplits,
							{
								accountId: accounts[0]?.id.value || "",
								amount: new TransactionAmount(0),
							},
						])
					}
				>
					Add Split
				</button>
			</div>
			{/* End Splits Editor */}
			<Button
				label="Edit"
				onClick={async () => {
					date.setSeconds(0);
					if (!category) return logger.debug("category not selected");
					if (!subCategory)
						return logger.debug("subCategory not selected");
					transaction.updateName(new TransactionName(name));
					transaction.updateDate(new TransactionDate(date));
					transaction.updateOperation(transaction.operation);
					transaction.setFromSplits(
						fromSplits.map(
							(s) =>
								new PaymentSplit(
									new AccountID(s.accountId),
									s.amount
								)
						)
					);
					transaction.setToSplits(
						toSplits.map(
							(s) =>
								new PaymentSplit(
									new AccountID(s.accountId),
									s.amount
								)
						)
					);
					transaction.updateCategory(category.id);
					transaction.updateSubCategory(subCategory.id);
					await updateTransaction.execute(transaction);
					await onUpdate();
					onClose();
				}}
			/>
		</div>
	);
};
