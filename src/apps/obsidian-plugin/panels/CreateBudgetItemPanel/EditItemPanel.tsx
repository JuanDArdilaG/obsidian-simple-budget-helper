import {
	DateValueObject,
	NumberValueObject,
	PriceValueObject,
} from "@juandardilag/value-objects";
import { Alert, Box, Chip, TextField, Typography } from "@mui/material";
import { DateInput } from "apps/obsidian-plugin/components/Input/DateInput";
import { Input } from "apps/obsidian-plugin/components/Input/Input";
import { PriceInput } from "apps/obsidian-plugin/components/Input/PriceInput";
import {
	Select,
	SelectWithCreation,
	useAccountSelect,
	useCategorySelect,
	useSubCategorySelect,
} from "apps/obsidian-plugin/components/Select";
import { ItemsContext, TransactionsContext } from "apps/obsidian-plugin/views";
import {
	ItemName,
	ItemRecurrence,
	ItemRecurrenceFrequency,
	ItemTags,
	ScheduledItem,
} from "contexts/Items/domain";
import { OperationType } from "contexts/Shared/domain";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { useContext, useRef, useState } from "react";
import { useCreateRecurrenceForm } from "./useCreateRecurrenceForm";

export const EditItemPanel = ({
	item,
	onClose,
	context = "all-items",
}: {
	item: ScheduledItem;
	onClose: () => void;
	context?: "calendar" | "all-items";
}) => {
	const {
		useCases: { updateItem },
		updateItems,
	} = useContext(ItemsContext);
	const { brands, stores } = useContext(TransactionsContext);

	const { AccountSelect, account } = useAccountSelect({
		label: "From",
		initialValueID: item.fromSplits[0]?.accountId.value,
	});
	const { AccountSelect: ToAccountSelect, account: toAccount } =
		useAccountSelect({
			label: "To",
			initialValueID: item.toSplits[0]?.accountId.value,
		});
	const { CategorySelect, category } = useCategorySelect({
		initialValueID: item.category.value,
	});
	const { SubCategorySelect, subCategory } = useSubCategorySelect({
		category,
		initialValueID: item.subCategory.value,
	});

	const {
		RecurrenceForm,
		untilDate,
		frequencyString,
		recurrenceType,
		recurrences,
	} = useCreateRecurrenceForm({ recurrence: item.recurrence });

	const [name, setName] = useState(item.name.value);
	const [amount, setAmount] = useState(item.fromAmount.value);
	const [type, setType] = useState(item.operation.type.value);

	const [brand, setBrand] = useState(item.info?.brand?.value);
	const [store, setStore] = useState(item.info?.store?.value);

	const [date, setDate] = useState(item.recurrence.startDate.value);

	const [tagInput, setTagInput] = useState("");
	const [tags, setTags] = useState(item.tags?.toArray() ?? []);
	const tagInputRef = useRef<HTMLInputElement>(null);

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
			}
		}
	};

	const handleTagDelete = (tagToDelete: string) => {
		const newTags = tags.filter((tag) => tag !== tagToDelete);
		setTags(newTags);
	};

	const handleBlur = () => {
		const value = tagInput.trim();
		if (value && !tags.includes(value)) {
			const newTags = [...tags, value];
			setTags(newTags);
			setTagInput("");
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
				Edit Scheduled Item
			</Typography>

			{/* Context Warning */}
			<Alert
				severity="warning"
				sx={{
					marginBottom: "24px",
					backgroundColor: "var(--background-warning)",
					border: "1px solid var(--color-orange)",
					color: "var(--text-normal)",
					"& .MuiAlert-icon": {
						color: "var(--color-orange)",
					},
				}}
			>
				<strong>⚠️ Full Item Edit</strong>
				<br />
				You are editing the entire scheduled item, which will affect all
				future recurrences. To modify only a specific recurrence
				instance, use the calendar view instead.
			</Alert>

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

				<Input
					id="name"
					label="Item Name"
					value={name}
					onChange={(name: string) => setName(name)}
				/>

				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: "1fr 1fr",
						gap: "16px",
						marginTop: "16px",
					}}
				>
					<DateInput value={date} onChange={setDate} label="Date" />
					<PriceInput
						id="amount"
						label="Amount"
						value={new PriceValueObject(amount)}
						onChange={(val) => setAmount(val.toNumber())}
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
						value={type}
						values={["expense", "income", "transfer"]}
						onChange={(type) =>
							setType(type.toLowerCase() as OperationType)
						}
					/>
					{AccountSelect}
				</Box>

				{type === "transfer" && (
					<Box sx={{ marginBottom: "16px" }}>{ToAccountSelect}</Box>
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
						item={brand ?? ""}
						items={brands.map((b) => b.value)}
						onChange={setBrand}
					/>
					<SelectWithCreation
						id="store"
						label="Store"
						item={store ?? ""}
						items={stores.map((s) => s.value)}
						onChange={setStore}
					/>
				</Box>

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
				<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
					{tags.map((tag) => (
						<Chip
							key={tag}
							label={tag}
							onDelete={() => handleTagDelete(tag)}
							color="default"
							size="small"
							sx={{
								backgroundColor: "var(--background-secondary)",
								color: "var(--text-normal)",
								border: "1px solid var(--background-modifier-border)",
							}}
						/>
					))}
				</Box>
			</Box>

			{/* Recurrence Section */}
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
				{RecurrenceForm}
			</Box>

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
					onClick={onClose}
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
					Cancel
				</button>
				<button
					onClick={async () => {
						if (account) {
							item.setFromSplits([
								new PaymentSplit(
									account.id,
									new TransactionAmount(amount)
								),
							]);
						}
						if (toAccount) {
							item.setToSplits([
								new PaymentSplit(
									toAccount.id,
									new TransactionAmount(amount)
								),
							]);
						}
						item.updateName(new ItemName(name));
						item.recurrence.updateStartDate(
							new DateValueObject(date)
						);
						category && item.updateCategory(category.id);
						subCategory && item.updateSubCategory(subCategory.id);
						item.updateRecurrence(
							recurrenceType === "oneTime"
								? ItemRecurrence.oneTime(
										new DateValueObject(date)
								  )
								: recurrenceType === "infinite"
								? ItemRecurrence.infinite(
										new DateValueObject(date),
										new ItemRecurrenceFrequency(
											frequencyString
										)
								  )
								: untilDate
								? ItemRecurrence.untilDate(
										new DateValueObject(date),
										new ItemRecurrenceFrequency(
											frequencyString
										),
										new DateValueObject(untilDate)
								  )
								: ItemRecurrence.untilNRecurrences(
										new DateValueObject(date),
										new ItemRecurrenceFrequency(
											frequencyString
										),
										new NumberValueObject(recurrences)
								  )
						);

						item.setTags(ItemTags.fromPrimitives(tags));

						await updateItem.execute(item);

						updateItems();

						onClose();
					}}
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
					Save Changes
				</button>
			</Box>
		</Box>
	);
};
