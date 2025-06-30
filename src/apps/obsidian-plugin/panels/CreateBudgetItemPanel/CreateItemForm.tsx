import { PriceValueObject } from "@juandardilag/value-objects";
import { Box, Chip, TextField, Typography } from "@mui/material";
import { PriceInput } from "apps/obsidian-plugin/components/Input/PriceInput";
import { useDateInput } from "apps/obsidian-plugin/components/Input/useDateInput";
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
import {
	ItemID,
	ItemPrice,
	ScheduledItem,
	ScheduledItemPrimitives,
} from "contexts/Items/domain";
import { OperationType } from "contexts/Shared/domain";
import { TransactionDate } from "contexts/Transactions/domain";
import {
	PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

export const CreateItemForm = ({
	items,
	onSubmit,
	close,
	children,
	isValid: isRecurrenceValid,
	showErrors,
	onAttemptSubmit,
}: PropsWithChildren<{
	items: ScheduledItem[];
	onSubmit: (item: ScheduledItem, date?: TransactionDate) => Promise<void>;
	close: () => void;
	isValid?: boolean;
	showErrors: boolean;
	onAttemptSubmit: () => void;
}>) => {
	const { logger } = useLogger("CreateItemForm");

	const { getAccountByID } = useContext(AccountsContext);
	const { brands, stores } = useContext(TransactionsContext);
	const { accounts } = useContext(AccountsContext);

	const [locks, setLocks] = useState<{
		[K in keyof Omit<Required<ScheduledItemPrimitives>, "id">]: boolean;
	}>({
		name: false,
		brand: false,
		category: false,
		subCategory: false,
		store: false,
		operation: false,
		recurrence: false,
		updatedAt: false,
		fromSplits: false,
		toSplits: false,
		tags: false,
	});
	const [item, setItem] = useState<ScheduledItemPrimitives>({
		...ScheduledItem.emptyPrimitives(),
		fromSplits: [{ accountId: "", amount: 0 }],
		toSplits: [],
	});
	const [selectedItem, setSelectedItem] = useState<ScheduledItemPrimitives>();

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

	const { DateInput, date } = useDateInput({
		id: "date",
	});
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
		initialValueID: item.category,
		lock: locks.category,
		setLock: (lock) => updateLock("category", lock),
	});
	const { SubCategorySelect, subCategory } = useSubCategorySelect({
		category,
		initialValueID: item.subCategory,
		lock: locks.subCategory,
		setLock: (lock) => updateLock("subCategory", lock),
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

	const getLockedOrSelectedValue = <T,>(
		key: keyof Omit<ScheduledItemPrimitives, "id">
	): T | undefined => {
		if (locks[key]) return item[key] as T;
		return (selectedItem?.[key] as T) ?? undefined;
	};

	useEffect(() => {
		// Calculate total from fromSplits
		const totalAmount = (item.fromSplits || []).reduce(
			(sum, split) => sum + (split.amount || 0),
			0
		);
		const newErrors = {
			name: !item.name.trim() ? "Name is required" : undefined,
			fromSplits:
				totalAmount <= 0 ? "Amount must be greater than 0" : undefined,
			toSplits: undefined,
			account: !(item.fromSplits && item.fromSplits[0]?.accountId)
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
			logger.debug("selected item on creation", { selectedItem, locks });
			const toUpdate: Partial<ScheduledItemPrimitives> = {
				operation: getLockedOrSelectedValue("operation"),
				name: getLockedOrSelectedValue("name"),
				fromSplits: getLockedOrSelectedValue("fromSplits"),
				toSplits: getLockedOrSelectedValue("toSplits"),
				category: getLockedOrSelectedValue("category"),
				subCategory: getLockedOrSelectedValue("subCategory"),
				brand: getLockedOrSelectedValue("brand"),
				store: getLockedOrSelectedValue("store"),
			};

			logger.debug("item to update on creation", {
				toUpdate,
			});
			update(toUpdate);
		}
	}, [selectedItem]);

	const updateLock = (key: keyof ScheduledItemPrimitives, value: boolean) => {
		setLocks({
			...locks,
			[key]: value,
		});
	};

	const update = (newValues: Partial<ScheduledItemPrimitives>) => {
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
		if (newValues.subCategory !== undefined)
			newItem.subCategory = newValues.subCategory;
		if (newValues.brand !== undefined) newItem.brand = newValues.brand;
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
				const tagsRecord: Record<string, string> = {};
				newTags.forEach((tag, idx) => {
					tagsRecord[idx.toString()] = tag;
				});
				update({ tags: tagsRecord });
			}
		}
	};

	const handleTagDelete = (tagToDelete: string) => {
		const newTags = tags.filter((tag) => tag !== tagToDelete);
		setTags(newTags);
		const tagsRecord: Record<string, string> = {};
		newTags.forEach((tag, idx) => {
			tagsRecord[idx.toString()] = tag;
		});
		update({ tags: tagsRecord });
	};

	const handleBlur = () => {
		const value = tagInput.trim();
		if (value && !tags.includes(value)) {
			const newTags = [...tags, value];
			setTags(newTags);
			setTagInput("");
			const tagsRecord: Record<string, string> = {};
			newTags.forEach((tag, idx) => {
				tagsRecord[idx.toString()] = tag;
			});
			update({ tags: tagsRecord });
		}
	};

	const handleSubmit = (withClose: boolean) => async () => {
		if (!item) return;
		const itemToPersist = ScheduledItem.fromPrimitives({
			...item,
			id: ItemID.generate().value,
			category: category?.id.value ?? "",
			subCategory: subCategory?.id.value ?? "",
			fromSplits: item.fromSplits,
			toSplits: item.toSplits,
			operation: item.operation,
		});
		await onSubmit(itemToPersist, new TransactionDate(date));
		if (withClose) return close();
		setSelectedItem(undefined);
		setItem({
			...ScheduledItem.emptyPrimitives(),
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

				<SelectWithCreation<ScheduledItemPrimitives>
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
							item.operation &&
							item.operation.type === "transfer" &&
							item.toSplits?.[0]?.accountId
								? ` -> ${
										getAccountByID(
											new AccountID(
												item.toSplits[0]?.accountId ||
													""
											)
										)?.name.value
								  } - `
								: ""
						}${
							item.fromSplits?.[0]?.amount === 0
								? ""
								: "  " +
								  new ItemPrice(
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
					isLocked={locks.name}
					setIsLocked={(value) => updateLock("name", value)}
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
					{DateInput}
					<PriceInput
						id="amount"
						label="Amount"
						value={
							new PriceValueObject(
								item.fromSplits?.reduce(
									(sum, split) => sum + split.amount,
									0
								) ?? 0,
								{
									withSign: false,
									decimals: 0,
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
						error={showErrors ? errors.fromSplits : undefined}
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
						isLocked={locks.operation}
						setIsLocked={(value) => updateLock("operation", value)}
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
						id="brand"
						label="Brand"
						item={item.brand ?? ""}
						items={brands.map((b) => b.value)}
						onChange={(brand) => update({ brand })}
						isLocked={locks.brand}
						setIsLocked={(lock) => updateLock("brand", lock)}
					/>
					<SelectWithCreation
						id="store"
						label="Store"
						item={item.store ?? ""}
						items={stores.map((s) => s.value)}
						onChange={(store) => update({ store })}
						isLocked={locks.store}
						setIsLocked={(lock) => updateLock("store", lock)}
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

			{/* Recurrence Section */}
			{children && (
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
						Recurrence Settings
					</Typography>
					{children}
				</Box>
			)}

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
