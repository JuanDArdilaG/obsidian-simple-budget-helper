import { PriceValueObject } from "@juandardilag/value-objects";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {
	Box,
	Button,
	Checkbox,
	FormControl,
	FormHelperText,
	IconButton,
	InputLabel,
	MenuItem,
	Select,
	Typography,
} from "@mui/material";
import { PriceInput } from "apps/obsidian-plugin/components/Input/PriceInput";
import { AccountsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { WithLockField } from "../WithLockField";

interface MultiSelectDropdownProps {
	id: string;
	label: string;
	placeholder?: string;
	selectedAccounts: {
		accountId: string;
		amount: number;
		currency: string;
	}[];
	onChange: (
		accounts: {
			accountId: string;
			amount: number;
			currency: string;
		}[]
	) => void;
	totalAmount?: number;
	error?: string;
	isLocked?: boolean;
	setIsLocked?: (value: boolean) => void;
}

export const MultiSelectDropdown = ({
	id,
	label,
	placeholder = "Select accounts...",
	selectedAccounts,
	onChange,
	totalAmount = 0,
	error,
	isLocked,
	setIsLocked,
}: MultiSelectDropdownProps) => {
	const { accounts } = useContext(AccountsContext);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);

	// Memoize for performance
	const accountList = useMemo(
		() =>
			accounts
				.map((account) => ({
					id: account.id.value,
					name: account.name.value,
					balance:
						typeof account.balance === "number"
							? account.balance
							: account.balance?.value ?? 0,
					currency: account.currency,
				}))
				.sort((a, b) => a.name.localeCompare(b.name)),
		[accounts]
	);

	const selectedIds: Set<string> = useMemo(
		() => new Set(selectedAccounts.map((split) => split.accountId)),
		[selectedAccounts]
	);

	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		if (!isLocked) {
			setAnchorEl(event.currentTarget);
		}
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const handleAccountToggle = (
		accountId: string,
		currency: string,
		checked: boolean
	) => {
		let newSplits: {
			accountId: string;
			amount: number;
			currency: string;
		}[];
		if (checked) {
			// Add account with default amount
			newSplits = [
				...selectedAccounts,
				{ accountId, amount: 0, currency },
			];
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

	const handleMax = useCallback(
		(accountId: string) => {
			const newSplits = selectedAccounts.map((split) =>
				split.accountId === accountId
					? { ...split, amount: totalAmount }
					: split
			);
			onChange(newSplits);
		},
		[selectedAccounts, totalAmount, onChange]
	);

	useEffect(() => {
		if (selectedAccounts.length === 1) {
			const singleAccount = selectedAccounts[0];
			// Only set to max if the amount is not already set to totalAmount
			if (singleAccount.amount !== totalAmount) {
				handleMax(singleAccount.accountId);
			}
		}
	}, [selectedAccounts, handleMax, totalAmount]);

	const totalDistributed = selectedAccounts.reduce(
		(sum, split) => sum + split.amount,
		0
	);
	const remainingAmount = totalAmount - totalDistributed;

	// Display text for the select input
	const getDisplayText = () => {
		if (selectedAccounts.length === 0) {
			return placeholder;
		}
		if (selectedAccounts.length === 1) {
			const account = accountList.find(
				(a) => a.id === selectedAccounts[0].accountId
			);
			return account?.name || "Selected account";
		}
		return `${selectedAccounts.length} accounts selected`;
	};

	return (
		<WithLockField
			isLocked={isLocked}
			setIsLocked={setIsLocked}
			style={{ width: "100%" }}
		>
			<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
				{/* Multiselect Dropdown */}
				<FormControl fullWidth error={!!error}>
					<InputLabel id={`${id}-label`}>{label}</InputLabel>
					<Select
						labelId={`${id}-label`}
						id={id}
						value=""
						onClick={handleClick}
						onClose={handleClose}
						open={open}
						displayEmpty
						disabled={isLocked}
						IconComponent={KeyboardArrowDownIcon}
						renderValue={() => (
							<Typography
								variant="body2"
								sx={{
									color:
										selectedAccounts.length === 0
											? "var(--text-muted)"
											: "var(--text-normal)",
								}}
							>
								{getDisplayText()}
							</Typography>
						)}
						sx={{
							"& .MuiSelect-select": {
								padding: "8px 12px",
							},
						}}
					>
						{/* Select All Option */}
						<MenuItem
							onClick={(e) => {
								e.stopPropagation();
								if (
									selectedAccounts.length ===
									accountList.length
								) {
									// Deselect all
									onChange([]);
								} else {
									// Select all
									const allSplits = accountList.map(
										(account) => ({
											accountId: account.id,
											amount: 0,
											currency: account.currency.value,
										})
									);
									onChange(allSplits);
								}
							}}
							sx={{
								borderBottom:
									"1px solid var(--background-modifier-border)",
								backgroundColor: "var(--background-secondary)",
							}}
						>
							<Checkbox
								checked={
									selectedAccounts.length ===
										accountList.length &&
									accountList.length > 0
								}
								indeterminate={
									selectedAccounts.length > 0 &&
									selectedAccounts.length < accountList.length
								}
								sx={{
									color: "var(--interactive-accent)",
									"&.Mui-checked": {
										color: "var(--interactive-accent)",
									},
								}}
							/>
							<Typography
								variant="body2"
								sx={{ fontWeight: 600 }}
							>
								{selectedAccounts.length ===
									accountList.length && accountList.length > 0
									? "Deselect All"
									: "Select All"}
							</Typography>
						</MenuItem>

						{/* Account Options */}
						{accountList.map((account) => (
							<MenuItem
								key={account.id}
								onClick={(e) => {
									e.stopPropagation();
									handleAccountToggle(
										account.id,
										account.currency.value,
										!selectedIds.has(account.id)
									);
								}}
								sx={{
									py: 1,
									px: 2,
									"&:hover": {
										backgroundColor:
											"var(--background-modifier-hover)",
									},
								}}
							>
								<Checkbox
									checked={selectedIds.has(account.id)}
									sx={{
										color: "var(--interactive-accent)",
										"&.Mui-checked": {
											color: "var(--interactive-accent)",
										},
									}}
								/>
								<Box
									sx={{
										display: "flex",
										flexDirection: "column",
										ml: 1,
									}}
								>
									<Typography
										variant="body2"
										sx={{ fontWeight: 500 }}
									>
										{account.name}
									</Typography>
									{typeof account.balance === "number" && (
										<Typography
											variant="caption"
											sx={{ color: "var(--text-faint)" }}
										>
											Balance: $
											{Number(account.balance).toFixed(2)}
										</Typography>
									)}
								</Box>
							</MenuItem>
						))}
					</Select>
					{error && (
						<FormHelperText
							sx={{ color: "var(--text-error)", marginLeft: 0 }}
						>
							{error}
						</FormHelperText>
					)}
				</FormControl>

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
										placeholder="Amount"
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
										prefix={account.currency.symbol}
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
			</Box>
		</WithLockField>
	);
};
