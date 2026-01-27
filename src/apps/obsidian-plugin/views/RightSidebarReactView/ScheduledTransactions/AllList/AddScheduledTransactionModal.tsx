import { StringValueObject } from "@juandardilag/value-objects";
import { motion } from "framer-motion";
import {
	ArrowDownLeft,
	ArrowUpRight,
	RefreshCw,
	Repeat,
	Wallet,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AccountsMap } from "../../../../../../contexts/Accounts/application/get-all-accounts.usecase";
import { CategoriesWithSubcategoriesMap } from "../../../../../../contexts/Categories/application/get-all-categories-with-subcategories.usecase";
import { CategoriesMap } from "../../../../../../contexts/Categories/application/get-all-categories.usecase";
import {
	RecurrencePattern,
	RecurrenceType,
	ScheduledTransaction,
} from "../../../../../../contexts/ScheduledTransactions/domain";
import {
	ItemOperation,
	Nanoid,
	OperationType,
} from "../../../../../../contexts/Shared/domain";
import {
	AccountSplit,
	TransactionAmount,
} from "../../../../../../contexts/Transactions/domain";

interface AddScheduledTransactionModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (transaction: ScheduledTransaction) => void;
	accountsMap: AccountsMap;
	categoriesMap: CategoriesMap;
	categoriesWithSubcategoriesMap: CategoriesWithSubcategoriesMap;
	editTransaction?: ScheduledTransaction | null;
}
export function AddScheduledTransactionModal({
	isOpen,
	onClose,
	onSave,
	accountsMap,
	categoriesMap,
	categoriesWithSubcategoriesMap,
	editTransaction = null,
}: Readonly<AddScheduledTransactionModalProps>) {
	const isEditMode = !!editTransaction;
	const [operation, setOperation] = useState<OperationType>("expense");
	const [name, setName] = useState("");
	const [category, setCategory] = useState("");
	const [subcategory, setSubcategory] = useState("");
	const [store, setStore] = useState("");
	const [amount, setAmount] = useState(0);
	// Recurrence fields
	const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(
		RecurrenceType.INFINITE,
	);
	const [startDate, setStartDate] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [frequencyNum, setFrequencyNum] = useState(1);
	const [frequencyUnit, setFrequencyUnit] = useState<"d" | "w" | "mo" | "y">(
		"mo",
	);
	const [endDate, setEndDate] = useState("");
	const [maxOccurrences, setMaxOccurrences] = useState(12);
	// Split state
	const [fromSplits, setFromSplits] = useState<AccountSplit[]>([]);
	const [toSplits, setToSplits] = useState<AccountSplit[]>([]);
	// Load transaction data when editing
	useEffect(() => {
		if (editTransaction) {
			setOperation(editTransaction.operation.type.value);
			setName(editTransaction.name.value);
			setCategory(editTransaction.category.value);
			setSubcategory(editTransaction.subcategory.value);
			setStore(editTransaction.store?.value || "");
			setFromSplits(editTransaction.originAccounts);
			setToSplits(editTransaction.destinationAccounts);
			const pattern = editTransaction.recurrencePattern;
			setRecurrenceType(pattern.type);
			setStartDate(
				new Date(pattern.startDate).toISOString().split("T")[0],
			);
			if (pattern.frequency) {
				const match = pattern.frequency.match(/(\d+)(d|w|mo|y)/);
				if (match) {
					setFrequencyNum(Number.parseInt(match[1]));
					setFrequencyUnit(match[2] as "d" | "w" | "mo" | "y");
				}
			}
			if (pattern.endDate) {
				setEndDate(
					new Date(pattern.endDate).toISOString().split("T")[0],
				);
			}
			if (pattern.maxOccurrences) {
				setMaxOccurrences(pattern.maxOccurrences);
			}
			setAmount(editTransaction.originAmount.value);
		} else {
			// Reset form
			setOperation("expense");
			setName("");
			setCategory("");
			setSubcategory("");
			setStore("");
			setAmount(0);
			setRecurrenceType(RecurrenceType.INFINITE);
			setStartDate(new Date().toISOString().split("T")[0]);
			setFrequencyNum(1);
			setFrequencyUnit("mo");
			setEndDate("");
			setMaxOccurrences(12);
			setFromSplits([]);
			setToSplits([]);
		}
	}, [editTransaction, isOpen]);
	// Initialize splits when amount changes
	useEffect(() => {
		if (
			fromSplits.length === 0 &&
			accountsMap.size > 0 &&
			!isEditMode &&
			amount > 0
		) {
			setFromSplits([
				new AccountSplit(
					accountsMap.values().next().value.id,
					new TransactionAmount(amount),
				),
			]);
		}
		if (
			toSplits.length === 0 &&
			accountsMap.size > 0 &&
			!isEditMode &&
			operation === "transfer" &&
			amount > 0
		) {
			setToSplits([
				new AccountSplit(
					accountsMap.values().next().value.id,
					new TransactionAmount(amount),
				),
			]);
		}
	}, [
		accountsMap,
		amount,
		isEditMode,
		operation,
		fromSplits.length,
		toSplits.length,
	]);
	const handleSubmit = () => {
		if (!name || !category || amount <= 0) {
			alert("Please fill in all required fields");
			return;
		}
		const fromTotal = fromSplits.reduce(
			(sum, s) => sum + s.amount.value,
			0,
		);
		if (Math.abs(fromTotal - amount) > 0.01) {
			alert("Account splits must match transaction amount");
			return;
		}
		if (operation === "transfer") {
			const toTotal = toSplits.reduce(
				(sum, s) => sum + s.amount.value,
				0,
			);
			if (Math.abs(toTotal - amount) > 0.01) {
				alert(
					"Transfer destination splits must match transaction amount",
				);
				return;
			}
		}
		const frequency =
			recurrenceType === RecurrenceType.ONE_TIME
				? undefined
				: `${frequencyNum}${frequencyUnit}`;
		const transaction = ScheduledTransaction.create(
			new StringValueObject(name),
			RecurrencePattern.fromPrimitives({
				type: recurrenceType,
				startDate: new Date(startDate),
				frequency,
				endDate:
					recurrenceType === RecurrenceType.UNTIL_DATE && endDate
						? new Date(endDate)
						: undefined,
				maxOccurrences:
					recurrenceType === RecurrenceType.N_OCCURRENCES
						? maxOccurrences
						: undefined,
			}),
			fromSplits,
			toSplits,
			ItemOperation.fromPrimitives({ type: operation }),
			new Nanoid(category),
			new Nanoid(subcategory),
			store ? new StringValueObject(store) : undefined,
		);

		onSave(transaction);
		onClose();
	};
	if (!isOpen) return null;
	return (
		<div className="fixed! inset-0! z-50! flex! items-center! justify-center! p-4! bg-black/20! backdrop-blur-sm! overflow-y-auto!">
			<motion.div
				initial={{
					opacity: 0,
					scale: 0.95,
				}}
				animate={{
					opacity: 1,
					scale: 1,
				}}
				exit={{
					opacity: 0,
					scale: 0.95,
				}}
				className="bg-white! rounded-xl! shadow-xl! max-w-3xl! w-full! p-6! border! border-gray-100! my-8! overflow-hidden! flex! flex-col! max-h-[90vh]!"
			>
				<div className="flex! justify-between! items-center! mb-6! flex-shrink-0!">
					<h2 className="text-xl! font-bold! text-gray-900!">
						{isEditMode
							? "Edit Scheduled Transaction"
							: "Add Scheduled Transaction"}
					</h2>
					<button
						onClick={onClose}
						className="text-gray-400! hover:text-gray-600!"
					>
						<X size={24} />
					</button>
				</div>

				<div className="overflow-y-auto! flex-1! pr-2! -mr-2!">
					{/* Operation Selection */}
					<div className="grid! grid-cols-3! gap-4! mb-6! p-2!">
						<button
							onClick={() => setOperation("expense")}
							className={`p-4! rounded-lg! border! flex! flex-col! items-center! gap-2! transition-all! ${operation === "expense" ? "bg-rose-50! border-rose-200! text-rose-700! ring-2! ring-rose-500! ring-offset-2!" : "bg-white! border-gray-200! text-gray-600! hover:bg-gray-50!"}`}
						>
							<ArrowUpRight
								className={
									operation === "expense"
										? "text-rose-600!"
										: "text-gray-400!"
								}
							/>
							<span className="font-medium!">Expense</span>
						</button>
						<button
							onClick={() => setOperation("income")}
							className={`p-4! rounded-lg! border! flex! flex-col! items-center! gap-2! transition-all! ${operation === "income" ? "bg-emerald-50! border-emerald-200! text-emerald-700! ring-2! ring-emerald-500! ring-offset-2!" : "bg-white! border-gray-200! text-gray-600! hover:bg-gray-50!"}`}
						>
							<ArrowDownLeft
								className={
									operation === "income"
										? "text-emerald-600!"
										: "text-gray-400!"
								}
							/>
							<span className="font-medium!">Income</span>
						</button>
						<button
							onClick={() => setOperation("transfer")}
							className={`p-4! rounded-lg! border! flex! flex-col! items-center! gap-2! transition-all! ${operation === "transfer" ? "bg-blue-50! border-blue-200! text-blue-700! ring-2! ring-blue-500! ring-offset-2!" : "bg-white! border-gray-200! text-gray-600! hover:bg-gray-50!"}`}
						>
							<RefreshCw
								className={
									operation === "transfer"
										? "text-blue-600!"
										: "text-gray-400!"
								}
							/>
							<span className="font-medium!">Transfer</span>
						</button>
					</div>

					{/* Basic Info */}
					<div className="space-y-4! mb-6!">
						<div>
							<label className="block! text-sm! font-medium! text-gray-700! mb-1!">
								Transaction Name *
							</label>
							<input
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g. Rent Payment, Netflix Subscription"
								className="w-full! px-3! py-2! border! border-gray-300! rounded-lg! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500!"
							/>
						</div>

						<div className="grid! grid-cols-1! sm:grid-cols-2! gap-4!">
							<div>
								<label className="block! text-sm! font-medium! text-gray-700! mb-1!">
									Category *
								</label>
								<select
									value={category}
									onChange={(e) => {
										setCategory(e.target.value);
										setSubcategory("");
									}}
									className="w-full! px-3! py-2! border! border-gray-300! rounded-lg! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500!"
								>
									<option value="">Select Category</option>
									{Array.from(categoriesWithSubcategoriesMap)
										.toSorted((a, b) =>
											a[1].category.name.localeCompare(
												b[1].category.name.value,
											),
										)
										.map(([id, cat]) => (
											<option key={id} value={id}>
												{cat.category.name}
											</option>
										))}
								</select>
							</div>

							<div>
								<label className="block! text-sm! font-medium! text-gray-700! mb-1!">
									Subcategory
								</label>
								<select
									value={subcategory}
									onChange={(e) =>
										setSubcategory(e.target.value)
									}
									disabled={!category}
									className="w-full! px-3! py-2! border! border-gray-300! rounded-lg! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500! disabled:bg-gray-100!"
								>
									<option value="">Select Subcategory</option>
									{category &&
										Array.from(
											categoriesWithSubcategoriesMap.get(
												category,
											)?.subcategories || [],
										)
											?.toSorted((a, b) =>
												a[1].name.localeCompare(
													b[1].name.value,
												),
											)
											.map(([id, sub]) => (
												<option key={id} value={id}>
													{sub.name}
												</option>
											))}
								</select>
							</div>
						</div>

						<div className="grid! grid-cols-1! sm:grid-cols-2! gap-4!">
							<div>
								<label className="block! text-sm! font-medium! text-gray-700! mb-1!">
									Amount *
								</label>
								<div className="relative!">
									<span className="absolute! left-3! top-1/2! -translate-y-1/2! text-gray-500!">
										$
									</span>
									<input
										type="number"
										value={amount || ""}
										onChange={(e) =>
											setAmount(
												parseFloat(e.target.value) || 0,
											)
										}
										placeholder="0.00"
										className="w-full! pl-7! pr-3! py-2! border! border-gray-300! rounded-lg! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500!"
									/>
								</div>
							</div>

							<div>
								<label className="block! text-sm! font-medium! text-gray-700! mb-1!">
									Store / Payee (Optional)
								</label>
								<input
									type="text"
									value={store}
									onChange={(e) => setStore(e.target.value)}
									placeholder="e.g. Netflix, Landlord"
									className="w-full! px-3! py-2! border! border-gray-300! rounded-lg! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500!"
								/>
							</div>
						</div>
					</div>

					{/* Recurrence Pattern */}
					<div className="mb-6! p-4! bg-gray-50! rounded-lg! border! border-gray-200!">
						<div className="flex! items-center! gap-2! mb-4!">
							<Repeat size={18} className="text-gray-500!" />
							<h3 className="font-medium! text-gray-900!">
								Recurrence Pattern
							</h3>
						</div>

						<div className="space-y-4!">
							<div>
								<label className="block! text-sm! font-medium! text-gray-700! mb-1!">
									Start Date *
								</label>
								<input
									type="date"
									value={startDate}
									onChange={(e) =>
										setStartDate(e.target.value)
									}
									className="w-full! px-3! py-2! border! border-gray-300! rounded-lg! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500!"
								/>
							</div>

							<div>
								<label className="block! text-sm! font-medium! text-gray-700! mb-1!">
									Recurrence Type *
								</label>
								<select
									value={recurrenceType}
									onChange={(e) =>
										setRecurrenceType(
											e.target.value as RecurrenceType,
										)
									}
									className="w-full! px-3! py-2! border! border-gray-300! rounded-lg! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500!"
								>
									<option value={RecurrenceType.ONE_TIME}>
										One-time
									</option>
									<option value={RecurrenceType.INFINITE}>
										Repeats Forever
									</option>
									<option value={RecurrenceType.UNTIL_DATE}>
										Until Date
									</option>
									<option
										value={RecurrenceType.N_OCCURRENCES}
									>
										Number of Occurrences
									</option>
								</select>
							</div>

							{recurrenceType !== RecurrenceType.ONE_TIME && (
								<div>
									<label className="block! text-sm! font-medium! text-gray-700! mb-1!">
										Frequency *
									</label>
									<div className="flex! gap-2!">
										<input
											type="number"
											min="1"
											value={frequencyNum}
											onChange={(e) =>
												setFrequencyNum(
													parseInt(e.target.value) ||
														1,
												)
											}
											className="w-20! px-3! py-2! border! border-gray-300! rounded-lg! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500!"
										/>
										<select
											value={frequencyUnit}
											onChange={(e) =>
												setFrequencyUnit(
													e.target.value as
														| "d"
														| "w"
														| "mo"
														| "y",
												)
											}
											className="flex-1! px-3! py-2! border! border-gray-300! rounded-lg! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500!"
										>
											<option value="d">Day(s)</option>
											<option value="w">Week(s)</option>
											<option value="mo">Month(s)</option>
											<option value="y">Year(s)</option>
										</select>
									</div>
								</div>
							)}

							{recurrenceType === RecurrenceType.UNTIL_DATE && (
								<div>
									<label className="block! text-sm! font-medium! text-gray-700! mb-1!">
										End Date *
									</label>
									<input
										type="date"
										value={endDate}
										onChange={(e) =>
											setEndDate(e.target.value)
										}
										min={startDate}
										className="w-full! px-3! py-2! border! border-gray-300! rounded-lg! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500!"
									/>
								</div>
							)}

							{recurrenceType ===
								RecurrenceType.N_OCCURRENCES && (
								<div>
									<label className="block! text-sm! font-medium! text-gray-700! mb-1!">
										Number of Occurrences *
									</label>
									<input
										type="number"
										min="1"
										value={maxOccurrences}
										onChange={(e) =>
											setMaxOccurrences(
												parseInt(e.target.value) || 1,
											)
										}
										className="w-full! px-3! py-2! border! border-gray-300! rounded-lg! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500!"
									/>
								</div>
							)}
						</div>
					</div>

					{/* Account Splits */}
					<div className="space-y-6! mb-6!">
						<AccountSplitter
							label={
								operation === "income"
									? "Deposit To"
									: "Paid From"
							}
							splits={fromSplits}
							onChange={setFromSplits}
							accountsMap={accountsMap}
							totalAmount={amount}
						/>

						{operation === "transfer" && (
							<AccountSplitter
								label="Transfer To"
								splits={toSplits}
								onChange={setToSplits}
								accountsMap={accountsMap}
								totalAmount={amount}
							/>
						)}
					</div>
				</div>

				{/* Footer */}
				<div className="flex! gap-3! pt-4! border-t! border-gray-100! mt-auto!">
					<button
						onClick={onClose}
						className="flex-1! px-4! py-2.5! border! border-gray-300! rounded-lg! text-gray-700! font-medium! hover:bg-gray-50! transition-colors!"
					>
						Cancel
					</button>
					<button
						onClick={handleSubmit}
						className="flex-1! px-4! py-2.5! bg-indigo-600! text-white! rounded-lg! font-medium! hover:bg-indigo-700! transition-colors! shadow-sm!"
					>
						{isEditMode ? "Update" : "Create"} Scheduled Transaction
					</button>
				</div>
			</motion.div>
		</div>
	);
}
function AccountSplitter({
	label,
	splits,
	onChange,
	accountsMap,
	totalAmount,
}: Readonly<{
	label: string;
	splits: AccountSplit[];
	onChange: (splits: AccountSplit[]) => void;
	accountsMap: AccountsMap;
	totalAmount: number;
}>) {
	const currentTotal = splits.reduce((sum, s) => sum + s.amount.value, 0);
	const remaining = totalAmount - currentTotal;
	const isBalanced = Math.abs(remaining) < 0.01;
	const updateSplit = (
		index: number,
		field: keyof AccountSplit,
		value: string | number,
	) => {
		const newSplits = [...splits];
		newSplits[index] = new AccountSplit(
			field === "accountId"
				? new Nanoid(value as string)
				: newSplits[index].accountId,
			field === "amount"
				? new TransactionAmount(value as number)
				: newSplits[index].amount,
		);
		onChange(newSplits);
	};
	return (
		<div className="bg-gray-50! rounded-lg! p-4! border! border-gray-200!">
			<div className="flex! justify-between! items-center! mb-3!">
				<div className="flex! items-center! gap-2!">
					<Wallet size={16} className="text-gray-500!" />
					<span className="font-medium! text-gray-700!">{label}</span>
				</div>
				<div
					className={`text-sm! font-medium! ${isBalanced ? "text-green-600!" : "text-amber-600!"}`}
				>
					{isBalanced ? (
						<span className="flex! items-center! gap-1!">
							Match{" "}
							<div className="w-2! h-2! rounded-full! bg-green-500!" />
						</span>
					) : (
						<span>
							{remaining > 0 ? "Remaining: " : "Over: "}
							{new Intl.NumberFormat("en-US", {
								style: "currency",
								currency: "USD",
							}).format(Math.abs(remaining))}
						</span>
					)}
				</div>
			</div>

			<div className="space-y-2!">
				{splits.map((split, index) => (
					<div
						key={split.accountId.value}
						className="flex! gap-2! items-center!"
					>
						<select
							value={split.accountId.value}
							onChange={(e) =>
								updateSplit(index, "accountId", e.target.value)
							}
							className="flex-1! px-3! py-2! text-sm! border! border-gray-300! rounded-lg! focus:ring-1! focus:ring-indigo-500! bg-white!"
						>
							{Array.from(accountsMap)
								.toSorted(([_, accA], [__, accB]) =>
									accA.name.localeCompare(accB.name.value),
								)
								.map(([id, acc]) => (
									<option key={id} value={id}>
										{acc.name} ({acc.currency})
									</option>
								))}
						</select>
						<div className="relative! w-32!">
							<span className="absolute! left-3! top-1/2! -translate-y-1/2! text-gray-500! text-sm!">
								$
							</span>
							<input
								type="number"
								value={split.amount.value}
								onChange={(e) =>
									updateSplit(
										index,
										"amount",
										Number.parseFloat(e.target.value),
									)
								}
								className="w-full! pl-6! pr-3! py-2! text-sm! border! border-gray-300! rounded-lg! focus:ring-1! focus:ring-indigo-500!"
							/>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
