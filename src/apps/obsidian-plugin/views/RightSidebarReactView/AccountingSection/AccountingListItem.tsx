import {
	Accordion,
	AccordionSummary,
	Typography,
	AccordionDetails,
} from "@mui/material";
import { Pencil, Trash2 } from "lucide-react";
import { useContext, useMemo, useState } from "react";
import {
	AccountsContext,
	AppContext,
	CategoriesContext,
	TransactionsContext,
} from "../Contexts";
import { PriceLabel } from "apps/obsidian-plugin/components/PriceLabel";
import { EditTransactionPanel } from "apps/obsidian-plugin/panels/CreateBudgetItemPanel";
import { TransactionWithAccumulatedBalance } from "contexts/Reports/domain";
import { ConfirmationModal } from "apps/obsidian-plugin/components/ConfirmationModal";
import { Button } from "apps/obsidian-plugin/components/Button";
import { Transaction } from "contexts/Transactions/domain";

export const AccountingListItem = ({
	transactionWithBalance: { transaction, balance, prevBalance },
	selection,
	setSelection,
}: {
	transactionWithBalance: TransactionWithAccumulatedBalance;
	selection: Transaction[];
	setSelection: React.Dispatch<React.SetStateAction<Transaction[]>>;
}) => {
	const { plugin } = useContext(AppContext);
	const { updateAccounts, getAccountByID } = useContext(AccountsContext);
	const { getCategoryByID, getSubCategoryByID } =
		useContext(CategoriesContext);
	const {
		updateTransactions,
		updateFilteredTransactions,
		useCases: { deleteTransaction },
	} = useContext(TransactionsContext);

	const [editing, setEditing] = useState(false);

	const account = useMemo(
		() =>
			getAccountByID(
				transaction.operation.isTransfer() &&
					transaction.toAccount &&
					transaction.amount.isNegative()
					? transaction.toAccount
					: transaction.account
			),
		[transaction]
	);
	if (!account) return <></>;

	return (
		<Accordion
			onChange={() => setSelection([])}
			style={{
				width: "100%",
				marginTop: "5px",
				marginBottom: "5px",
				paddingTop: "5px",
				paddingBottom: "5px",
				backgroundColor: "var(--background-primary)",
			}}
		>
			<AccordionSummary
				style={{
					backgroundColor: "var(--background-primary)",
					border: "none",
					boxShadow: "none",
				}}
				expandIcon={<></>}
				aria-controls={`transaction-${transaction.id}-content`}
				id={`transaction-${transaction.id}-header`}
			>
				<div
					className="accounting-list-item"
					style={{
						padding: "8px",
						backgroundColor: selection.includes(transaction)
							? "var(--background-modifier-hover)"
							: "var(--background-primary)",
					}}
				>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "flex-start",
							justifyContent: "space-around",
							height: "100%",
						}}
					>
						<Typography variant="body1">
							{transaction.name.toString()}
						</Typography>
						<div style={{ width: "100%", marginTop: "5px" }}>
							<div style={{ marginBottom: "3px" }}>
								<Typography variant="body2">
									<b>Category:</b>{" "}
									{getCategoryByID(
										transaction.category
									)?.name.toString() ?? ""}
								</Typography>
							</div>
							<div>
								<Typography variant="body2">
									<b>SubCategory:</b>{" "}
									{
										getSubCategoryByID(
											transaction.subCategory
										)?.name.value
									}
								</Typography>
							</div>
						</div>
					</div>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "flex-end",
							justifyContent: "space-around",
						}}
					>
						<div>
							<span className="light-text">
								{transaction.date.toLocaleTimeString(
									"default",
									{
										hour: "2-digit",
										minute: "2-digit",
									}
								)}
							</span>{" "}
						</div>
						<div
							style={{
								display: "flex",
								gap: "10px",
								alignItems: "stretch",
								marginBottom: 5,
							}}
						>
							<span>{account?.name.toString() ?? ""}</span>
							<PriceLabel
								price={transaction.getRealAmountForAccount(
									account.id
								)}
								operation={transaction.operation}
							/>
						</div>
						<div className="small">
							<div>
								<PriceLabel price={prevBalance} /> {"→"}{" "}
								<PriceLabel price={balance} />
							</div>
						</div>
					</div>
				</div>
			</AccordionSummary>
			<AccordionDetails
				style={{
					backgroundColor: "var(--background-primary)",
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					paddingTop: 20,
					gap: 10,
				}}
			>
				<Button
					label="Edit"
					icon={<Pencil size={16} />}
					style={{
						cursor: "pointer",
						borderBottom: "1px solid black",
					}}
					onClick={async () => setEditing(!editing)}
				/>
				<Button
					label="Delete"
					icon={<Trash2 size={16} />}
					style={{
						cursor: "pointer",
						borderBottom: "1px solid black",
					}}
					onClick={async () => {
						new ConfirmationModal(plugin.app, async (confirm) => {
							if (confirm) {
								await deleteTransaction.execute(transaction.id);
								updateFilteredTransactions();
								setSelection([]);
							}
						}).open();
					}}
				/>
				{editing && (
					<EditTransactionPanel
						onUpdate={async () => {
							setEditing(false);
							updateTransactions();
							updateAccounts();
							setSelection([]);
						}}
						transaction={transaction}
					/>
				)}
			</AccordionDetails>
		</Accordion>
	);
};
