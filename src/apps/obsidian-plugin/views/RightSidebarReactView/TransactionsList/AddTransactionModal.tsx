import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowDownLeft,
	ArrowRightLeft,
	ArrowUpRight,
	Check,
	Clock,
	Plus,
	RefreshCw,
	Trash2,
	X,
} from "lucide-react";
import {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { AccountsMap } from "../../../../../contexts/Accounts/application/get-all-accounts.usecase";
import {
	Category,
	CategoryName,
} from "../../../../../contexts/Categories/domain";
import { Nanoid, OperationType } from "../../../../../contexts/Shared/domain";
import { Subcategory } from "../../../../../contexts/Subcategories/domain";
import {
	AccountSplit,
	Transaction,
	TransactionAmount,
} from "../../../../../contexts/Transactions/domain";
import { AccountSplitter } from "../../../components/AccountSplitter";
import { AppContext, CategoriesContext } from "../Contexts";

export interface TransactionItem {
	id: number;
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
	editTransaction?: Transaction | null;
	existingTransactions?: Transaction[];
}

export function AddTransactionModal({
	isOpen,
	onClose,
	onSave,
	accountsMap,
	editTransaction = null,
	existingTransactions = [],
}: Readonly<AddTransactionModalProps>) {
	const { plugin } = useContext(AppContext);
	const isEditMode = !!editTransaction;
	const {
		categoriesWithSubcategories,
		updateCategoriesWithSubcategories,
		getCategoryByID,
		getSubCategoryByID,
		useCases: { createCategory, createSubCategory },
	} = useContext(CategoriesContext);
	const [operation, setOperation] = useState<OperationType>("expense");
	const [date, setDate] = useState(
		`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`,
	);
	const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
	const [store, setStore] = useState("");
	const [items, setItems] = useState<TransactionItem[]>([
		{
			id: 0,
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
	// Category/subcategory state
	const [creatingCategory, setCreatingCategory] = useState<number | null>(
		null,
	);
	const [creatingSubcategory, setCreatingSubcategory] = useState<
		number | null
	>(null);
	const [newCategoryName, setNewCategoryName] = useState("");
	const [newSubcategoryName, setNewSubcategoryName] = useState(""); // Exchange rate state
	const [exchangeRate, setExchangeRate] = useState<TransactionAmount>(
		new TransactionAmount(1),
	);

	// Autocomplete state
	const [showSuggestions, setShowSuggestions] = useState<number | null>(null);
	const [filteredSuggestions, setFilteredSuggestions] = useState<
		Transaction[]
	>([]);
	const suggestionsRef = useRef<HTMLDivElement>(null); // Keyboard navigation state for suggestions

	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	// Reset highlighted index when suggestions change
	useEffect(() => {
		setHighlightedIndex(-1);
	}, [filteredSuggestions]);

	// Close suggestions when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				suggestionsRef.current &&
				!suggestionsRef.current.contains(event.target as Node)
			) {
				setShowSuggestions(null);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleCreateCategory = async (itemIndex: number) => {
		if (!newCategoryName.trim()) return;
		const categoryName = newCategoryName.trim();
		await createCategory.execute(
			Category.create(new CategoryName(categoryName)),
		);
		updateCategoriesWithSubcategories();
		const newItems = [...items];
		newItems[itemIndex] = {
			...newItems[itemIndex],
			category: categoryName,
			subcategory: "",
		};
		setItems(newItems);
		// Reset creation state
		setNewCategoryName("");
		setCreatingCategory(null);
	};

	const handleCreateSubcategory = async (itemIndex: number) => {
		if (!newSubcategoryName.trim()) return;
		const item = items[itemIndex];
		if (!item.category) return;
		const subcategoryName = newSubcategoryName.trim();
		await createSubCategory.execute(
			Subcategory.create(
				new Nanoid(item.category),
				new CategoryName(subcategoryName),
			),
		);
		// Update the item with the new subcategory
		updateCategoriesWithSubcategories();
		const newItems = [...items];
		newItems[itemIndex] = {
			...newItems[itemIndex],
			subcategory: subcategoryName,
		};
		setItems(newItems);
		// Reset creation state
		setNewSubcategoryName("");
		setCreatingSubcategory(null);
	};

	const handleCategoryChange = (index: number, value: string) => {
		if (value === "__new__") {
			setCreatingCategory(index);
			setNewCategoryName("");
		} else {
			// Update both category and subcategory in a single state update
			const newItems = [...items];
			newItems[index] = {
				...newItems[index],
				category: value,
				subcategory: "", // Reset subcategory when category changes
			};
			setItems(newItems);
		}
	};

	const handleSubcategoryChange = (index: number, value: string) => {
		if (value === "__new__") {
			setCreatingSubcategory(index);
			setNewSubcategoryName("");
		} else {
			handleItemChange(index, "subcategory", value);
		}
	};

	// Load transaction data when editing
	useEffect(() => {
		if (editTransaction) {
			const transactionDate = new Date(editTransaction.date);
			setOperation(editTransaction.operation.value);
			console.log({
				transactionDate,
				iso: transactionDate.toISOString(),
			});
			// Use local date methods to avoid UTC timezone shift
			const year = transactionDate.getFullYear();
			const month = String(transactionDate.getMonth() + 1).padStart(
				2,
				"0",
			);
			const day = String(transactionDate.getDate()).padStart(2, "0");
			setDate(`${year}-${month}-${day}`);
			setTime(transactionDate.toTimeString().slice(0, 5));
			setStore(editTransaction.store?.value || "");

			// For edit mode, show as single item
			setItems([
				{
					id: 0,
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
			setOperation("expense"); // Use local date methods to avoid UTC timezone shift
			const year = new Date().getFullYear();
			const month = String(new Date().getMonth() + 1).padStart(2, "0");
			const day = String(new Date().getDate()).padStart(2, "0");
			setDate(`${year}-${month}-${day}`);
			setTime(new Date().toTimeString().slice(0, 5));
			setStore("");
			setItems([
				{
					id: 0,
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
	const totalAmount = useMemo(
		() => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
		[items],
	);

	const handleItemNameChange = (id: number, value: string) => {
		handleItemChange(id, "name", value);
		// Filter suggestions based on input
		if (value.trim().length > 0) {
			const filtered = existingTransactions
				.filter((t) =>
					t.name.toLowerCase().includes(value.toLowerCase()),
				)
				.slice(0, 5); // Limit to 5 suggestions
			setFilteredSuggestions(filtered);
			setShowSuggestions(id);
		} else {
			setShowSuggestions(null);
			setFilteredSuggestions([]);
		}
	};

	const handleSuggestionKeyDown = (
		e: React.KeyboardEvent<HTMLInputElement>,
		itemIndex: number,
	) => {
		if (showSuggestions !== itemIndex || filteredSuggestions.length === 0)
			return;
		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setHighlightedIndex((prev) =>
					prev < filteredSuggestions.length - 1 ? prev + 1 : 0,
				);
				break;
			case "ArrowUp":
				e.preventDefault();
				setHighlightedIndex((prev) =>
					prev > 0 ? prev - 1 : filteredSuggestions.length - 1,
				);
				break;
			case "Enter":
				e.preventDefault();
				if (
					highlightedIndex >= 0 &&
					highlightedIndex < filteredSuggestions.length
				) {
					handleSelectSuggestion(
						itemIndex,
						filteredSuggestions[highlightedIndex],
					);
				}
				break;
			case "Escape":
				e.preventDefault();
				setShowSuggestions(null);
				setFilteredSuggestions([]);
				setHighlightedIndex(-1);
				break;
		}
	};

	const handleSelectSuggestion = (id: number, transaction: Transaction) => {
		// Calculate amount from transaction
		const amount = transaction.originAmount.value;

		// Update item with transaction data
		const newItems = [...items];
		newItems[id] = {
			...newItems[id],
			name: transaction.name.value,
			price: items[id].price || amount,
			category: transaction.category.value,
			subcategory: transaction.subcategory.value,
		};
		setItems(newItems);
		// Update operation type
		setOperation(transaction.operation.value);
		// Update store
		if (!store && transaction.store) {
			setStore(transaction.store.value);
		}
		// Update splits
		setFromSplits(transaction.originAccounts);
		if (transaction.destinationAccounts) {
			setToSplits(transaction.destinationAccounts);
		}
		// Close suggestions
		setShowSuggestions(null);
		setFilteredSuggestions([]);
	};

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
				id: items.length,
				name: "",
				price: 0,
				quantity: 1,
				category: "",
				subcategory: "",
			},
		]);
	};

	const handleRemoveItem = (id: number) => {
		setItems(items.filter((item) => item.id !== id));
	};

	const handleItemChange = (
		id: number,
		field: keyof Omit<TransactionItem, "id">,
		value: string | number,
	) => {
		const newItems = [...items];
		const index = newItems.findIndex((item) => item.id === id);
		if (index !== -1) {
			newItems[index] = {
				...newItems[index],
				[field]: value,
			};
			setItems(newItems);
		}
	};

	// Determine currencies for transfer cross-currency detection
	const getAccountCurrency = useCallback(
		(accountId: string): string => {
			const account = accountsMap.get(accountId);
			return account?.currency.value || plugin.settings.defaultCurrency;
		},
		[accountsMap, plugin.settings.defaultCurrency],
	);

	const fromCurrency = useMemo<string | null>(
		() =>
			fromSplits.length > 0
				? getAccountCurrency(fromSplits[0].accountId.value)
				: null,
		[fromSplits, getAccountCurrency],
	);
	const toCurrency = useMemo<string | null>(
		() =>
			toSplits.length > 0
				? getAccountCurrency(toSplits[0].accountId.value)
				: null,
		[toSplits, getAccountCurrency],
	);
	const isCrossCurrencyTransfer = useMemo(
		() =>
			operation === "transfer" &&
			fromCurrency &&
			toCurrency &&
			fromCurrency !== toCurrency,
		[operation, fromCurrency, toCurrency],
	);

	// Auto-update to-splits amount when exchange rate or from amount changes
	useEffect(() => {
		if (
			isCrossCurrencyTransfer &&
			exchangeRate.value > 0 &&
			fromSplits.length > 0 &&
			toSplits.length > 0
		) {
			const fromTotal = fromSplits.reduce(
				(sum, s) => sum + s.amount.value,
				0,
			);
			const convertedAmount = fromTotal * exchangeRate.value;
			const newToSplits = toSplits.map((split, index) => {
				if (index === 0) {
					return new AccountSplit(
						split.accountId,
						new TransactionAmount(
							Math.round(convertedAmount * 100) / 100,
						),
					);
				}
				return split;
			});
			// Only update if the amount actually changed to avoid infinite loops
			const currentToTotal = toSplits[0].amount.value;
			if (Math.abs(currentToTotal - convertedAmount) > 0.01) {
				setToSplits(newToSplits);
			}
		}
	}, [exchangeRate, fromSplits, isCrossCurrencyTransfer]);

	const handleSubmit = async () => {
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
		if (operation === "transfer" && !isCrossCurrencyTransfer) {
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
		const transactions: Transaction[] = items.flatMap((item) => {
			const itemTotal = item.price;
			const itemRatio = itemTotal / totalAmount;
			return Array.from({ length: item.quantity }, () => {
				return Transaction.fromPrimitives({
					id: editTransaction?.id ?? Nanoid.generate().value,
					date: transactionDate,
					fromSplits: fromSplits.map((split) =>
						new AccountSplit(
							split.accountId,
							new TransactionAmount(
								split.amount.value * itemRatio,
							),
						).toPrimitives(),
					),
					toSplits: toSplits.map((split) =>
						new AccountSplit(
							split.accountId,
							new TransactionAmount(
								Number.parseFloat(
									(
										(split.amount.value * itemRatio) /
										exchangeRate.value
									).toFixed(2),
								),
							),
						).toPrimitives(),
					),
					name: item.name,
					operation: operation,
					category: item.category,
					subcategory: item.subcategory,
					store: store || undefined,
					exchangeRate: isCrossCurrencyTransfer
						? exchangeRate.value
						: undefined,
					updatedAt: new Date().toISOString(),
				});
			});
		});
		await onSave(transactions);
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
						{isEditMode ? "Edit Transaction" : "Add Transaction"}
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
										: "text-gray-400!11"
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
										? "text-emerald-600"
										: "text-gray-400"
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

					{/* Date, Time & Store */}
					<div className="grid! grid-cols-1! sm:grid-cols-2! lg:grid-cols-3! gap-4! mb-6!">
						<div>
							<label className="block! text-sm! font-medium! text-gray-700! mb-1!">
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
							<label className="block! text-sm! font-medium! text-gray-700! mb-1!">
								Time
							</label>
							<input
								type="time"
								value={time}
								onChange={(e) => setTime(e.target.value)}
								className="w-full! px-3! py-2! border! border-gray-300! rounded-lg! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500!"
							/>
						</div>
						<div className="sm:col-span-2! lg:col-span-1!">
							<label className="block! text-sm! font-medium! text-gray-700! mb-1!">
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
						<div className="flex! justify-between items-center mb-3">
							<label className="block! text-sm! font-medium! text-gray-700!">
								Items{" "}
								{!isEditMode && (
									<span className="text-xs! text-gray-500!">
										(each item will be saved as a separate
										transaction)
									</span>
								)}
							</label>
						</div>
						<div className="space-y-3!">
							{items.map((item, index) => (
								<div
									key={item.id}
									className="flex! gap-2! items-start! p-3! bg-gray-50! rounded-lg! border! border-gray-200!"
								>
									<div className="flex-1! space-y-2!">
										<div className="flex! flex-col! sm:flex-row! gap-2!">
											{/* Item name with autocomplete */}
											<div className="flex-1! relative!">
												<input
													type="text"
													placeholder="Item name"
													value={item.name}
													onChange={(e) =>
														handleItemNameChange(
															item.id,
															e.target.value,
														)
													}
													onKeyDown={(e) =>
														handleSuggestionKeyDown(
															e,
															index,
														)
													}
													onFocus={() => {
														if (
															item.name.trim()
																.length > 0
														) {
															const filtered =
																existingTransactions
																	.filter(
																		(t) =>
																			t.name
																				.toLowerCase()
																				.includes(
																					item.name.toLowerCase(),
																				),
																	)
																	.slice(
																		0,
																		5,
																	);
															setFilteredSuggestions(
																filtered,
															);
															setShowSuggestions(
																item.id,
															);
														}
													}}
													className="w-full! px-2! py-1.5! text-sm! border! border-gray-300! rounded! focus:ring-1! focus:ring-indigo-500! min-w-0!"
												/>

												{/* Autocomplete suggestions */}
												<AnimatePresence>
													{showSuggestions ===
														item.id &&
														filteredSuggestions.length >
															0 && (
															<motion.div
																ref={
																	suggestionsRef
																}
																initial={{
																	opacity: 0,
																	y: -10,
																}}
																animate={{
																	opacity: 1,
																	y: 0,
																}}
																exit={{
																	opacity: 0,
																	y: -10,
																}}
																className="absolute! top-full! left-0! right-0! mt-1! bg-white! border! border-gray-200! rounded-lg! shadow-lg! z-50! max-h-60! overflow-y-auto"
															>
																{filteredSuggestions.map(
																	(
																		suggestion,
																		idx,
																	) => {
																		const suggestionAmount =
																			suggestion.originAmount;
																		const isHighlighted =
																			idx ===
																			highlightedIndex;
																		return (
																			<button
																				key={
																					suggestion.id
																				}
																				ref={(
																					el,
																				) => {
																					if (
																						isHighlighted &&
																						el
																					) {
																						el.scrollIntoView(
																							{
																								block: "nearest",
																							},
																						);
																					}
																				}}
																				onClick={() =>
																					handleSelectSuggestion(
																						item.id,
																						suggestion,
																					)
																				}
																				onMouseEnter={() =>
																					setHighlightedIndex(
																						idx,
																					)
																				}
																				className={`w-full px-3 py-2 text-left transition-colors border-b border-gray-100 last:border-b-0 flex items-center justify-between gap-2 ${isHighlighted ? "bg-indigo-50" : "hover:bg-indigo-50"}`}
																			>
																				<div className="flex-1! min-w-0">
																					<div className="font-medium! text-sm! text-gray-900! truncate!">
																						{
																							suggestion.name
																						}
																					</div>
																					<div className="text-xs! text-gray-500! truncate!">
																						{
																							getCategoryByID(
																								suggestion.category,
																							)
																								?.name
																						}
																						{` • ${
																							getSubCategoryByID(
																								suggestion.subcategory,
																							)
																								?.name
																						}`}
																					</div>
																				</div>
																				<div className="flex! items-center! gap-2! flex-shrink-0!">
																					<span className="text-sm! font-semibold! text-gray-700!">
																						{suggestionAmount.toString()}
																					</span>
																					<Clock
																						size={
																							12
																						}
																						className="text-gray-400!"
																					/>
																				</div>
																			</button>
																		);
																	},
																)}
															</motion.div>
														)}
												</AnimatePresence>
											</div>
											<div className="flex! gap-2!">
												<input
													type="string"
													placeholder="Price"
													value={new TransactionAmount(
														item.price,
													).toString()}
													onChange={(e) =>
														handleItemChange(
															item.id,
															"price",
															TransactionAmount.fromString(
																e.target.value,
															).toNumber(),
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
															item.id,
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
										{/* Category Selection */}
										<div className="flex! flex-col! sm:flex-row! gap-2! relative! z-10!">
											<div className="flex-1! relative!">
												{creatingCategory ===
												item.id ? (
													<div className="flex! gap-1!">
														<input
															type="text"
															placeholder="New category name"
															value={
																newCategoryName
															}
															onChange={(e) =>
																setNewCategoryName(
																	e.target
																		.value,
																)
															}
															onKeyDown={(e) => {
																if (
																	e.key ===
																	"Enter"
																) {
																	e.preventDefault();
																	handleCreateCategory(
																		item.id,
																	);
																} else if (
																	e.key ===
																	"Escape"
																) {
																	setCreatingCategory(
																		null,
																	);
																	setNewCategoryName(
																		"",
																	);
																}
															}}
															autoFocus
															className="flex-1! px-2! py-1.5! text-sm! border! border-indigo-300! rounded! focus:ring-1! focus:ring-indigo-500!"
														/>
														<button
															type="button"
															onClick={() =>
																handleCreateCategory(
																	item.id,
																)
															}
															className="p-1.5! bg-indigo-600! text-white! rounded! hover:bg-indigo-700!"
														>
															<Check size={14} />
														</button>
														<button
															type="button"
															onClick={() => {
																setCreatingCategory(
																	null,
																);
																setNewCategoryName(
																	"",
																);
															}}
															className="p-1.5! bg-gray-200! text-gray-600! rounded! hover:bg-gray-300!"
														>
															<X size={14} />
														</button>
													</div>
												) : (
													<select
														value={item.category}
														onChange={(e) =>
															handleCategoryChange(
																item.id,
																e.target.value,
															)
														}
														className="w-full! px-2! py-1.5! text-sm! border! border-gray-300! rounded! focus:ring-1! focus:ring-indigo-500! bg-white! relative! z-10"
													>
														<option value="">
															Select Category
														</option>
														<option
															value="__new__"
															className="text-indigo-600! font-medium!"
														>
															+ New Category
														</option>
														{Array.from(
															categoriesWithSubcategories.values(),
														).map(
															({ category }) => (
																<option
																	key={
																		category.id
																	}
																	value={
																		category.id
																	}
																>
																	{
																		category.name
																	}
																</option>
															),
														)}
													</select>
												)}
											</div>

											{/* Subcategory Selection */}
											<div className="flex-1! relative!">
												{creatingSubcategory ===
												item.id ? (
													<div className="flex! gap-1!">
														<input
															type="text"
															placeholder="New subcategory name"
															value={
																newSubcategoryName
															}
															onChange={(e) =>
																setNewSubcategoryName(
																	e.target
																		.value,
																)
															}
															onKeyDown={(e) => {
																if (
																	e.key ===
																	"Enter"
																) {
																	e.preventDefault();
																	handleCreateSubcategory(
																		item.id,
																	);
																} else if (
																	e.key ===
																	"Escape"
																) {
																	setCreatingSubcategory(
																		null,
																	);
																	setNewSubcategoryName(
																		"",
																	);
																}
															}}
															autoFocus
															className="flex-1! px-2! py-1.5! text-sm! border! border-indigo-300! rounded! focus:ring-1! focus:ring-indigo-500!"
														/>
														<button
															type="button"
															onClick={() =>
																handleCreateSubcategory(
																	item.id,
																)
															}
															className="p-1.5! bg-indigo-600! text-white! rounded! hover:bg-indigo-700!"
														>
															<Check size={14} />
														</button>
														<button
															type="button"
															onClick={() => {
																setCreatingSubcategory(
																	null,
																);
																setNewSubcategoryName(
																	"",
																);
															}}
															className="p-1.5! bg-gray-200! text-gray-600! rounded! hover:bg-gray-300!"
														>
															<X size={14} />
														</button>
													</div>
												) : (
													<select
														value={item.subcategory}
														onChange={(e) =>
															handleSubcategoryChange(
																item.id,
																e.target.value,
															)
														}
														className="w-full! px-2! py-1.5! text-sm! border! border-gray-300! rounded! focus:ring-1! focus:ring-indigo-500! bg-white! relative! z-10"
														disabled={
															!item.category
														}
													>
														<option value="">
															Select Subcategory
														</option>
														{item.category && (
															<option
																value="__new__"
																className="text-indigo-600! font-medium!"
															>
																+ New
																Subcategory
															</option>
														)}
														{item.category &&
															Array.from(
																categoriesWithSubcategories
																	.get(
																		item.category,
																	)
																	?.subcategories.values() ||
																	[],
															).map((sub) => (
																<option
																	key={sub.id}
																	value={
																		sub.id
																	}
																>
																	{sub.name}
																</option>
															))}
													</select>
												)}
											</div>
										</div>
									</div>
									{items.length > 1 && !isEditMode && (
										<button
											onClick={() =>
												handleRemoveItem(item.id)
											}
											className="p-1! text-gray-400! hover:text-rose-500! transition-colors! flex-shrink-0!"
										>
											<Trash2 size={16} />
										</button>
									)}
								</div>
							))}
						</div>
						{!isEditMode && (
							<button
								onClick={handleAddItem}
								className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-indigo-600 hover:text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50/50 font-medium flex items-center justify-center gap-1.5 transition-colors"
							>
								<Plus size={16} /> Add Item
							</button>
						)}
					</div>

					{/* Account Splitting Section */}
					<div className="space-y-6! mb-6!">
						<AccountSplitter
							label={
								operation === "income"
									? "Deposit To"
									: "Paid From"
							}
							splits={fromSplits}
							onChange={setFromSplits}
							totalAmount={totalAmount}
						/>

						{/* Cross-currency exchange rate field */}
						{isCrossCurrencyTransfer && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: "auto" }}
								exit={{ opacity: 0, height: 0 }}
								className="bg-blue-50 rounded-lg p-4 border border-blue-200"
							>
								<div className="flex items-center gap-2 mb-3">
									<ArrowRightLeft
										size={16}
										className="text-blue-600"
									/>
									<span className="font-medium text-blue-800 text-sm">
										Currency Conversion
									</span>
								</div>
								<div className="flex items-center gap-3">
									<div className="flex items-center gap-2 flex-1">
										<span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">
											1 {fromCurrency}
										</span>
										<span className="text-blue-400">=</span>
										<div className="relative flex-1">
											<input
												type="text"
												value={
													exchangeRate.toString() ||
													""
												}
												onChange={(e) => {
													console.log(
														"New exchange rate input:",
														e.target.value,
													);
													const val =
														TransactionAmount.fromString(
															e.target.value ||
																"0",
														);
													setExchangeRate(val);
												}}
												className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white tabular-nums"
											/>
										</div>
										<span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">
											{toCurrency}
										</span>
									</div>
								</div>
								{fromSplits.length > 0 && (
									<p className="text-xs text-blue-600 mt-2.5">
										{new Intl.NumberFormat("en-US", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										}).format(
											fromSplits.reduce(
												(s, sp) => s + sp.amount.value,
												0,
											),
										)}{" "}
										{fromCurrency} →{" "}
										{new Intl.NumberFormat("en-US", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										}).format(
											fromSplits.reduce(
												(s, sp) => s + sp.amount.value,
												0,
											) * exchangeRate.value,
										)}{" "}
										{toCurrency}
									</p>
								)}
							</motion.div>
						)}

						{operation === "transfer" && (
							<AccountSplitter
								label="Transfer To"
								splits={toSplits}
								onChange={setToSplits}
								totalAmount={
									isCrossCurrencyTransfer
										? fromSplits.reduce(
												(s, sp) => s + sp.amount.value,
												0,
											) * exchangeRate.value
										: totalAmount
								}
							/>
						)}
					</div>
				</div>

				{/* Footer */}
				<div className="flex! flex-col! gap-4! pt-4! border-t! border-gray-100! mt-auto!">
					<div className="flex! justify-between! items-center! px-2!">
						<span className="text-sm! text-gray-500!">
							Total Transaction Value
						</span>
						<span className="text-2xl! font-bold! text-gray-900!">
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
