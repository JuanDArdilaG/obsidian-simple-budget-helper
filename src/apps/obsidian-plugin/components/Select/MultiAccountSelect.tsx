import { PriceValueObject } from "@juandardilag/value-objects";
import {
	Autocomplete,
	Box,
	Chip,
	FormHelperText,
	TextField,
	Typography,
} from "@mui/material";
import { PriceInput } from "apps/obsidian-plugin/components/Input/PriceInput";
import { useLogger } from "apps/obsidian-plugin/hooks";
import { AccountsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { PaymentSplitPrimitives } from "contexts/Transactions/domain";
import { SyntheticEvent, useContext } from "react";
import { WithLockField } from "../WithLockField";

interface MultiAccountSelectProps {
	id: string;
	label: string;
	placeholder?: string;
	selectedAccounts: PaymentSplitPrimitives[];
	onChange: (accounts: PaymentSplitPrimitives[]) => void;
	totalAmount?: number;
	error?: string;
	isLocked?: boolean;
	setIsLocked?: (value: boolean) => void;
}

export const MultiAccountSelect = ({
	id,
	label,
	placeholder,
	selectedAccounts,
	onChange,
	totalAmount = 0,
	error,
	isLocked,
	setIsLocked,
}: MultiAccountSelectProps) => {
	const { logger } = useLogger("MultiAccountSelect");
	const { accounts } = useContext(AccountsContext);

	// Convert selected accounts to display format
	const selectedAccountNames = selectedAccounts.map((split) => {
		const account = accounts.find(
			(acc) => acc.id.value === split.accountId
		);
		return account?.name.value || split.accountId;
	});

	const accountOptions = accounts.map((account) => account.name.value);

	const handleChange = (_: SyntheticEvent, newValue: string[]) => {
		logger.debug("MultiAccountSelect onChange", { newValue });

		// Convert account names back to PaymentSplitPrimitives
		const newSplits: PaymentSplitPrimitives[] = newValue.map(
			(accountName) => {
				const account = accounts.find(
					(acc) => acc.name.value === accountName
				);
				if (!account) {
					// If account doesn't exist, create a placeholder split
					return { accountId: accountName, amount: 0 };
				}

				// Check if this account was already selected to preserve amount
				const existingSplit = selectedAccounts.find(
					(split) => split.accountId === account.id.value
				);
				return {
					accountId: account.id.value,
					amount: existingSplit?.amount || 0,
				};
			}
		);

		// Distribute total amount equally among new accounts if no amounts were preserved
		if (newSplits.length > 0 && totalAmount > 0) {
			const hasExistingAmounts = newSplits.some(
				(split) => split.amount > 0
			);
			if (!hasExistingAmounts) {
				const amountPerSplit = totalAmount / newSplits.length;
				newSplits.forEach((split) => {
					split.amount = amountPerSplit;
				});
			}
		}

		onChange(newSplits);
	};

	const handleAmountChange = (accountId: string, newAmount: number) => {
		const updatedSplits = selectedAccounts.map((split) =>
			split.accountId === accountId
				? { ...split, amount: newAmount }
				: split
		);
		onChange(updatedSplits);
	};

	// Calculate total distributed amount
	const totalDistributed = selectedAccounts.reduce(
		(sum, split) => sum + split.amount,
		0
	);
	const remainingAmount = totalAmount - totalDistributed;

	return (
		<WithLockField
			isLocked={isLocked}
			setIsLocked={setIsLocked}
			style={{ width: "100%" }}
		>
			<Box>
				<Autocomplete
					multiple
					freeSolo
					value={selectedAccountNames}
					disabled={isLocked}
					options={accountOptions}
					onChange={handleChange}
					renderTags={(value, getTagProps) =>
						value.map((option, index) => {
							const { key, ...chipProps } = getTagProps({
								index,
							});
							return (
								<Chip
									key={key}
									variant="outlined"
									label={option}
									{...chipProps}
									size="small"
								/>
							);
						})
					}
					renderInput={(params) => (
						<TextField
							{...params}
							label={label}
							placeholder={placeholder || "Select accounts..."}
							variant="standard"
							disabled={isLocked}
							error={!!error}
							slotProps={{
								inputLabel: {
									style: {
										color: error
											? "var(--text-error)"
											: "var(--text-muted)",
										paddingLeft: 12,
										paddingTop: 5,
										zIndex: 1,
									},
								},
								input: {
									...params.InputProps,
									style: {
										color: "var(--text-normal)",
										backgroundColor:
											"var(--background-modifier-form-field)",
									},
								},
								htmlInput: {
									...params.inputProps,
									style: {
										width: "100%",
										border: "none",
										paddingLeft: 12,
									},
								},
							}}
						/>
					)}
				/>
				{error && (
					<FormHelperText
						style={{ color: "var(--text-error)", marginLeft: 0 }}
					>
						{error}
					</FormHelperText>
				)}

				{/* Amount distribution inputs */}
				{selectedAccounts.length > 0 && (
					<Box sx={{ mt: 2 }}>
						<Typography variant="subtitle2" sx={{ mb: 1 }}>
							Amount Distribution
						</Typography>

						{selectedAccounts.map((split) => {
							const account = accounts.find(
								(acc) => acc.id.value === split.accountId
							);
							return (
								<Box
									key={split.accountId}
									sx={{
										mb: 1,
										display: "flex",
										alignItems: "center",
										gap: 1,
									}}
								>
									<Typography
										variant="body2"
										sx={{
											minWidth: "120px",
											flexShrink: 0,
										}}
									>
										{account?.name.value || split.accountId}
										:
									</Typography>
									<PriceInput
										id={`amount-${split.accountId}`}
										label="Amount"
										value={
											new PriceValueObject(
												split.amount || 0,
												{ withSign: false, decimals: 0 }
											)
										}
										onChange={(val) =>
											handleAmountChange(
												split.accountId,
												val.toNumber()
											)
										}
										disabled={isLocked}
									/>
								</Box>
							);
						})}

						{/* Remaining amount display */}
						<Box
							sx={{
								mt: 1,
								p: 1,
								backgroundColor:
									remainingAmount === 0
										? "var(--background-modifier-success, #22543d)"
										: "var(--background-modifier-warning, #b7791f)",
								borderRadius: 1,
							}}
						>
							<Typography
								variant="body2"
								sx={{
									fontWeight: "medium",
									color:
										remainingAmount === 0
											? "var(--text-on-success, #fff)"
											: "var(--text-on-warning, #222)",
									letterSpacing: 0.5,
								}}
							>
								{remainingAmount === 0
									? "✓ Amount fully distributed"
									: `Remaining: $${remainingAmount.toFixed(
											2
									  )}`}
							</Typography>
						</Box>
					</Box>
				)}
			</Box>
		</WithLockField>
	);
};
