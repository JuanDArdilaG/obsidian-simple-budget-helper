import { PriceLabel } from "apps/obsidian-plugin/components/PriceLabel";
import { Transaction, TransactionAmount } from "contexts/Transactions/domain";
import React, { useCallback, useContext, useMemo } from "react";
import { AccountsContext, AppContext, TransactionsContext } from "../Contexts";
import { DisplayableTransactionWithAccumulatedBalance } from "./AccountingList";

import {
	Box,
	IconButton,
	ListItem,
	Typography,
	useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { ConfirmationModal } from "apps/obsidian-plugin/components/ConfirmationModal";
import { RowComponentProps } from "react-window";

export type AccountingListItemProps = {
	transactionsList: (DisplayableTransactionWithAccumulatedBalance | string)[];
	selection: Transaction[];
	setSelection: React.Dispatch<React.SetStateAction<Transaction[]>>;
	onEditTransaction: (transaction: Transaction) => void;
	handleAuxClick: (transaction: Transaction) => void;
};

export const AccountingListItem = ({
	index,
	style,
	transactionsList,
	selection,
	setSelection,
	onEditTransaction,
	handleAuxClick,
}: RowComponentProps<AccountingListItemProps>) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const isTablet = useMediaQuery(theme.breakpoints.down("md"));

	const { plugin } = useContext(AppContext);
	const {
		useCases: { deleteTransaction },
		updateFilteredTransactions,
	} = useContext(TransactionsContext);
	const { updateAccounts } = useContext(AccountsContext);

	const item = useMemo(
		() => transactionsList[index],
		[transactionsList, index],
	);

	const { transaction, display, accounts } = useMemo(() => {
		if (String.isString(item)) {
			return { transaction: null, display: null, accounts: [] };
		}
		return item;
	}, [item]);

	const isTransfer = transaction?.operation.isTransfer() ?? false;

	const isSelected = useMemo(
		() =>
			selection.some(
				(t) => t.id.toString() === transaction?.id.toString(),
			),
		[selection, transaction?.id],
	);

	const handleDelete = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation(); // Prevent row selection
			new ConfirmationModal(plugin.app, async (confirm) => {
				if (confirm) {
					if (transaction)
						await deleteTransaction.execute(transaction.id);
					updateFilteredTransactions();
					updateAccounts();
					setSelection([]);
				}
			}).open();
		},
		[
			plugin.app,
			deleteTransaction,
			transaction?.id,
			updateFilteredTransactions,
			setSelection,
			updateAccounts,
		],
	);

	const handleEdit = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			transaction && onEditTransaction(transaction);
		},
		[onEditTransaction, transaction],
	);

	const key = useMemo(
		() => (String.isString(item) ? item : display!.id),
		[item, display],
	);

	if (display && !display.accounts.length) return <></>;

	return (
		<ListItem
			key={key}
			onClick={
				String.isString(item) || !transaction
					? undefined
					: () => handleAuxClick(transaction)
			}
			style={{
				padding: isMobile ? "2px" : "8px",
				minHeight: "auto",
				backgroundColor: isSelected
					? "var(--background-modifier-hover)"
					: "transparent",
				cursor: "pointer",
				borderBottom: "1px solid var(--background-modifier-border)",
				width: "100%",
				...style,
			}}
		>
			{String.isString(item) ? (
				<div
					style={{
						padding: "auto 0",
						paddingLeft: 30,
						fontWeight: "bold",
					}}
				>
					{new Date(item).toLocaleDateString("default", {
						year: "numeric",
						month: "short",
						day: "2-digit",
						weekday: "short",
					})}
				</div>
			) : (
				<div
					className="accounting-list-item"
					style={{
						flexGrow: 1,
						padding: isMobile ? "8px 4px" : "8px 16px",
						width: "100%",
						display: "flex",
						flexDirection: "column",
					}}
				>
					{isMobile ? (
						<div style={{ width: "100%" }}>
							{/* First Row: Name and Amount */}
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									marginBottom: "4px",
								}}
							>
								<Typography
									variant="body2"
									style={{
										wordBreak: "break-word",
									}}
								>
									{display?.truncatedTransactionName}
								</Typography>
								{display?.accounts.map((accountInfo) => (
									<PriceLabel
										key={accountInfo.name}
										price={accountInfo.realAmount}
										operation={transaction.operation}
									/>
								))}
							</div>

							{/* Second Row: Category and Account */}
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									marginBottom: "4px",
								}}
							>
								<Typography
									variant="caption"
									style={{ color: "var(--text-muted)" }}
								>
									{display?.truncatedCategoryName}
									{display?.subCategoryName &&
										` • ${display.truncatedSubCategoryName}`}
								</Typography>
								{isTransfer &&
									display?.accounts.map((accountInfo) => (
										<span
											key={accountInfo.name}
											style={{
												fontSize: "12px",
												color: "var(--text-muted)",
											}}
										>
											{accountInfo.realAmount.toNumber() <
											0
												? "← "
												: ""}
											{accountInfo.realAmount.toNumber() >
											0
												? "→ "
												: ""}
											{accountInfo.truncatedName}
										</span>
									))}
							</div>

							{/* Third Row: Balance and Date */}
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									marginBottom: "8px",
								}}
							>
								{accounts.map((accountBalance) => (
									<div
										key={accountBalance.id.value}
										style={{
											fontSize: "11px",
											color: "var(--text-muted)",
										}}
									>
										<PriceLabel
											price={
												new TransactionAmount(
													accountBalance.prevBalance
														.value,
												)
											}
										/>{" "}
										→{" "}
										<PriceLabel
											price={
												new TransactionAmount(
													accountBalance.balance
														.value,
												)
											}
										/>
									</div>
								))}
								<span
									style={{
										fontSize: "11px",
										color: "var(--text-muted)",
									}}
								>
									{display?.formattedTime}{" "}
									{display?.formattedDate}
								</span>
							</div>

							{/* Fourth Row: Actions */}
							<div
								style={{
									display: "flex",
									justifyContent: "flex-end",
								}}
							>
								<IconButton
									onClick={handleEdit}
									size="small"
									sx={{ padding: "4px" }}
								>
									<EditIcon fontSize="small" />
								</IconButton>
								<IconButton
									onClick={handleDelete}
									size="small"
									sx={{ padding: "4px" }}
								>
									<DeleteIcon fontSize="small" />
								</IconButton>
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
								alignItems: "center",
							}}
						>
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									alignItems: "flex-start",
									justifyContent: "center",
									flex: 1,
									minWidth: 0,
								}}
							>
								<Typography
									variant="body2"
									style={{
										wordBreak: "break-word",
										marginBottom: "4px",
									}}
								>
									{display?.transactionName}
								</Typography>
								<Typography
									variant="caption"
									style={{
										color: "var(--text-muted)",
									}}
								>
									<b>Store: </b>
									{transaction?.store ?? "-"}
								</Typography>
								<div>
									<Typography
										variant="caption"
										style={{
											color: "var(--text-muted)",
										}}
									>
										{display?.categoryName.toString() ?? ""}
										{display?.subCategoryName
											? ` • ${display.subCategoryName}`
											: ""}
									</Typography>
								</div>
							</div>
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									alignItems: "flex-end",
									justifyContent: "center",
									minWidth: "fit-content",
									gap: "4px",
								}}
							>
								{display?.accounts.map((accountInfo, index) => (
									<React.Fragment key={accountInfo.name}>
										<div
											style={{
												display: "flex",
												gap: "8px",
												alignItems: "center",
												flexWrap: "wrap",
											}}
										>
											<span
												style={{
													fontSize: "12px",
													color: "var(--text-muted)",
												}}
											>
												{isTransfer &&
												accountInfo.realAmount.toNumber() <
													0
													? "← "
													: ""}
												{isTransfer &&
												accountInfo.realAmount.toNumber() >
													0
													? "→ "
													: ""}
												{accountInfo.name.toString() ??
													""}
											</span>
											<PriceLabel
												price={accountInfo.realAmount}
												operation={
													transaction.operation
												}
											/>
										</div>
										<div
											style={{
												fontSize: "11px",
												color: "var(--text-muted)",
											}}
										>
											<PriceLabel
												price={
													new TransactionAmount(
														accounts[index]
															.prevBalance.value,
													)
												}
											/>{" "}
											→{" "}
											<PriceLabel
												price={
													new TransactionAmount(
														accounts[index].balance
															.value,
													)
												}
											/>
										</div>

										<span
											style={{
												fontSize: "11px",
												color: "var(--text-muted)",
											}}
										>
											{display?.formattedTime}{" "}
											{display?.formattedDate}
										</span>
									</React.Fragment>
								))}
							</div>
							<Box sx={{ display: "flex", gap: "4px" }}>
								<IconButton onClick={handleEdit} size="small">
									<EditIcon fontSize="small" />
								</IconButton>
								<IconButton onClick={handleDelete} size="small">
									<DeleteIcon fontSize="small" />
								</IconButton>
							</Box>
						</div>
					)}
				</div>
			)}
		</ListItem>
	);
};
