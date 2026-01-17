import { PriceValueObject } from "@juandardilag/value-objects";
import { Box, Chip, TextField, Typography } from "@mui/material";
import { PriceInput } from "apps/obsidian-plugin/components/Input/PriceInput";
import {
	Select,
	SelectWithCreation,
	useCategorySelect,
	useSubCategorySelect,
} from "apps/obsidian-plugin/components/Select";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import {
	AccountsContext,
	TransactionsContext,
} from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { AccountID } from "contexts/Accounts/domain";
import { Nanoid, OperationType } from "contexts/Shared/domain";
import { TransactionAmount } from "contexts/Transactions/domain";
import {
	PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	ScheduledTransaction,
	ScheduledTransactionPrimitives,
} from "../../../../contexts/ScheduledTransactions/domain";

export const CreateScheduleTransactionForm = ({
	items,
	onSubmit,
	close,
	children,
	isValid: isRecurrenceValid,
	showErrors,
	onAttemptSubmit,
}: PropsWithChildren<{
	items: ScheduledTransaction[];
	onSubmit: (item: ScheduledTransaction) => Promise<void>;
	close: () => void;
	isValid?: boolean;
	showErrors: boolean;
	onAttemptSubmit: () => void;
}>) => {
	const { logger } = useLogger("CreateItemForm");

	const { getAccountByID } = useContext(AccountsContext);
	const { stores } = useContext(TransactionsContext);
	const { accounts } = useContext(AccountsContext);

	const [item, setItem] = useState<ScheduledTransactionPrimitives>({
		...ScheduledTransaction.emptyPrimitives(),
		fromSplits: [{ accountId: "", amount: 0 }],
		toSplits: [],
	});
	const [selectedItem, setSelectedItem] =
		useState<ScheduledTransactionPrimitives>();

	const [errors, setErrors] = useState<{
		name: string | undefined;
		fromSplits: string | undefined;
		toSplits: string | undefined;
		account: string | undefined;
		toAccount: string | undefined;
	}>({
		name: undefined,
		fromSplits: undefined,
		toSplits: undefined,
		account: undefined,
		toAccount: undefined,
	});
	const [isFormValid, setIsFormValid] = useState(false);

	const accountNames = useMemo(
		() =>
			accounts
				.map((acc) => acc.name.value)
				.toSorted((a, b) => a.localeCompare(b)),
		[accounts]
	);
	const fromAccountName = useMemo(() => {
		const id =
			item.fromSplits && item.fromSplits.length > 0
				? item.fromSplits[0].accountId
				: undefined;
		if (!id) return "";
		return getAccountByID(new AccountID(id))?.name.value ?? "";
	}, [item.fromSplits, getAccountByID]);
	const { CategorySelect, category } = useCategorySelect({
		initialValueID: item.category.category.id,
	});
	const { SubCategorySelect, subCategory } = useSubCategorySelect({
		category,
		initialValueID: item.category.subCategory.id,
	});

	const [tagInput, setTagInput] = useState("");
	const [tags, setTags] = useState<string[]>([]);
	const tagInputRef = useRef<HTMLInputElement>(null);

	// Get the current "To Account" name for display
	const toAccountName = useMemo(() => {
		const id =
			Array.isArray(item.toSplits) && item.toSplits.length > 0
				? item.toSplits[0].accountId
				: undefined;
		if (!id) return "";
		return getAccountByID(new AccountID(id))?.name.value ?? "";
	}, [item.toSplits, getAccountByID]);

	useEffect(() => {
		// Calculate total from fromSplits
		const totalAmount = (item.fromSplits || []).reduce(
			(sum, split) => sum + (split.amount || 0),
			0
		);
		const newErrors = {
			name: item.name.trim() === "" ? "Name is required" : undefined,
			fromSplits:
				totalAmount <= 0 ? "Amount must be greater than 0" : undefined,
			toSplits: undefined,
			account:
				!item.fromSplits || !item.fromSplits[0]?.accountId
					? "Account is required"
					: undefined,
			toAccount:
				item.operation.type === "transfer" &&
				!(item.toSplits && item.toSplits[0]?.accountId)
					? "To account is required"
					: undefined,
		};
		setErrors(newErrors);
		setIsFormValid(!Object.values(newErrors).some((err) => err));
	}, [item]);

	useEffect(() => {
		if (selectedItem) {
			logger.debug("selected scheduled transaction on creation", {
				selectedItem,
			});
			const toUpdate: Partial<ScheduledTransactionPrimitives> = {
				operation: selectedItem.operation,
				name: selectedItem.name,
				fromSplits: selectedItem.fromSplits,
				toSplits: selectedItem.toSplits,
				category: selectedItem.category,
				store: selectedItem.store,
			};

			logger.debug("item to update on creation", {
				toUpdate,
			});

			update(toUpdate);
		}
	}, [selectedItem]);

	const update = (newValues: Partial<ScheduledTransactionPrimitives>) => {
		const newItem = { ...item };
		logger.debug("updating item to create", {
			prevValues: newItem,
			newValues,
		});
		if (newValues.name !== undefined) newItem.name = newValues.name;
		if (newValues.operation !== undefined)
			newItem.operation = newValues.operation;
		if (newValues.fromSplits !== undefined)
			newItem.fromSplits = newValues.fromSplits;
		if (newValues.toSplits !== undefined)
			newItem.toSplits = newValues.toSplits;
		if (newValues.category !== undefined)
			newItem.category = newValues.category;
		if (newValues.store !== undefined) newItem.store = newValues.store;
		if (newValues.tags !== undefined) newItem.tags = newValues.tags;

		logger.debug("item to create updated", {
			newItem,
		});

		setItem(newItem);
	};

	// Handle tag input and chips
	const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setTagInput(e.target.value);
	};

	const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			const value = tagInput.trim();
			if (value && !tags.includes(value)) {
				const newTags = [...tags, value];
				setTags(newTags);
				setTagInput("");
				update({ tags: newTags });
			}
		}
	};

	const handleTagDelete = (tagToDelete: string) => {
		const newTags = tags.filter((tag) => tag !== tagToDelete);
		setTags(newTags);
		update({ tags: newTags });
	};

	const handleBlur = () => {
		const value = tagInput.trim();
		if (value && !tags.includes(value)) {
			const newTags = [...tags, value];
			setTags(newTags);
			setTagInput("");
			update({ tags: newTags });
		}
	};

	const handleSubmit = (withClose: boolean) => async () => {
		if (!item) return;
		const itemToPersist = ScheduledTransaction.fromPrimitives({
			...item,
			id: Nanoid.generate().value,
			category: {
				category: category?.toPrimitives() ?? {
					id: "",
					name: "",
					updatedAt: "",
				},
				subCategory: subCategory?.toPrimitives() ?? {
					id: "",
					name: "",
					category: "",
					updatedAt: "",
				},
			},
			fromSplits: item.fromSplits,
			toSplits: item.toSplits,
			operation: item.operation,
		});
		await onSubmit(itemToPersist);
		if (withClose) return close();
		setSelectedItem(undefined);
		setItem({
			...ScheduledTransaction.emptyPrimitives(),
			fromSplits: [{ accountId: "", amount: 0 }],
			toSplits: [],
		});
		setTags([]);
		setTagInput("");
	};

	const handleAttemptSubmit = (withClose: boolean) => async () => {
		onAttemptSubmit();
		if (isFormValid && isRecurrenceValid) {
			await handleSubmit(withClose)();
		}
	};

	return (
		<Box
			sx={{
				padding: "24px",
				maxWidth: "600px",
				margin: "0 auto",
				backgroundColor: "var(--background-primary)",
				borderRadius: "8px",
				boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
			}}
		>
			<Typography
				variant="h4"
				component="h2"
				gutterBottom
				sx={{
					color: "var(--text-normal)",
					fontWeight: 600,
					marginBottom: "24px",
					textAlign: "center",
				}}
			>
				Create Scheduled Item
			</Typography>

			{/* Basic Information Section */}
			<Box sx={{ marginBottom: "32px" }}>
				<Typography
					variant="h6"
					sx={{
						color: "var(--text-normal)",
						fontWeight: 500,
						marginBottom: "16px",
						paddingBottom: "8px",
						borderBottom:
							"2px solid var(--background-modifier-border)",
					}}
				>
					Basic Information
				</Typography>

				<SelectWithCreation<ScheduledTransactionPrimitives>
					id="name"
					label="Item Name"
					item={item}
					items={[
						...new Set(
							items
								.map((item) => item.toPrimitives())
								.filter((item) => item?.name)
								.sort((a, b) => a.name.localeCompare(b.name))
						),
					]}
					getLabel={(item) => {
						const labelStr = `${item.name} - ${
							getAccountByID(
								new AccountID(
									item.fromSplits?.[0]?.accountId || ""
								)
							)?.name.value
						}${
							item.operation?.type === "transfer" &&
							item.toSplits?.[0]?.accountId
								? ` -> ${
										getAccountByID(
											new AccountID(
												item.toSplits[0].accountId
											)
										)?.name.value
								  } - `
								: ""
						}${
							item.fromSplits?.[0]?.amount === 0
								? ""
								: "  " +
								  new TransactionAmount(
										item.fromSplits?.[0]?.amount ?? 0
								  ).toString()
						}`;
						return labelStr;
					}}
					getKey={(item) => {
						return item.id;
					}}
					setSelectedItem={setSelectedItem}
					onChange={(name) => update({ name })}
					error={showErrors ? errors.name : undefined}
				/>

				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: "1fr 1fr",
						gap: "16px",
						marginTop: "16px",
					}}
				>
					<PriceInput
						id="amount"
						placeholder="Amount"
						value={
							new PriceValueObject(
								item.fromSplits?.reduce(
									(sum, split) => sum + split.amount,
									0
								) ?? 0,
								{
									withSign: false,
									decimals: 2,
								}
							)
						}
						onChange={(amount) =>
							update({
								fromSplits: [
									{
										accountId:
											item.fromSplits?.[0]?.accountId ??
											"",
										amount: amount.toNumber(),
									},
								],
							})
						}
						prefix={
							item.fromSplits?.[0].accountId
								? getAccountByID(
										new AccountID(
											item.fromSplits[0].accountId
										)
								  )?.currency.symbol
								: "$"
						}
					/>
				</Box>
			</Box>

			{/* Transaction Details Section */}
			<Box sx={{ marginBottom: "32px" }}>
				<Typography
					variant="h6"
					sx={{
						color: "var(--text-normal)",
						fontWeight: 500,
						marginBottom: "16px",
						paddingBottom: "8px",
						borderBottom:
							"2px solid var(--background-modifier-border)",
					}}
				>
					Transaction Details
				</Typography>

				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: "1fr 1fr",
						gap: "16px",
						marginBottom: "16px",
					}}
				>
					<Select
						id="type"
						label="Type"
						value={item.operation.type}
						values={["expense", "income", "transfer"]}
						onChange={(type) =>
							update({
								operation: {
									...item.operation,
									type: type.toLowerCase() as OperationType,
								},
								toSplits:
									type.toLowerCase() === "transfer"
										? [{ accountId: "", amount: 0 }]
										: [],
							})
						}
					/>
					<Select
						id="account"
						label="From"
						value={fromAccountName}
						values={["", ...accountNames]}
						onChange={(accountName) => {
							const selectedAccount = accounts.find(
								(acc) => acc.name.value === accountName
							);
							update({
								fromSplits: selectedAccount
									? [
											{
												accountId:
													selectedAccount.id.value,
												amount:
													item.fromSplits?.[0]
														?.amount ?? 0,
											},
									  ]
									: [
											{
												accountId: "",
												amount:
													item.fromSplits?.[0]
														?.amount ?? 0,
											},
									  ],
							});
						}}
						error={showErrors ? errors.account : undefined}
					/>
				</Box>

				{/* Show To Account select only for transfer type */}
				{item.operation.type === "transfer" && (
					<Box
						sx={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: "16px",
							marginBottom: "16px",
						}}
					>
						<div></div> {/* Empty div for spacing */}
						<Select
							id="toAccount"
							label="To"
							value={toAccountName}
							values={["", ...accountNames]}
							onChange={(accountName) => {
								const selectedAccount = accounts.find(
									(acc) => acc.name.value === accountName
								);
								update({
									toSplits: selectedAccount
										? [
												{
													accountId:
														selectedAccount.id
															.value,
													amount: 0,
												},
										  ]
										: [],
								});
							}}
							error={showErrors ? errors.toAccount : undefined}
						/>
					</Box>
				)}

				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: "1fr 1fr",
						gap: "16px",
					}}
				>
					{CategorySelect}
					{SubCategorySelect}
				</Box>
			</Box>

			{/* Additional Information Section */}
			<Box sx={{ marginBottom: "32px" }}>
				<Typography
					variant="h6"
					sx={{
						color: "var(--text-normal)",
						fontWeight: 500,
						marginBottom: "16px",
						paddingBottom: "8px",
						borderBottom:
							"2px solid var(--background-modifier-border)",
					}}
				>
					Additional Information
				</Typography>

				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: "1fr 1fr",
						gap: "16px",
						marginBottom: "16px",
					}}
				>
					<SelectWithCreation
						id="store"
						label="Store"
						item={item.store ?? ""}
						items={stores.map((s) => s.value)}
						onChange={(store) => update({ store })}
					/>
				</Box>

				{/* Chips-based tags input */}
				<Box sx={{ mt: 2 }}>
					<TextField
						label="Tags"
						placeholder="Add a tag and press Enter or comma"
						value={tagInput}
						inputRef={tagInputRef}
						onChange={handleTagInputChange}
						onKeyDown={handleTagKeyDown}
						onBlur={handleBlur}
						fullWidth
						margin="normal"
						variant="outlined"
						helperText="Tags help you organize and filter your scheduled items"
						slotProps={{
							formHelperText: {
								sx: {
									color: "var(--text-muted)",
									fontSize: "12px",
								},
							},
						}}
						sx={{
							"& .MuiOutlinedInput-root": {
								"& fieldset": {
									borderColor:
										"var(--background-modifier-border)",
								},
								"&:hover fieldset": {
									borderColor: "var(--interactive-accent)",
								},
								"&.Mui-focused fieldset": {
									borderColor: "var(--interactive-accent)",
								},
							},
							"& .MuiInputLabel-root": {
								color: "var(--text-muted)",
							},
							"& .MuiInputLabel-root.Mui-focused": {
								color: "var(--interactive-accent)",
							},
						}}
					/>
					<Box
						sx={{
							display: "flex",
							flexWrap: "wrap",
							gap: 1,
							mt: 1,
						}}
					>
						{tags.map((tag) => (
							<Chip
								key={tag}
								label={tag}
								onDelete={() => handleTagDelete(tag)}
								color="default"
								size="small"
								sx={{
									backgroundColor:
										"var(--background-secondary)",
									color: "var(--text-normal)",
									border: "1px solid var(--background-modifier-border)",
								}}
							/>
						))}
					</Box>
				</Box>
			</Box>

			{children}
			{/* Action Buttons */}
			<Box
				sx={{
					display: "flex",
					gap: "12px",
					justifyContent: "flex-end",
					paddingTop: "16px",
					borderTop: "1px solid var(--background-modifier-border)",
				}}
			>
				<button
					onClick={handleAttemptSubmit(false)}
					style={{
						padding: "10px 20px",
						border: "1px solid var(--background-modifier-border)",
						backgroundColor: "var(--background-secondary)",
						color: "var(--text-normal)",
						borderRadius: "6px",
						cursor: "pointer",
						fontSize: "14px",
						fontWeight: 500,
						transition: "all 0.2s ease",
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.backgroundColor =
							"var(--background-modifier-hover)";
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.backgroundColor =
							"var(--background-secondary)";
					}}
				>
					Create
				</button>
				<button
					onClick={handleAttemptSubmit(true)}
					style={{
						padding: "10px 20px",
						border: "none",
						backgroundColor: "var(--interactive-accent)",
						color: "var(--text-on-accent)",
						borderRadius: "6px",
						cursor: "pointer",
						fontSize: "14px",
						fontWeight: 500,
						transition: "all 0.2s ease",
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.backgroundColor =
							"var(--interactive-accent-hover)";
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.backgroundColor =
							"var(--interactive-accent)";
					}}
				>
					Create & Close
				</button>
			</Box>
		</Box>
	);
};
