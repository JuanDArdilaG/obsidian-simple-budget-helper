import { motion } from "framer-motion";
import {
	ArrowDownLeft,
	ArrowUpRight,
	Plus,
	RefreshCw,
	Trash2,
	Wallet,
	X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Account } from "../../../../../contexts/Accounts/domain";
import { CategoriesWithSubcategories } from "../../../../../contexts/Categories/application/get-all-categories-with-subcategories.usecase";
import { OperationType } from "../../../../../contexts/Shared/domain";
import { SubCategory } from "../../../../../contexts/Subcategories/domain";
import {
	AccountSplit,
	AccountSplitPrimitives,
	Transaction,
	TransactionAmount,
	TransactionDate,
	TransactionName,
	TransactionOperation,
} from "../../../../../contexts/Transactions/domain";

export interface TransactionItem {
	id: string;
	name: string;
	price: number;
	quantity: number;
	category: string;
	subcategory: string;
}

interface AddTransactionModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (transactions: Transaction[]) => Promise<void>;
	accounts: Account[];
	categoriesWithSubcategories: CategoriesWithSubcategories;
	editTransaction?: Transaction | null;
}

export function AddTransactionModal({
	isOpen,
	onClose,
	onSave,
	accounts,
	categoriesWithSubcategories,
	editTransaction = null,
}: Readonly<AddTransactionModalProps>) {
	const isEditMode = !!editTransaction;

	const [type, setType] = useState<OperationType>("expense");
	const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
	const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
	const [store, setStore] = useState("");
	const [items, setItems] = useState<Omit<TransactionItem, "id">[]>([
		{
			name: "",
			price: 0,
			quantity: 1,
			category: "",
			subcategory: "",
		},
	]);

	// Split state
	const [originSplits, setOriginSplits] = useState<AccountSplit[]>([]);
	const [destinationSplits, setDestinationSplits] = useState<AccountSplit[]>(
		[],
	);

	// Load transaction data when editing
	useEffect(() => {
		if (editTransaction) {
			const transactionDate = new Date(editTransaction.date);
			setType(editTransaction.operation.value);
			setDate(editTransaction.date.toISOString().split("T")[0]);
			setTime(transactionDate.toTimeString().slice(0, 5));
			setStore(editTransaction.store?.value || "");
			setItems([
				{
					name: editTransaction.name.value,
					price: editTransaction.originAmount.value,
					quantity: 1,
					category: editTransaction.category.id.value,
					subcategory: editTransaction.subcategory?.id.value || "",
				},
			]);
			setOriginSplits(editTransaction.originAccounts);
			setDestinationSplits(editTransaction.destinationAccounts);
		} else {
			// Reset form for new transaction
			setType("expense");
			setDate(new Date().toISOString().split("T")[0]);
			setTime(new Date().toTimeString().slice(0, 5));
			setStore("");
			setItems([
				{
					name: "",
					price: 0,
					quantity: 1,
					category: "",
					subcategory: "",
				},
			]);
			setOriginSplits([]);
			setDestinationSplits([]);
		}
	}, [editTransaction, isOpen]);

	// Calculate total from items
	const totalAmount = useMemo(
		() => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
		[items],
	);

	// Reset splits when total changes or type changes, if they are empty or invalid
	useEffect(() => {
		if (originSplits.length === 0 && accounts.length > 0 && !isEditMode) {
			setOriginSplits([
				new AccountSplit(
					accounts[0],
					new TransactionAmount(totalAmount),
				),
			]);
		}
		if (
			destinationSplits.length === 0 &&
			accounts.length > 0 &&
			!isEditMode
		) {
			setDestinationSplits([
				new AccountSplit(
					accounts[0],
					new TransactionAmount(totalAmount),
				),
			]);
		}
	}, [accounts, totalAmount, isEditMode]);

	const handleAddItem = () => {
		setItems([
			...items,
			{
				name: "",
				price: 0,
				quantity: 1,
				category: "",
				subcategory: "",
			},
		]);
	};
	const handleRemoveItem = (index: number) => {
		setItems(items.filter((_, i) => i !== index));
	};
	const handleItemChange = (
		index: number,
		field: keyof Omit<TransactionItem, "id">,
		value: string | number,
	) => {
		const newItems = [...items];
		newItems[index] = {
			...newItems[index],
			[field]: value,
		};
		setItems(newItems);
	};

	const handleSubmit = () => {
		// Basic validation
		if (items.some((i) => !i.name || i.price <= 0)) return;
		// Validate splits
		const originTotal = originSplits.reduce(
			(sum, s) => sum + s.amount.value,
			0,
		);
		if (Math.abs(originTotal - totalAmount) > 0.01) {
			alert("Origin accounts total must match transaction total");
			return;
		}
		if (type === "transfer") {
			const destTotal = destinationSplits.reduce(
				(sum, s) => sum + s.amount.value,
				0,
			);
			if (Math.abs(destTotal - totalAmount) > 0.01) {
				alert(
					"Destination accounts total must match transaction total",
				);
				return;
			}
		}

		// Combine date and time into ISO string
		const dateTimeString = `${date}T${time}:00`;
		const transactionDate = new Date(dateTimeString).toISOString();

		const transactions: Transaction[] = items.map((item) => {
			let subcategory: SubCategory;
			const category = categoriesWithSubcategories.find(
				({ subcategories }) => {
					const sub = subcategories.find(
						(sub) => sub.id.value === item.subcategory,
					);
					if (sub) {
						subcategory = sub;
						return true;
					}
					return false;
				},
			);
			if (!category) {
				throw new Error(
					`Category not found for subcategory ID: ${item.subcategory}`,
				);
			}
			return Transaction.create(
				new TransactionDate(new Date(transactionDate)),
				originSplits,
				destinationSplits,
				new TransactionName(item.name),
				new TransactionOperation(type),
				category.category,
				subcategory!,
			);
		});

		onSave(transactions);
		onClose();
	};

	if (!isOpen) return null;

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
					<h2 className="text-xl! font-bold! text-gray-900!">
						{isEditMode ? "Edit Transaction" : "Add Transaction"}
					</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600"
					>
						<X size={24} />
					</button>
				</div>

				<div className="overflow-y-auto flex-1 pr-2 -mr-2">
					{/* Type Selection */}
					<div className="grid grid-cols-3 gap-4 mb-6">
						<button
							onClick={() => setType("expense")}
							className={`p-4! rounded-lg! border! flex! flex-col! items-center! gap-2! transition-all! ${type === "expense" ? "bg-rose-50! border-rose-200! text-rose-700! ring-2! ring-rose-500! ring-offset-2!" : "bg-white! border-gray-200! text-gray-600! hover:bg-gray-50!"}`}
						>
							<ArrowUpRight
								className={
									type === "expense"
										? "text-rose-600"
										: "text-gray-400"
								}
							/>
							<span className="font-medium">Expense</span>
						</button>
						<button
							onClick={() => setType("income")}
							className={`p-4! rounded-lg! border! flex! flex-col! items-center! gap-2! transition-all! ${type === "income" ? "bg-emerald-50! border-emerald-200! text-emerald-700! ring-2! ring-emerald-500! ring-offset-2!" : "bg-white! border-gray-200! text-gray-600! hover:bg-gray-50!"}`}
						>
							<ArrowDownLeft
								className={
									type === "income"
										? "text-emerald-600"
										: "text-gray-400"
								}
							/>
							<span className="font-medium">Income</span>
						</button>
						<button
							onClick={() => setType("transfer")}
							className={`p-4! rounded-lg! border! flex! flex-col! items-center! gap-2! transition-all! ${type === "transfer" ? "bg-blue-50! border-blue-200! text-blue-700! ring-2! ring-blue-500! ring-offset-2!" : "bg-white! border-gray-200! text-gray-600! hover:bg-gray-50!"}`}
						>
							<RefreshCw
								className={
									type === "transfer"
										? "text-blue-600"
										: "text-gray-400"
								}
							/>
							<span className="font-medium">Transfer</span>
						</button>
					</div>

					{/* Date & Store */}

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
						<div>
							<label
								htmlFor="date-input"
								className="block! text-sm! font-medium! text-gray-700! mb-1!"
							>
								Date
							</label>
							<input
								id="date-input"
								type="date"
								value={date}
								onChange={(e) => setDate(e.target.value)}
								className="w-full! px-3! py-2! border! border-gray-300! rounded-lg! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500!"
							/>
							<label htmlFor="time-input">Time</label>
							<input
								id="time-input"
								type="time"
								value={time}
								onChange={(e) => setTime(e.target.value)}
								className="w-full! px-3! py-2! border! border-gray-300! rounded-lg! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500!"
							/>
						</div>
						<div className="sm:col-span-2 lg:col-span-1">
							<label
								htmlFor="store-input"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Store / Payee (Optional)
							</label>
							<input
								id="store-input"
								type="text"
								value={store}
								onChange={(e) => setStore(e.target.value)}
								placeholder="e.g. Walmart, Starbucks"
								className="w-full! px-3! py-2! border! border-gray-300! rounded-lg! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500"
							/>
						</div>
					</div>

					{/* Items Section */}
					<div className="mb-8">
						<div className="flex justify-between items-center mb-3">
							<label
								htmlFor="add-item-button"
								className="block text-sm font-medium text-gray-700"
							>
								Items
							</label>
							<button
								id="add-item-button"
								onClick={handleAddItem}
								className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
							>
								<Plus size={16} /> Add Item
							</button>
						</div>
						<div className="space-y-3">
							{items.map((item, index) => (
								<div
									key={item.name}
									className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg border border-gray-200"
								>
									<div className="flex-1 space-y-2">
										<div className="flex gap-2">
											<input
												type="text"
												placeholder="Item name"
												value={item.name}
												onChange={(e) =>
													handleItemChange(
														index,
														"name",
														e.target.value,
													)
												}
												className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
											/>
											<input
												type="number"
												placeholder="Price"
												value={item.price || ""}
												onChange={(e) =>
													handleItemChange(
														index,
														"price",
														Number.parseFloat(
															e.target.value,
														),
													)
												}
												className="w-24 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
											/>
											<input
												type="number"
												placeholder="Qty"
												value={item.quantity}
												onChange={(e) =>
													handleItemChange(
														index,
														"quantity",
														Number.parseInt(
															e.target.value,
														),
													)
												}
												className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
											/>
										</div>
										<div className="flex gap-2">
											<select
												value={item.category}
												onChange={(e) =>
													handleItemChange(
														index,
														"category",
														e.target.value,
													)
												}
												className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
											>
												<option value="">
													Select Category
												</option>
												{categoriesWithSubcategories.map(
													({ category }) => (
														<option
															key={
																category.id
																	.value
															}
															value={
																category.id
																	.value
															}
														>
															{category.name}
														</option>
													),
												)}
											</select>
											<select
												value={item.subcategory}
												onChange={(e) =>
													handleItemChange(
														index,
														"subcategory",
														e.target.value,
													)
												}
												className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
												disabled={!item.category}
											>
												<option value="">
													Select Subcategory
												</option>
												{item.category &&
													categoriesWithSubcategories
														.find(
															({ category }) =>
																category.id
																	.value ===
																item.category,
														)
														?.subcategories.map(
															(sub) => (
																<option
																	key={
																		sub.id
																			.value
																	}
																	value={
																		sub.id
																			.value
																	}
																>
																	{sub.name}
																</option>
															),
														)}
											</select>
										</div>
									</div>
									{items.length > 1 && (
										<button
											onClick={() =>
												handleRemoveItem(index)
											}
											className="p-1 text-gray-400 hover:text-rose-500 transition-colors"
										>
											<Trash2 size={16} />
										</button>
									)}
								</div>
							))}
						</div>
					</div>

					{/* Account Splitting Section */}
					<div className="space-y-6 mb-6">
						<AccountSplitter
							label={
								type === "income" ? "Deposit To" : "Paid From"
							}
							splits={originSplits}
							onChange={setOriginSplits}
							accounts={accounts}
							totalAmount={totalAmount}
						/>

						{type === "transfer" && (
							<AccountSplitter
								label="Transfer To"
								splits={destinationSplits}
								onChange={setDestinationSplits}
								accounts={accounts}
								totalAmount={totalAmount}
							/>
						)}
					</div>
				</div>

				{/* Footer */}
				<div className="flex flex-col gap-4 pt-4 border-t border-gray-100 mt-auto">
					<div className="flex justify-between items-center px-2">
						<span className="text-sm text-gray-500">
							Total Transaction Value
						</span>
						<span className="text-2xl font-bold text-gray-900">
							{new Intl.NumberFormat("en-US", {
								style: "currency",
								currency: "USD",
							}).format(totalAmount)}
						</span>
					</div>
					<div className="flex gap-3">
						<button
							onClick={onClose}
							className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
						>
							Cancel
						</button>
						<button
							onClick={handleSubmit}
							className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
						>
							{isEditMode
								? "Update Transaction"
								: "Save Transaction"}
						</button>
					</div>
				</div>
			</motion.div>
		</div>
	);
}
function AccountSplitter({
	label,
	splits,
	onChange,
	accounts,
	totalAmount,
}: Readonly<{
	label: string;
	splits: AccountSplit[];
	onChange: (splits: AccountSplit[]) => void;
	accounts: Account[];
	totalAmount: number;
}>) {
	const currentTotal = splits.reduce((sum, s) => sum + s.amount.value, 0);
	const remaining = totalAmount - currentTotal;
	const isBalanced = Math.abs(remaining) < 0.01;

	const addSplit = () => {
		// Find first unused account if possible
		const usedIds = new Set(splits.map((s) => s.account.id.value));
		const nextAccount =
			accounts.find((a) => !usedIds.has(a.id.value)) || accounts[0];
		onChange([
			...splits,
			new AccountSplit(
				nextAccount,
				remaining > 0
					? new TransactionAmount(remaining)
					: TransactionAmount.zero(),
			),
		]);
	};

	const updateSplit = (
		index: number,
		field: keyof AccountSplitPrimitives,
		value: string | number,
	) => {
		const newSplits = [...splits];
		newSplits[index] = AccountSplit.fromPrimitives(
			newSplits[index].account,
			{
				...newSplits[index].toPrimitives(),
				[field]: value,
			},
		);
		onChange(newSplits);
	};

	const removeSplit = (index: number) => {
		onChange(splits.filter((_, i) => i !== index));
	};

	return (
		<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
			<div className="flex justify-between items-center mb-3">
				<div className="flex items-center gap-2">
					<Wallet size={16} className="text-gray-500" />
					<span className="font-medium text-gray-700">{label}</span>
				</div>
				<div
					className={`text-sm font-medium ${isBalanced ? "text-green-600" : "text-amber-600"}`}
				>
					{isBalanced ? (
						<span className="flex items-center gap-1">
							Match{" "}
							<div className="w-2 h-2 rounded-full bg-green-500" />
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

			<div className="space-y-2">
				{splits.map((split, index) => (
					<div
						key={split.account.id.value}
						className="flex gap-2 items-center"
					>
						<select
							value={split.account.id.value}
							onChange={(e) =>
								updateSplit(index, "account.id", e.target.value)
							}
							className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 bg-white"
						>
							{accounts.map((acc) => (
								<option key={acc.id.value} value={acc.id.value}>
									{acc.name} ({acc.currency.value})
								</option>
							))}
						</select>
						<div className="relative w-32">
							<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
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
								className="w-full pl-6 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
							/>
						</div>
						{splits.length > 1 && (
							<button
								onClick={() => removeSplit(index)}
								className="p-2 text-gray-400 hover:text-rose-500 transition-colors"
							>
								<Trash2 size={16} />
							</button>
						)}
					</div>
				))}
			</div>

			{!isBalanced && remaining > 0 && (
				<button
					onClick={addSplit}
					className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
				>
					<Plus size={16} /> Add Split Account
				</button>
			)}
		</div>
	);
}
