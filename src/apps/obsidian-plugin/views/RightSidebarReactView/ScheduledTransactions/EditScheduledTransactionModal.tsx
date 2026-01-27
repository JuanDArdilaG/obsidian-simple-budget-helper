import { motion } from "framer-motion";
import {
	AlertCircle,
	ArrowDownLeft,
	ArrowUpRight,
	Pencil,
	RefreshCw,
	Repeat,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AccountsMap } from "../../../../../contexts/Accounts/application/get-all-accounts.usecase";
import { CategoriesWithSubcategoriesMap } from "../../../../../contexts/Categories/application/get-all-categories-with-subcategories.usecase";
import {
	ItemRecurrenceInfo,
	RecurrenceType,
	ScheduledTransaction,
} from "../../../../../contexts/ScheduledTransactions/domain";
import { OperationType } from "../../../../../contexts/Shared/domain";
import { AccountSplit } from "../../../../../contexts/Transactions/domain";
import { AccountSplitter } from "../../../components/AccountSplitter";

type EditMode = "single" | "all";
interface EditScheduledTransactionModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSaveSingle: (
		recurrence: ItemRecurrenceInfo,
		updates: {
			date: Date;
			fromSplits: AccountSplit[];
			toSplits: AccountSplit[];
		},
	) => Promise<void>;
	onSaveAll: (transaction: ScheduledTransaction) => Promise<void>;
	recurrence: ItemRecurrenceInfo | null;
	scheduledTransaction: ScheduledTransaction | null;
	accountsMap: AccountsMap;
	categories: CategoriesWithSubcategoriesMap;
}
export function EditScheduledTransactionModal({
	isOpen,
	onClose,
	onSaveSingle,
	onSaveAll,
	recurrence,
	scheduledTransaction,
	accountsMap,
	categories,
}: Readonly<EditScheduledTransactionModalProps>) {
	const [editMode, setEditMode] = useState<EditMode>("single");
	// Single recurrence edit fields
	const [singleDate, setSingleDate] = useState("");
	const [singleAmount, setSingleAmount] = useState(0);
	const [singleFromSplits, setSingleFromSplits] = useState<AccountSplit[]>(
		[],
	);
	const [singleToSplits, setSingleToSplits] = useState<AccountSplit[]>([]);
	// Full scheduled transaction edit fields
	const [operation, setOperation] = useState<OperationType>("expense");
	const [name, setName] = useState("");
	const [category, setCategory] = useState("");
	const [subcategory, setSubcategory] = useState("");
	const [store, setStore] = useState("");
	const [amount, setAmount] = useState(0);
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
	const [fromSplits, setFromSplits] = useState<AccountSplit[]>([]);
	const [toSplits, setToSplits] = useState<AccountSplit[]>([]);
	useEffect(() => {
		if (
			isOpen &&
			recurrence &&
			scheduledTransaction &&
			accountsMap.size > 0
		) {
			// Initialize single recurrence edit fields
			setSingleDate(
				new Date(recurrence.date).toISOString().split("T")[0],
			);
			const originAmount = recurrence.originAmount.value;
			setSingleAmount(originAmount);
			const originAccounts = recurrence.originAccounts;
			setSingleFromSplits([...originAccounts]);
			const destinationAccounts = recurrence.destinationAccounts;
			setSingleToSplits([...destinationAccounts]);
			// Initialize full transaction edit fields
			setOperation(scheduledTransaction.operation.type.value);
			setName(scheduledTransaction.name.value);
			setCategory(scheduledTransaction.category.value);
			setSubcategory(scheduledTransaction.subcategory.value);
			setStore(scheduledTransaction.store?.value || "");
			setFromSplits(scheduledTransaction.originAccounts);
			setToSplits(scheduledTransaction.destinationAccounts);
			const pattern = scheduledTransaction.recurrencePattern;
			setRecurrenceType(pattern.type);
			setStartDate(
				new Date(pattern.startDate).toISOString().split("T")[0],
			);
			if (pattern.frequency) {
				const match = pattern.frequency.match(/(\d+)(d|w|mo|y)/);
				if (match) {
					setFrequencyNum(parseInt(match[1]));
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
			const totalAmount = scheduledTransaction.originAmount.value;
			setAmount(totalAmount);
		}
	}, [isOpen, recurrence, scheduledTransaction, accountsMap]);

	const handleSubmitSingle = () => {
		if (!recurrence || !singleDate || singleAmount <= 0) {
			alert("Please fill in all required fields");
			return;
		}
		const fromTotal = singleFromSplits.reduce(
			(sum, s) => sum + s.amount.value,
			0,
		);
		if (Math.abs(fromTotal - singleAmount) > 0.01) {
			alert("Account splits must match transaction amount");
			return;
		}
		if (recurrence.operation.type.value === "transfer") {
			const toTotal = singleToSplits.reduce(
				(sum, s) => sum + s.amount.value,
				0,
			);
			if (Math.abs(toTotal - singleAmount) > 0.01) {
				alert(
					"Transfer destination splits must match transaction amount",
				);
				return;
			}
		}
		onSaveSingle(recurrence, {
			date: new Date(singleDate),
			fromSplits: singleFromSplits,
			toSplits: singleToSplits,
		});
		onClose();
	};
	const handleSubmitAll = () => {
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
		const transaction = ScheduledTransaction.fromPrimitives({
			id: scheduledTransaction!.id,
			name,
			category,
			subcategory,
			operation: {
				type: operation,
			},
			fromSplits: fromSplits.map((s) => s.toPrimitives()),
			toSplits: toSplits.map((s) => s.toPrimitives()),
			recurrencePattern: {
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
			},
			store: store || undefined,
			updatedAt: new Date().toISOString(),
		});
		onSaveAll(transaction);
		onClose();
	};
	if (!isOpen || !recurrence || !scheduledTransaction) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm overflow-y-auto">
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
				className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 border border-gray-100 my-8 overflow-hidden flex flex-col max-h-[90vh]"
			>
				<div className="flex justify-between items-center mb-6 flex-shrink-0">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-indigo-50 rounded-lg">
							<Pencil className="w-6 h-6 text-indigo-600" />
						</div>
						<div>
							<h2 className="text-xl font-bold text-gray-900">
								Edit Scheduled Transaction
							</h2>
							<p className="text-sm text-gray-600">
								{recurrence.name} - Occurrence #
								{recurrence.occurrenceIndex}
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600"
					>
						<X size={24} />
					</button>
				</div>

				{/* Edit Mode Selection */}
				<div className="mb-6 flex-shrink-0">
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Edit Scope
					</label>
					<div className="grid grid-cols-2 gap-3">
						<button
							onClick={() => setEditMode("single")}
							className={`p-4 rounded-lg border transition-all ${editMode === "single" ? "bg-indigo-50 border-indigo-200 text-indigo-700 ring-2 ring-indigo-500 ring-offset-2" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
						>
							<div className="font-medium mb-1">
								This Occurrence Only
							</div>
							<div className="text-xs text-gray-500">
								Edit date and amount for occurrence #
								{recurrence.occurrenceIndex}
							</div>
						</button>
						<button
							onClick={() => setEditMode("all")}
							className={`p-4 rounded-lg border transition-all ${editMode === "all" ? "bg-indigo-50 border-indigo-200 text-indigo-700 ring-2 ring-indigo-500 ring-offset-2" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
						>
							<div className="font-medium mb-1">
								All Future Occurrences
							</div>
							<div className="text-xs text-gray-500">
								Edit the entire scheduled transaction
							</div>
						</button>
					</div>
				</div>

				<div className="overflow-y-auto flex-1 pr-2 -mr-2">
					{editMode === "single" ? (
						// Single Recurrence Edit Form
						<div className="space-y-6">
							<div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
								<AlertCircle
									size={20}
									className="text-amber-600 flex-shrink-0 mt-0.5"
								/>
								<div className="text-sm text-amber-800">
									<strong>Single occurrence edit:</strong>{" "}
									Changes will only apply to this specific
									occurrence. Other occurrences will remain
									unchanged.
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Date *
								</label>
								<input
									type="date"
									value={singleDate}
									onChange={(e) =>
										setSingleDate(e.target.value)
									}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Amount *
								</label>
								<div className="relative">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
										$
									</span>
									<input
										type="number"
										value={singleAmount || ""}
										onChange={(e) =>
											setSingleAmount(
												parseFloat(e.target.value) || 0,
											)
										}
										placeholder="0.00"
										step="0.01"
										className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
									/>
								</div>
							</div>

							<div className="space-y-4">
								{singleFromSplits.length > 0 && (
									<AccountSplitter
										label={
											recurrence.operation.type.value ===
											"income"
												? "Deposit To"
												: "Paid From"
										}
										splits={singleFromSplits}
										onChange={setSingleFromSplits}
										totalAmount={singleAmount}
									/>
								)}

								{recurrence.operation.type.value ===
									"transfer" &&
									singleToSplits.length > 0 && (
										<AccountSplitter
											label="Transfer To"
											splits={singleToSplits}
											onChange={setSingleToSplits}
											totalAmount={singleAmount}
										/>
									)}
							</div>
						</div>
					) : (
						// Full Scheduled Transaction Edit Form
						<div className="space-y-6">
							<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
								<AlertCircle
									size={20}
									className="text-blue-600 flex-shrink-0 mt-0.5"
								/>
								<div className="text-sm text-blue-800">
									<strong>All occurrences edit:</strong>{" "}
									Changes will apply to all future occurrences
									of this scheduled transaction.
								</div>
							</div>

							{/* Operation Selection */}
							<div className="grid grid-cols-3 gap-4">
								<button
									onClick={() => setOperation("expense")}
									className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${operation === "expense" ? "bg-rose-50 border-rose-200 text-rose-700 ring-2 ring-rose-500 ring-offset-2" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
								>
									<ArrowUpRight
										className={
											operation === "expense"
												? "text-rose-600"
												: "text-gray-400"
										}
									/>
									<span className="font-medium">Expense</span>
								</button>
								<button
									onClick={() => setOperation("income")}
									className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${operation === "income" ? "bg-emerald-50 border-emerald-200 text-emerald-700 ring-2 ring-emerald-500 ring-offset-2" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
								>
									<ArrowDownLeft
										className={
											operation === "income"
												? "text-emerald-600"
												: "text-gray-400"
										}
									/>
									<span className="font-medium">Income</span>
								</button>
								<button
									onClick={() => setOperation("transfer")}
									className={`p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${operation === "transfer" ? "bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500 ring-offset-2" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
								>
									<RefreshCw
										className={
											operation === "transfer"
												? "text-blue-600"
												: "text-gray-400"
										}
									/>
									<span className="font-medium">
										Transfer
									</span>
								</button>
							</div>

							{/* Basic Info */}
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Transaction Name *
									</label>
									<input
										type="text"
										value={name}
										onChange={(e) =>
											setName(e.target.value)
										}
										placeholder="e.g. Rent Payment, Netflix Subscription"
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
									/>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Category *
										</label>
										<select
											value={category}
											onChange={(e) => {
												setCategory(e.target.value);
												setSubcategory("");
											}}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
										>
											<option value="">
												Select Category
											</option>
											{Array.from(categories).map(
												([id, cat]) => (
													<option key={id} value={id}>
														{cat.category.name}
													</option>
												),
											)}
										</select>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Subcategory
										</label>
										<select
											value={subcategory}
											onChange={(e) =>
												setSubcategory(e.target.value)
											}
											disabled={!category}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
										>
											<option value="">
												Select Subcategory
											</option>
											{category &&
												Array.from(
													categories.get(category)
														?.subcategories ?? [],
												).map(([id, sub]) => (
													<option key={id} value={id}>
														{sub.name}
													</option>
												))}
										</select>
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Amount *
										</label>
										<div className="relative">
											<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
												$
											</span>
											<input
												type="number"
												value={amount || ""}
												onChange={(e) =>
													setAmount(
														parseFloat(
															e.target.value,
														) || 0,
													)
												}
												placeholder="0.00"
												step="0.01"
												className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
											/>
										</div>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Store / Payee (Optional)
										</label>
										<input
											type="text"
											value={store}
											onChange={(e) =>
												setStore(e.target.value)
											}
											placeholder="e.g. Netflix, Landlord"
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
										/>
									</div>
								</div>
							</div>

							{/* Recurrence Pattern */}
							<div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
								<div className="flex items-center gap-2 mb-4">
									<Repeat
										size={18}
										className="text-gray-500"
									/>
									<h3 className="font-medium text-gray-900">
										Recurrence Pattern
									</h3>
								</div>

								<div className="space-y-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Start Date *
										</label>
										<input
											type="date"
											value={startDate}
											onChange={(e) =>
												setStartDate(e.target.value)
											}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Recurrence Type *
										</label>
										<select
											value={recurrenceType}
											onChange={(e) =>
												setRecurrenceType(
													e.target
														.value as RecurrenceType,
												)
											}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
										>
											<option
												value={RecurrenceType.ONE_TIME}
											>
												One-time
											</option>
											<option
												value={RecurrenceType.INFINITE}
											>
												Repeats Forever
											</option>
											<option
												value={
													RecurrenceType.UNTIL_DATE
												}
											>
												Until Date
											</option>
											<option
												value={
													RecurrenceType.N_OCCURRENCES
												}
											>
												Number of Occurrences
											</option>
										</select>
									</div>

									{recurrenceType !==
										RecurrenceType.ONE_TIME && (
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Frequency *
											</label>
											<div className="flex gap-2">
												<input
													type="number"
													min="1"
													value={frequencyNum}
													onChange={(e) =>
														setFrequencyNum(
															parseInt(
																e.target.value,
															) || 1,
														)
													}
													className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
													className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
												>
													<option value="d">
														Day(s)
													</option>
													<option value="w">
														Week(s)
													</option>
													<option value="mo">
														Month(s)
													</option>
													<option value="y">
														Year(s)
													</option>
												</select>
											</div>
										</div>
									)}

									{recurrenceType ===
										RecurrenceType.UNTIL_DATE && (
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												End Date *
											</label>
											<input
												type="date"
												value={endDate}
												onChange={(e) =>
													setEndDate(e.target.value)
												}
												min={startDate}
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
											/>
										</div>
									)}

									{recurrenceType ===
										RecurrenceType.N_OCCURRENCES && (
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Number of Occurrences *
											</label>
											<input
												type="number"
												min="1"
												value={maxOccurrences}
												onChange={(e) =>
													setMaxOccurrences(
														parseInt(
															e.target.value,
														) || 1,
													)
												}
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
											/>
										</div>
									)}
								</div>
							</div>

							{/* Account Splits */}
							<div className="space-y-4">
								<AccountSplitter
									label={
										operation === "income"
											? "Deposit To"
											: "Paid From"
									}
									splits={fromSplits}
									onChange={setFromSplits}
									totalAmount={amount}
								/>

								{operation === "transfer" && (
									<AccountSplitter
										label="Transfer To"
										splits={toSplits}
										onChange={setToSplits}
										totalAmount={amount}
									/>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex gap-3 pt-4 border-t border-gray-100 mt-auto flex-shrink-0">
					<button
						onClick={onClose}
						className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={
							editMode === "single"
								? handleSubmitSingle
								: handleSubmitAll
						}
						className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
					>
						{editMode === "single"
							? "Save This Occurrence"
							: "Save All Future Occurrences"}
					</button>
				</div>
			</motion.div>
		</div>
	);
}
