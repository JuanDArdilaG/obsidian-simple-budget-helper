import { PriceValueObject } from "@juandardilag/value-objects";
import CloseIcon from "@mui/icons-material/Close";
import {
	Box,
	Button,
	Checkbox,
	FormControlLabel,
	FormHelperText,
	IconButton,
	Typography,
} from "@mui/material";
import { PriceInput } from "apps/obsidian-plugin/components/Input/PriceInput";
import { AccountsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { PaymentSplitPrimitives } from "contexts/Transactions/domain";
import { useContext, useMemo } from "react";
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
	const { accounts } = useContext(AccountsContext);

	// Memoize for performance
	const accountList = useMemo(
		() =>
			accounts.map((account) => ({
				id: account.id.value,
				name: account.name.value,
				balance:
					typeof account.balance === "number"
						? account.balance
						: account.balance?.value ?? 0,
			})),
		[accounts]
	);

	const selectedIds = useMemo(
		() => new Set(selectedAccounts.map((split) => split.accountId)),
		[selectedAccounts]
	);

	const handleAccountToggle = (accountId: string, checked: boolean) => {
		let newSplits: PaymentSplitPrimitives[];
		if (checked) {
			// Add account with default amount
			newSplits = [...selectedAccounts, { accountId, amount: 0 }];
		} else {
			// Remove account
			newSplits = selectedAccounts.filter(
				(split) => split.accountId !== accountId
			);
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

	const handleRemove = (accountId: string) => {
		onChange(
			selectedAccounts.filter((split) => split.accountId !== accountId)
		);
	};

	const handleSplitEvenly = () => {
		if (selectedAccounts.length === 0) return;
		const evenAmount = totalAmount / selectedAccounts.length;
		const newSplits = selectedAccounts.map((split) => ({
			...split,
			amount: evenAmount,
		}));
		onChange(newSplits);
	};

	const handleMax = (accountId: string) => {
		const newSplits = selectedAccounts.map((split) =>
			split.accountId === accountId
				? { ...split, amount: totalAmount }
				: split
		);
		onChange(newSplits);
	};

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
			<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
				<Typography
					variant="body2"
					sx={{ color: "var(--text-muted)", mb: 1 }}
				>
					{label}
				</Typography>
				{/* Account selection list */}
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						gap: 1,
						mb: 1,
					}}
				>
					{accountList.map((account) => (
						<FormControlLabel
							key={account.id}
							control={
								<Checkbox
									checked={selectedIds.has(account.id)}
									onChange={(e) =>
										handleAccountToggle(
											account.id,
											e.target.checked
										)
									}
									disabled={isLocked}
									slotProps={{
										input: {
											"aria-label": `Select account ${account.name}`,
										},
									}}
									sx={{
										color: "var(--interactive-accent)",
										p: 0,
										mr: 1,
									}}
								/>
							}
							label={
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1,
									}}
								>
									{/* Account icon placeholder removed (icon not present) */}
									<Typography
										variant="body2"
										sx={{
											color: "var(--text-normal)",
											minWidth: 80,
										}}
									>
										{account.name}
									</Typography>
									{typeof account.balance === "number" && (
										<Typography
											variant="caption"
											sx={{
												color: "var(--text-faint)",
												ml: 1,
											}}
										>
											Balance: $
											{Number(account.balance).toFixed(2)}
										</Typography>
									)}
								</Box>
							}
							disabled={isLocked}
						/>
					))}
				</Box>

				{/* Split Evenly button */}
				{selectedAccounts.length > 1 && (
					<Button
						variant="outlined"
						onClick={handleSplitEvenly}
						disabled={isLocked}
						sx={{
							alignSelf: "flex-start",
							mb: 1,
							color: "var(--interactive-accent)",
							borderColor: "var(--interactive-accent)",
						}}
					>
						Split Evenly
					</Button>
				)}

				{/* Selected accounts and amount inputs */}
				{selectedAccounts.length > 0 && (
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 1,
						}}
					>
						{selectedAccounts.map((split) => {
							const account = accountList.find(
								(a) => a.id === split.accountId
							);
							if (!account) return null;
							return (
								<Box
									key={split.accountId}
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1,
										background:
											"var(--background-secondary)",
										borderRadius: 1,
										p: 1,
									}}
								>
									<Typography
										variant="body2"
										sx={{
											color: "var(--text-normal)",
											minWidth: 80,
										}}
									>
										{account.name}
									</Typography>
									{typeof account.balance === "number" && (
										<Typography
											variant="caption"
											sx={{
												color: "var(--text-faint)",
												ml: 1,
											}}
										>
											Balance: $
											{Number(account.balance).toFixed(2)}
										</Typography>
									)}
									<PriceInput
										id={`amount-${split.accountId}`}
										label="Amount"
										value={
											new PriceValueObject(
												split.amount || 0,
												{ withSign: false, decimals: 2 }
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
									{/* Max button for single-account split */}
									{selectedAccounts.length === 1 && (
										<Button
											variant="text"
											size="small"
											onClick={() =>
												handleMax(split.accountId)
											}
											disabled={isLocked}
											sx={{
												color: "var(--interactive-accent)",
												minWidth: 0,
												px: 1,
											}}
										>
											Max
										</Button>
									)}
									<IconButton
										onClick={() =>
											handleRemove(split.accountId)
										}
										disabled={isLocked}
										size="small"
										sx={{ color: "var(--text-error)" }}
										aria-label={`Remove account ${account.name}`}
									>
										<CloseIcon fontSize="small" />
									</IconButton>
								</Box>
							);
						})}
					</Box>
				)}

				{/* Distribution feedback */}
				{selectedAccounts.length > 0 && totalAmount > 0 && (
					<Box
						sx={{
							mt: 1,
							p: 1,
							borderRadius: 1,
							background:
								remainingAmount === 0
									? "var(--background-modifier-success, #22543d)"
									: "var(--background-modifier-warning, #b7791f)",
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
								: `Remaining: $${remainingAmount.toFixed(2)}`}
						</Typography>
					</Box>
				)}

				{error && (
					<FormHelperText
						style={{ color: "var(--text-error)", marginLeft: 0 }}
					>
						{error}
					</FormHelperText>
				)}
			</Box>
		</WithLockField>
	);
};
