import {
	Alert,
	Box,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControl,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

interface TransactionSummary {
	id: string;
	name: string;
	amount: number;
	date: string;
	operation: "income" | "expense" | "transfer";
	account?: string;
}

interface DeleteConfirmationDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: (reassignToId?: string) => void;
	title: string;
	message: string;
	itemName: string;
	itemType: "category" | "subcategory";
	availableReassignments: Array<{
		id: string;
		name: string;
		type: "category" | "subcategory";
	}>;
	hasRelatedItems: boolean;
	relatedTransactions?: TransactionSummary[];
}

export const DeleteConfirmationDialog = ({
	open,
	onClose,
	onConfirm,
	title,
	message,
	itemName,
	itemType,
	availableReassignments,
	hasRelatedItems,
	relatedTransactions = [],
}: DeleteConfirmationDialogProps) => {
	const [reassignToId, setReassignToId] = useState<string>("");
	const [showReassignSection, setShowReassignSection] = useState(false);

	useEffect(() => {
		if (open) {
			setReassignToId("");
			setShowReassignSection(hasRelatedItems);
		}
	}, [open, hasRelatedItems]);

	const handleConfirm = () => {
		onConfirm(showReassignSection ? reassignToId : undefined);
		onClose();
	};

	const handleClose = () => {
		setReassignToId("");
		setShowReassignSection(hasRelatedItems);
		onClose();
	};

	const filteredReassignments = availableReassignments.filter(
		(item) => item.type === itemType
	);

	const formatAmount = (amount: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		}).format(Math.abs(amount));
	};

	const getOperationColor = (
		operation: string
	): "success" | "error" | "info" | "default" => {
		switch (operation) {
			case "income":
				return "success";
			case "expense":
				return "error";
			case "transfer":
				return "info";
			default:
				return "default";
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			maxWidth="md"
			fullWidth
			sx={{
				"& .MuiDialog-paper": {
					backgroundColor: "var(--background-primary)",
					color: "var(--text-normal)",
					border: "1px solid var(--background-modifier-border)",
				},
			}}
		>
			<DialogTitle
				sx={{
					pb: 1,
					borderBottom: "1px solid var(--background-modifier-border)",
				}}
			>
				<Typography
					variant="body1"
					color="error"
					sx={{
						fontSize: "1.25rem",
						fontWeight: 600,
						color: "var(--text-error)",
					}}
				>
					{title}
				</Typography>
			</DialogTitle>

			<DialogContent
				sx={{ backgroundColor: "var(--background-primary)" }}
			>
				<Box sx={{ mb: 2 }}>
					<Typography
						variant="body1"
						gutterBottom
						sx={{ color: "var(--text-normal)" }}
					>
						{message}
					</Typography>
					<Typography
						variant="body1"
						color="error"
						sx={{
							fontWeight: 600,
							fontSize: "1.1rem",
							color: "var(--text-error)",
						}}
					>
						"{itemName}"
					</Typography>
				</Box>

				{hasRelatedItems && (
					<>
						<Alert
							severity="warning"
							sx={{
								mb: 2,
								backgroundColor:
									"var(--background-modifier-error)",
								color: "var(--text-on-accent)",
								"& .MuiAlert-icon": {
									color: "var(--text-on-accent)",
								},
							}}
						>
							This {itemType} has {relatedTransactions.length}{" "}
							related transaction
							{relatedTransactions.length !== 1 ? "s" : ""} that
							will be reassigned.
						</Alert>

						{relatedTransactions.length > 0 && (
							<Box sx={{ mb: 3 }}>
								<Typography
									variant="subtitle1"
									gutterBottom
									sx={{
										fontWeight: 600,
										color: "var(--text-normal)",
									}}
								>
									Related Transactions:
								</Typography>
								<TableContainer
									component={Paper}
									sx={{
										maxHeight: 200,
										mb: 2,
										backgroundColor:
											"var(--background-secondary)",
										border: "1px solid var(--background-modifier-border)",
									}}
								>
									<Table size="small" stickyHeader>
										<TableHead>
											<TableRow>
												<TableCell
													sx={{
														fontWeight: 600,
														backgroundColor:
															"var(--background-secondary-alt)",
														color: "var(--text-normal)",
														borderBottom:
															"1px solid var(--background-modifier-border)",
													}}
												>
													Name
												</TableCell>
												<TableCell
													sx={{
														fontWeight: 600,
														backgroundColor:
															"var(--background-secondary-alt)",
														color: "var(--text-normal)",
														borderBottom:
															"1px solid var(--background-modifier-border)",
													}}
												>
													Amount
												</TableCell>
												<TableCell
													sx={{
														fontWeight: 600,
														backgroundColor:
															"var(--background-secondary-alt)",
														color: "var(--text-normal)",
														borderBottom:
															"1px solid var(--background-modifier-border)",
													}}
												>
													Type
												</TableCell>
												<TableCell
													sx={{
														fontWeight: 600,
														backgroundColor:
															"var(--background-secondary-alt)",
														color: "var(--text-normal)",
														borderBottom:
															"1px solid var(--background-modifier-border)",
													}}
												>
													Date
												</TableCell>
												{relatedTransactions.some(
													(t) => t.account
												) && (
													<TableCell
														sx={{
															fontWeight: 600,
															backgroundColor:
																"var(--background-secondary-alt)",
															color: "var(--text-normal)",
															borderBottom:
																"1px solid var(--background-modifier-border)",
														}}
													>
														Account
													</TableCell>
												)}
											</TableRow>
										</TableHead>
										<TableBody>
											{relatedTransactions
												.slice(0, 10)
												.map((transaction) => (
													<TableRow
														key={transaction.id}
														hover
														sx={{
															"&:hover": {
																backgroundColor:
																	"var(--background-modifier-hover)",
															},
														}}
													>
														<TableCell
															sx={{
																color: "var(--text-normal)",
																borderBottom:
																	"1px solid var(--background-modifier-border)",
															}}
														>
															<Typography
																variant="body2"
																noWrap
																sx={{
																	color: "var(--text-normal)",
																}}
															>
																{
																	transaction.name
																}
															</Typography>
														</TableCell>
														<TableCell
															sx={{
																borderBottom:
																	"1px solid var(--background-modifier-border)",
															}}
														>
															<Typography
																variant="body2"
																color={
																	transaction.operation ===
																	"income"
																		? "success.main"
																		: "error.main"
																}
																sx={{
																	fontWeight: 500,
																	color:
																		transaction.operation ===
																		"income"
																			? "var(--text-success)"
																			: "var(--text-error)",
																}}
															>
																{transaction.operation ===
																"income"
																	? "+"
																	: "-"}
																{formatAmount(
																	transaction.amount
																)}
															</Typography>
														</TableCell>
														<TableCell
															sx={{
																borderBottom:
																	"1px solid var(--background-modifier-border)",
															}}
														>
															<Chip
																label={
																	transaction.operation
																}
																size="small"
																color={getOperationColor(
																	transaction.operation
																)}
																variant="outlined"
																sx={{
																	borderColor:
																		transaction.operation ===
																		"income"
																			? "var(--text-success)"
																			: transaction.operation ===
																			  "expense"
																			? "var(--text-error)"
																			: "var(--text-muted)",
																	color:
																		transaction.operation ===
																		"income"
																			? "var(--text-success)"
																			: transaction.operation ===
																			  "expense"
																			? "var(--text-error)"
																			: "var(--text-muted)",
																}}
															/>
														</TableCell>
														<TableCell
															sx={{
																borderBottom:
																	"1px solid var(--background-modifier-border)",
															}}
														>
															<Typography
																variant="body2"
																sx={{
																	color: "var(--text-normal)",
																}}
															>
																{formatDate(
																	transaction.date
																)}
															</Typography>
														</TableCell>
														{relatedTransactions.some(
															(t) => t.account
														) && (
															<TableCell
																sx={{
																	borderBottom:
																		"1px solid var(--background-modifier-border)",
																}}
															>
																<Typography
																	variant="body2"
																	noWrap
																	sx={{
																		color: "var(--text-normal)",
																	}}
																>
																	{transaction.account ||
																		"-"}
																</Typography>
															</TableCell>
														)}
													</TableRow>
												))}
										</TableBody>
									</Table>
								</TableContainer>
								{relatedTransactions.length > 10 && (
									<Typography
										variant="body2"
										color="text.secondary"
										sx={{
											textAlign: "center",
											color: "var(--text-muted)",
										}}
									>
										... and{" "}
										{relatedTransactions.length - 10} more
										transactions
									</Typography>
								)}
							</Box>
						)}

						<Divider
							sx={{
								my: 2,
								borderColor:
									"var(--background-modifier-border)",
							}}
						/>

						<Box sx={{ mb: 2 }}>
							<Typography
								variant="subtitle1"
								gutterBottom
								sx={{ color: "var(--text-normal)" }}
							>
								Reassign to another {itemType}:
							</Typography>

							<FormControl fullWidth size="small">
								<InputLabel sx={{ color: "var(--text-muted)" }}>
									Select {itemType} to reassign to
								</InputLabel>
								<Select
									value={reassignToId}
									onChange={(e) =>
										setReassignToId(e.target.value)
									}
									label={`Select ${itemType} to reassign to`}
									sx={{
										backgroundColor:
											"var(--background-secondary)",
										color: "var(--text-normal)",
										"& .MuiOutlinedInput-notchedOutline": {
											borderColor:
												"var(--background-modifier-border)",
										},
										"&:hover .MuiOutlinedInput-notchedOutline":
											{
												borderColor:
													"var(--text-muted)",
											},
										"&.Mui-focused .MuiOutlinedInput-notchedOutline":
											{
												borderColor:
													"var(--interactive-accent)",
											},
									}}
								>
									{filteredReassignments
										.sort((a, b) =>
											a.name.localeCompare(b.name)
										)
										.map((item) => (
											<MenuItem
												key={item.id}
												value={item.id}
												sx={{
													color: "var(--text-normal)",
													backgroundColor:
														"var(--background-secondary)",
													"&:hover": {
														color: "var(--text-accent-hover)",
														backgroundColor:
															"var(--background-modifier-hover)",
													},
												}}
											>
												{item.name}
											</MenuItem>
										))}
								</Select>
							</FormControl>

							{filteredReassignments.length === 0 && (
								<Typography
									variant="body2"
									color="text.secondary"
									sx={{
										mt: 1,
										color: "var(--text-muted)",
									}}
								>
									No other {itemType}s available for
									reassignment.
								</Typography>
							)}
						</Box>
					</>
				)}

				{!hasRelatedItems && (
					<Alert
						severity="info"
						sx={{
							mb: 2,
							backgroundColor: "var(--background-modifier-cover)",
							color: "var(--text-normal)",
							"& .MuiAlert-icon": {
								color: "var(--text-muted)",
							},
						}}
					>
						This {itemType} has no related transactions or items and
						can be safely deleted.
					</Alert>
				)}
			</DialogContent>

			<DialogActions
				sx={{
					px: 3,
					pb: 2,
					borderTop: "1px solid var(--background-modifier-border)",
					backgroundColor: "var(--background-primary)",
				}}
			>
				<Button
					onClick={handleClose}
					color="primary"
					sx={{
						color: "var(--text-normal)",
						"&:hover": {
							backgroundColor: "var(--background-modifier-hover)",
						},
					}}
				>
					Cancel
				</Button>
				<Button
					onClick={handleConfirm}
					color="error"
					variant="contained"
					disabled={showReassignSection && !reassignToId}
					sx={{
						backgroundColor: "var(--text-error)",
						color: "var(--text-on-accent)",
						"&:hover": {
							backgroundColor: "var(--text-error-hover)",
						},
						"&:disabled": {
							backgroundColor:
								"var(--background-modifier-border)",
							color: "var(--text-muted)",
						},
					}}
				>
					Delete {itemType}
				</Button>
			</DialogActions>
		</Dialog>
	);
};
