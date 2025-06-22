import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Typography,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import { Button } from "apps/obsidian-plugin/components/Button";
import { ConfirmationModal } from "apps/obsidian-plugin/components/ConfirmationModal";
import { PriceLabel } from "apps/obsidian-plugin/components/PriceLabel";
import { EditTransactionPanel } from "apps/obsidian-plugin/panels/CreateBudgetItemPanel";
import { Transaction } from "contexts/Transactions/domain";
import { Pencil, Trash2 } from "lucide-react";
import React, { useCallback, useContext, useMemo, useState } from "react";
import { AccountsContext, AppContext, TransactionsContext } from "../Contexts";
import { DisplayableTransactionWithAccumulatedBalance } from "./AccountingList";

export const AccountingListItem = React.memo(
	({
		transactionWithBalance: { transaction, balance, prevBalance, display },
		selection,
		setSelection,
	}: {
		transactionWithBalance: DisplayableTransactionWithAccumulatedBalance;
		selection: Transaction[];
		setSelection: React.Dispatch<React.SetStateAction<Transaction[]>>;
	}) => {
		const theme = useTheme();
		const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
		const isTablet = useMediaQuery(theme.breakpoints.down("md"));

		const { plugin } = useContext(AppContext);
		const { updateAccounts } = useContext(AccountsContext);
		const {
			updateTransactions,
			updateFilteredTransactions,
			useCases: { deleteTransaction },
		} = useContext(TransactionsContext);

		const [editing, setEditing] = useState(false);

		// Memoize selection state
		const isSelected = useMemo(
			() => selection.includes(transaction),
			[selection, transaction]
		);

		// Memoize delete handler
		const handleDelete = useCallback(async () => {
			new ConfirmationModal(plugin.app, async (confirm) => {
				if (confirm) {
					await deleteTransaction.execute(transaction.id);
					updateFilteredTransactions();
					setSelection([]);
				}
			}).open();
		}, [
			plugin.app,
			deleteTransaction,
			transaction.id,
			updateFilteredTransactions,
			setSelection,
		]);

		// Memoize edit handler
		const handleEdit = useCallback(async () => {
			setEditing(!editing);
		}, [editing]);

		// Memoize update handler
		const handleUpdate = useCallback(async () => {
			setEditing(false);
			updateTransactions();
			updateAccounts();
			setSelection([]);
		}, [updateTransactions, updateAccounts, setSelection]);

		// Memoize accordion change handler
		const handleAccordionChange = useCallback(() => {
			setSelection([]);
		}, [setSelection]);

		if (!display.accountName) return <></>;

		return (
			<Accordion
				onChange={handleAccordionChange}
				style={{
					width: "100%",
					marginTop: "4px",
					marginBottom: "4px",
					paddingTop: "4px",
					paddingBottom: "4px",
					backgroundColor: "var(--background-primary)",
				}}
			>
				<AccordionSummary
					style={{
						backgroundColor: "var(--background-primary)",
						border: "none",
						boxShadow: "none",
						padding: isMobile ? "4px" : "8px",
					}}
					expandIcon={<></>}
					aria-controls={`transaction-${transaction.id}-content`}
					id={`transaction-${transaction.id}-header`}
				>
					<div
						className="accounting-list-item"
						style={{
							padding: isMobile ? "4px" : "8px",
							backgroundColor: isSelected
								? "var(--background-modifier-hover)"
								: "var(--background-primary)",
							width: "100%",
						}}
					>
						{/* Mobile Layout - Stacked */}
						{isMobile ? (
							<div style={{ width: "100%" }}>
								{/* Transaction Name */}
								<Typography
									variant="body2"
									style={{
										fontWeight: "bold",
										marginBottom: "4px",
										wordBreak: "break-word",
									}}
								>
									{display.truncatedTransactionName}
								</Typography>

								{/* Category and SubCategory - Compact */}
								<div style={{ marginBottom: "4px" }}>
									<Typography
										variant="caption"
										style={{ color: "var(--text-muted)" }}
									>
										{display.truncatedCategoryName}
										{display.subCategoryName &&
											` • ${display.truncatedSubCategoryName}`}
									</Typography>
								</div>

								{/* Amount and Account - Inline */}
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										marginBottom: "2px",
									}}
								>
									<span
										style={{
											fontSize: "12px",
											color: "var(--text-muted)",
										}}
									>
										{display.truncatedAccountName}
									</span>
									{display.realAmount && (
										<PriceLabel
											price={display.realAmount}
											operation={transaction.operation}
										/>
									)}
								</div>

								{/* Balance and Time - Compact */}
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
									}}
								>
									<div
										style={{
											fontSize: "11px",
											color: "var(--text-muted)",
										}}
									>
										<PriceLabel price={prevBalance} /> →{" "}
										<PriceLabel price={balance} />
									</div>
									<span
										style={{
											fontSize: "11px",
											color: "var(--text-muted)",
										}}
									>
										{display.formattedTime}
									</span>
								</div>
							</div>
						) : (
							/* Desktop Layout - Two Columns */
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									width: "100%",
									gap: isTablet ? "8px" : "16px",
								}}
							>
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										alignItems: "flex-start",
										justifyContent: "space-around",
										height: "100%",
										flex: 1,
										minWidth: 0, // Allow text truncation
									}}
								>
									<Typography
										variant="body2"
										style={{
											fontWeight: "bold",
											wordBreak: "break-word",
											marginBottom: "4px",
										}}
									>
										{display.transactionName}
									</Typography>
									<div style={{ width: "100%" }}>
										<div style={{ marginBottom: "2px" }}>
											<Typography
												variant="caption"
												style={{
													color: "var(--text-muted)",
												}}
											>
												<b>Category:</b>{" "}
												{display.categoryName.toString() ??
													""}
											</Typography>
										</div>
										<div>
											<Typography
												variant="caption"
												style={{
													color: "var(--text-muted)",
												}}
											>
												<b>SubCategory:</b>{" "}
												{display.subCategoryName ?? ""}
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
										minWidth: "fit-content",
									}}
								>
									<div>
										<span
											style={{
												fontSize: "12px",
												color: "var(--text-muted)",
											}}
										>
											{display.formattedTime}
										</span>
									</div>
									<div
										style={{
											display: "flex",
											gap: "8px",
											alignItems: "center",
											marginBottom: "4px",
											flexWrap: "wrap",
										}}
									>
										<span
											style={{
												fontSize: "12px",
												color: "var(--text-muted)",
											}}
										>
											{display.accountName.toString() ??
												""}
										</span>
										{display.realAmount && (
											<PriceLabel
												price={display.realAmount}
												operation={
													transaction.operation
												}
											/>
										)}
									</div>
									<div
										style={{
											fontSize: "11px",
											color: "var(--text-muted)",
										}}
									>
										<PriceLabel price={prevBalance} /> →{" "}
										<PriceLabel price={balance} />
									</div>
								</div>
							</div>
						)}
					</div>
				</AccordionSummary>
				<AccordionDetails
					style={{
						backgroundColor: "var(--background-primary)",
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						paddingTop: isMobile ? "12px" : "20px",
						paddingBottom: isMobile ? "12px" : "20px",
						gap: isMobile ? "8px" : "10px",
						flexWrap: "wrap",
					}}
				>
					<Button
						label={isMobile ? "" : "Edit"}
						icon={<Pencil size={isMobile ? 14 : 16} />}
						style={{
							cursor: "pointer",
							borderBottom: "1px solid black",
							minWidth: isMobile ? "40px" : "auto",
						}}
						onClick={handleEdit}
					/>
					<Button
						label={isMobile ? "" : "Delete"}
						icon={<Trash2 size={isMobile ? 14 : 16} />}
						style={{
							cursor: "pointer",
							borderBottom: "1px solid black",
							minWidth: isMobile ? "40px" : "auto",
						}}
						onClick={handleDelete}
					/>
					{editing && (
						<EditTransactionPanel
							transaction={transaction}
							onUpdate={handleUpdate}
						/>
					)}
				</AccordionDetails>
			</Accordion>
		);
	}
);
