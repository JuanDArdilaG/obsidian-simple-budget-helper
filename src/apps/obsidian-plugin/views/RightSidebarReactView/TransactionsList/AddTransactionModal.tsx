import { motion } from "framer-motion";
import {
	ArrowDownLeft,
	ArrowUpRight,
	Plus,
	RefreshCw,
	Trash2,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AccountsMap } from "../../../../../contexts/Accounts/application/get-all-accounts.usecase";
import { CategoriesWithSubcategoriesMap } from "../../../../../contexts/Categories/application/get-all-categories-with-subcategories.usecase";
import { CategoriesMap } from "../../../../../contexts/Categories/application/get-all-categories.usecase";
import { Nanoid, OperationType } from "../../../../../contexts/Shared/domain";
import {
	AccountSplit,
	Transaction,
	TransactionAmount,
	TransactionDate,
	TransactionName,
	TransactionOperation,
} from "../../../../../contexts/Transactions/domain";
import { AccountSplitter } from "../../../components/AccountSplitter";

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
	accountsMap: AccountsMap;
	categoriesMap: CategoriesMap;
	categoriesWithSubcategories: CategoriesWithSubcategoriesMap;
	editTransaction?: Transaction | null;
}

export function AddTransactionModal({
	isOpen,
	onClose,
	onSave,
	accountsMap,
	categoriesMap,
	categoriesWithSubcategories,
	editTransaction = null,
}: Readonly<AddTransactionModalProps>) {
	const isEditMode = !!editTransaction;
	const [operation, setOperation] = useState<OperationType>("expense");
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
	const [fromSplits, setFromSplits] = useState<AccountSplit[]>([]);
	const [toSplits, setToSplits] = useState<AccountSplit[]>([]);

	// Load transaction data when editing
	useEffect(() => {
		if (editTransaction) {
			const transactionDate = new Date(editTransaction.date);
			setOperation(editTransaction.operation.value);
			setDate(transactionDate.toISOString().split("T")[0]);
			setTime(transactionDate.toTimeString().slice(0, 5));
			setStore(editTransaction.store?.value || "");

			// For edit mode, show as single item
			setItems([
				{
					name: editTransaction.name.value,
					price: editTransaction.originAccounts.reduce(
						(sum, s) => sum + s.amount.value,
						0,
					),
					quantity: 1,
					category: editTransaction.category.value,
					subcategory: editTransaction.subcategory.value,
				},
			]);
			setFromSplits(editTransaction.originAccounts);
			setToSplits(editTransaction.destinationAccounts || []);
		} else {
			// Reset form for new transaction
			setOperation("expense");
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
			setFromSplits([]);
			setToSplits([]);
		}
	}, [editTransaction, isOpen]);
	// Calculate total from items
	const totalAmount = items.reduce(
		(sum, item) => sum + item.price * item.quantity,
		0,
	);
	// Reset splits when total changes or operation changes, if they are empty or invalid
	useEffect(() => {
		if (accountsMap.size === 0) return;
		const firstAccountId = Array.from(accountsMap.keys())[0];
		if (fromSplits.length === 0 && !isEditMode) {
			setFromSplits([
				new AccountSplit(
					new Nanoid(firstAccountId),
					new TransactionAmount(totalAmount),
				),
			]);
		}
		if (
			toSplits.length === 0 &&
			accountsMap.size > 0 &&
			!isEditMode &&
			operation === "transfer"
		) {
			setToSplits([
				new AccountSplit(
					new Nanoid(firstAccountId),
					new TransactionAmount(totalAmount),
				),
			]);
		}
	}, [accountsMap, totalAmount, isEditMode, operation]);
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
		if (items.some((i) => !i.name || i.price <= 0)) {
			alert("Please fill in all item names and prices");
			return;
		}
		// Validate splits
		const fromTotal = fromSplits.reduce(
			(sum, s) => sum + s.amount.value,
			0,
		);
		if (Math.abs(fromTotal - totalAmount) > 0.01) {
			alert("Account splits must match transaction total");
			return;
		}
		if (operation === "transfer") {
			const toTotal = toSplits.reduce(
				(sum, s) => sum + s.amount.value,
				0,
			);
			if (Math.abs(toTotal - totalAmount) > 0.01) {
				alert(
					"Transfer destination splits must match transaction total",
				);
				return;
			}
		}
		// Combine date and time into Date object
		const dateTimeString = `${date}T${time}:00`;
		const transactionDate = new Date(dateTimeString);
		// Create individual transactions for each item
		const transactions: Transaction[] = items.map((item) => {
			const itemTotal = item.price * item.quantity;
			const itemRatio = itemTotal / totalAmount;
			return Transaction.create(
				new TransactionDate(transactionDate),
				fromSplits.map(
					(split) =>
						new AccountSplit(
							split.accountId,
							new TransactionAmount(
								split.amount.value * itemRatio,
							),
						),
				),
				toSplits.map(
					(split) =>
						new AccountSplit(
							split.accountId,
							new TransactionAmount(
								split.amount.value * itemRatio,
							),
						),
				),
				new TransactionName(item.name),
				new TransactionOperation(operation),
				new Nanoid(item.category),
				new Nanoid(item.subcategory),
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
					<h2 className="text-xl font-bold text-gray-900">
						{isEditMode ? "Edit Transaction" : "Add Transaction"}
					</h2>
					<button
						onClick={onClose}
						className="text-gray-400! hover:text-gray-600!"
					>
						<X size={24} />
					</button>
				</div>

				<div className="overflow-y-auto flex-1 pr-2 -mr-2">
					{/* Operation Selection */}
					<div className="grid grid-cols-3 gap-4 mb-6 p-2">
						<button
							onClick={() => setOperation("expense")}
							className={`p-4! rounded-lg! border! flex! flex-col! items-center! gap-2! transition-all! ${operation === "expense" ? "bg-rose-50! border-rose-200! text-rose-700! ring-2! ring-rose-500! ring-offset-2!" : "bg-white! border-gray-200! text-gray-600! hover:bg-gray-50!"}`}
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
							className={`p-4! rounded-lg! border! flex! flex-col! items-center! gap-2! transition-all! ${operation === "income" ? "bg-emerald-50! border-emerald-200! text-emerald-700! ring-2! ring-emerald-500! ring-offset-2!" : "bg-white! border-gray-200! text-gray-600! hover:bg-gray-50!"}`}
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
							className={`p-4! rounded-lg! border! flex! flex-col! items-center! gap-2! transition-all! ${operation === "transfer" ? "bg-blue-50! border-blue-200! text-blue-700! ring-2! ring-blue-500! ring-offset-2!" : "bg-white! border-gray-200! text-gray-600! hover:bg-gray-50!"}`}
						>
							<RefreshCw
								className={
									operation === "transfer"
										? "text-blue-600"
										: "text-gray-400"
								}
							/>
							<span className="font-medium">Transfer</span>
						</button>
					</div>

					{/* Date, Time & Store */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Date
							</label>
							<input
								type="date"
								value={date}
								onChange={(e) => setDate(e.target.value)}
								className="w-full! px-3! py-2! border! border-gray-300! rounded-lg! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500!"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Time
							</label>
							<input
								type="time"
								value={time}
								onChange={(e) => setTime(e.target.value)}
								className="w-full! px-3! py-2! border! border-gray-300! rounded-lg! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500!"
							/>
						</div>
						<div className="sm:col-span-2 lg:col-span-1">
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Store / Payee (Optional)
							</label>
							<input
								type="text"
								value={store}
								onChange={(e) => setStore(e.target.value)}
								placeholder="e.g. Walmart, Starbucks"
								className="w-full! px-3! py-2! border! border-gray-300! rounded-lg! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500!"
							/>
						</div>
					</div>

					{/* Items Section */}
					<div className="mb-8">
						<div className="flex justify-between items-center mb-3">
							<label className="block text-sm font-medium text-gray-700">
								Items{" "}
								{!isEditMode && (
									<span className="text-xs text-gray-500">
										(each item will be saved as a separate
										transaction)
									</span>
								)}
							</label>
							{!isEditMode && (
								<button
									onClick={handleAddItem}
									className="text-sm! text-indigo-600! hover:text-indigo-700! font-medium! flex! items-center! gap-1!"
								>
									<Plus size={16} /> Add Item
								</button>
							)}
						</div>
						<div className="space-y-3">
							{items.map((item, index) => (
								<div
									key={item.name}
									className="flex! gap-2! items-start! p-3! bg-gray-50! rounded-lg! border! border-gray-200!"
								>
									<div className="flex-1! space-y-2!">
										<div className="flex! flex-col! sm:flex-row! gap-2!">
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
												className="flex-1! px-2! py-1.5! text-sm! border! border-gray-300! rounded! focus:ring-1! focus:ring-indigo-500! min-w-0!"
											/>
											<div className="flex! gap-2!">
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
													className="flex-1! sm:w-24! px-2! py-1.5! text-sm! border! border-gray-300! rounded! focus:ring-1! focus:ring-indigo-500! min-w-0!"
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
													className="w-16! sm:w-16! px-2! py-1.5! text-sm! border! border-gray-300! rounded! focus:ring-1! focus:ring-indigo-500! min-w-0!"
												/>
											</div>
										</div>
										<div className="flex! flex-col! sm:flex-row! gap-2!">
											<select
												value={item.category}
												onChange={(e) =>
													handleItemChange(
														index,
														"category",
														e.target.value,
													)
												}
												className="flex-1! px-2! py-1.5! text-sm! border! border-gray-300! rounded! focus:ring-1! focus:ring-indigo-500! min-w-0!"
											>
												<option value="">
													Select Category
												</option>
												{Array.from(categoriesMap)
													.toSorted((a, b) =>
														a[1].name.localeCompare(
															b[1].name.value,
														),
													)
													.map(([id, cat]) => (
														<option
															key={id}
															value={id}
														>
															{cat.name}
														</option>
													))}
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
												className="flex-1! px-2! py-1.5! text-sm! border! border-gray-300! rounded! focus:ring-1! focus:ring-indigo-500! min-w-0!"
												disabled={!item.category}
											>
												<option value="">
													Select Subcategory
												</option>
												{item.category &&
													(
														Array.from(
															categoriesWithSubcategories.get(
																item.category,
															)?.subcategories ||
																[],
														) || []
													)
														.toSorted((a, b) =>
															a[1].name.localeCompare(
																b[1].name.value,
															),
														)
														.map(([id, sub]) => (
															<option
																key={id}
																value={id}
															>
																{sub.name}
															</option>
														))}
											</select>
										</div>
									</div>
									{items.length > 1 && !isEditMode && (
										<button
											onClick={() =>
												handleRemoveItem(index)
											}
											className="p-1! text-gray-400! hover:text-rose-500! transition-colors! flex-shrink-0!"
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
								operation === "income"
									? "Deposit To"
									: "Paid From"
							}
							splits={fromSplits}
							onChange={setFromSplits}
							accountsMap={accountsMap}
							totalAmount={totalAmount}
						/>

						{operation === "transfer" && (
							<AccountSplitter
								label="Transfer To"
								splits={toSplits}
								onChange={setToSplits}
								accountsMap={accountsMap}
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
							className="flex-1! px-4! py-2.5! border! border-gray-300! rounded-lg! text-gray-700! font-medium! hover:bg-gray-50! transition-colors!"
						>
							Cancel
						</button>
						<button
							onClick={handleSubmit}
							className="flex-1! px-4! py-2.5! bg-indigo-600! text-white! rounded-lg! font-medium! hover:bg-indigo-700! transition-colors! shadow-sm!"
						>
							{isEditMode
								? "Update Transaction"
								: `Save ${items.length} Transaction${items.length > 1 ? "s" : ""}`}
						</button>
					</div>
				</div>
			</motion.div>
		</div>
	);
}
