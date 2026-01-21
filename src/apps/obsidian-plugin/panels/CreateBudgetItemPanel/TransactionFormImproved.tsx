import {
	DateValueObject,
	NumberValueObject,
	PriceValueObject,
	StringValueObject,
} from "@juandardilag/value-objects";
import AddIcon from "@mui/icons-material/Add";
import CalculateIcon from "@mui/icons-material/Calculate";
import DeleteIcon from "@mui/icons-material/Delete";
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Collapse,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	TextField,
	Typography,
} from "@mui/material";
import { PriceInput } from "apps/obsidian-plugin/components/Input/PriceInput";
import { useDateInput } from "apps/obsidian-plugin/components/Input/useDateInput";
import {
	MultiSelectDropdown,
	Select,
	SelectWithCreation,
} from "apps/obsidian-plugin/components/Select";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import {
	AccountsContext,
	CategoriesContext,
	ScheduledTransactionsContext,
	TransactionsContext,
} from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { Category, CategoryID, CategoryName } from "contexts/Categories/domain";
import { Nanoid, OperationType } from "contexts/Shared/domain";
import {
	SubCategory,
	SubCategoryID,
	SubCategoryName,
} from "contexts/Subcategories/domain";
import {
	PaymentSplit,
	PaymentSplitPrimitives,
	Transaction,
	TransactionAmount,
	TransactionDate,
	TransactionID,
	TransactionName,
	TransactionOperation,
} from "contexts/Transactions/domain";
import * as math from "mathjs";
import React, {
	PropsWithChildren,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { Store } from "../../../../contexts/Stores/domain";
import { useMultiTransactionValidation } from "./useMultiTransactionValidation";

// Transaction type colors
const TRANSACTION_TYPE_COLORS = {
	expense: {
		primary: "#d32f2f",
		light: "#ffcdd2",
		background: "rgba(211, 47, 47, 0.08)",
		border: "rgba(211, 47, 47, 0.2)",
	},
	income: {
		primary: "#2e7d32",
		light: "#c8e6c9",
		background: "rgba(46, 125, 50, 0.08)",
		border: "rgba(46, 125, 50, 0.2)",
	},
	transfer: {
		primary: "#1976d2",
		light: "#bbdefb",
		background: "rgba(25, 118, 210, 0.08)",
		border: "rgba(25, 118, 210, 0.2)",
	},
} as const;

// Interface for individual transaction items
interface TransactionItem {
	id: string;
	name: string;
	amount: number;
	quantity: number;
	category: string;
	subCategory: string;
}

// Main component
export const TransactionFormImproved = ({
	close,
	onSubmit,
	transaction,
	children,
}: PropsWithChildren<{
	close: () => void;
	onSubmit: (withClose: boolean) => void;
	transaction?: Transaction;
}>) => {
	const { logger } = useLogger("TransactionFormImproved");
	const {
		useCases: { recordTransaction, updateTransaction },
		transactions,
	} = useContext(TransactionsContext);
	const {
		useCases: { createCategory, createSubCategory },
		categories,
		subCategories,
		updateCategories,
		updateSubCategories,
		updateCategoriesWithSubcategories,
	} = useContext(CategoriesContext);
	const {
		useCases: { getAllStores, createStore },
	} = useContext(ScheduledTransactionsContext);
	const { updateAccounts, accounts } = useContext(AccountsContext);

	// State for brands, stores, and providers
	const [stores, setStores] = useState<Store[]>([]);

	// UI state for foldable sections
	const [showBreakdown, setShowBreakdown] = useState(false);

	// Inline category creation state
	const [showCategoryCreation, setShowCategoryCreation] = useState(false);
	const [newCategoryName, setNewCategoryName] = useState("");
	const [isCreatingCategory, setIsCreatingCategory] = useState(false);
	const [categoryCreationError, setCategoryCreationError] = useState<
		string | null
	>(null);

	// Inline subcategory creation state
	const [showSubcategoryCreation, setShowSubcategoryCreation] =
		useState(false);
	const [newSubcategoryName, setNewSubcategoryName] = useState("");
	const [selectedParentCategory, setSelectedParentCategory] = useState("");
	const [isCreatingSubcategory, setIsCreatingSubcategory] = useState(false);
	const [subcategoryCreationError, setSubcategoryCreationError] = useState<
		string | null
	>(null);

	const [updateData, setUpdateData] = useState(true);

	// Load brands, stores, and providers
	useEffect(() => {
		if (updateData) {
			const loadData = async () => {
				try {
					const { stores } = await getAllStores.execute();
					setStores(stores);
				} catch (error) {
					logger.error(
						"Error loading brands, stores, and providers",
						error instanceof Error
							? error
							: new Error(
									"Error loading brands, stores, and providers",
								),
					);
				}
			};
			loadData();
			setUpdateData(false);
		}
	}, [getAllStores, logger, updateData]);

	// Helper to extract primitives from Transaction for editing
	const getInitialTransactionItems = async () => {
		logger.debug("getting initial transaction items", { transaction });
		if (!transaction) {
			return [
				{
					id: "1",
					name: "",
					amount: 0,
					quantity: 1,
					category: "",
					subCategory: "",
				},
			];
		}

		return [
			{
				id: "1",
				name: transaction.name.value,
				amount: transaction.originAccounts[0]?.amount.value || 0,
				quantity: 1,
				category:
					categories.find((c) => c.id.equalTo(transaction.category))
						?.name.value || "",
				subCategory:
					subCategories.find((s) =>
						s.id.equalTo(transaction.subCategory),
					)?.name.value || "",
			},
		];
	};

	// Shared properties for all transactions
	const getInitialSharedProperties = () => {
		logger.debug("getting shared properties", { transaction });
		if (!transaction) {
			return {
				date: new Date(),
				operation: "expense" as OperationType,
				fromSplits: [] as {
					accountId: string;
					amount: number;
					currency: string;
				}[],
				toSplits: [] as {
					accountId: string;
					amount: number;
					currency: string;
				}[],
				store: "",
			};
		}
		return {
			date: transaction.date.value,
			operation: transaction.operation.value,
			fromSplits: transaction.originAccounts.map((split) => {
				const account = accounts.find((acc) =>
					acc.id.equalTo(split.accountId),
				);
				return {
					accountId: split.accountId.value,
					amount: split.amount.value,
					currency: account?.currency.value || "",
				};
			}),
			toSplits: transaction.destinationAccounts.map((split) => {
				const account = accounts.find((acc) =>
					acc.id.equalTo(split.accountId),
				);
				return {
					accountId: split.accountId.value,
					amount: split.amount.value,
					currency: account?.currency.value || "",
				};
			}),
			store: transaction.store?.value || "",
		};
	};

	// State
	const [transactionItems, setTransactionItems] = useState<TransactionItem[]>(
		[],
	);
	useEffect(() => {
		getInitialTransactionItems().then((items) => {
			setTransactionItems(items);
		});
	}, [transaction]);

	const [sharedProperties, setSharedProperties] = useState<{
		date: Date;
		operation: OperationType;
		fromSplits: {
			accountId: string;
			amount: number;
			currency: string;
		}[];
		toSplits: {
			accountId: string;
			amount: number;
			currency: string;
		}[];

		exchangeRate?: number;
		store: string;
	}>({
		date: new Date(),
		operation: "expense" as OperationType,
		fromSplits: [] as {
			accountId: string;
			amount: number;
			currency: string;
		}[],
		toSplits: [] as {
			accountId: string;
			amount: number;
			currency: string;
		}[],
		store: "",
	});

	// Update shared properties when transaction changes
	useEffect(() => {
		setSharedProperties(getInitialSharedProperties());
	}, [transaction]);

	const [calculatorModalOpen, setCalculatorModalOpen] = useState(false);
	const [calculatorExpression, setCalculatorExpression] = useState("");
	const [calculatorError, setCalculatorError] = useState("");
	const [currentAmountField, setCurrentAmountField] = useState<string>("");

	// Date input
	const { DateInput: DateInputBase, date } = useDateInput({
		id: "date",
		initialValue: sharedProperties.date,
	});

	// Validation
	const { validate, getFieldError, clearErrors } =
		useMultiTransactionValidation(
			transactionItems,
			date,
			sharedProperties.operation,
			sharedProperties.fromSplits,
			sharedProperties.toSplits,
			sharedProperties.exchangeRate,
		);

	// Calculate total amount
	const totalAmount = useMemo(
		() =>
			transactionItems.reduce(
				(sum, item) => sum + item.amount * item.quantity,
				0,
			),
		[transactionItems],
	);

	// Helper function to reset form while preserving certain fields
	const resetFormForNewTransaction = () => {
		logger.debug("resetting form for new transaction");
		const preservedOperation = sharedProperties.operation;

		// Reset transaction items to a single empty item
		setTransactionItems([
			{
				id: Date.now().toString(),
				name: "",
				amount: 0,
				quantity: 1,
				category: "",
				subCategory: "",
			},
		]);

		setSharedProperties({
			date: new Date(),
			operation: preservedOperation,
			fromSplits: [],
			toSplits: [],
			store: "",
			exchangeRate: undefined,
		});

		// Clear validation errors
		clearErrors();
	};

	// Helper to proportionally distribute splits for each item
	const getProportionalSplits = (
		splits: PaymentSplitPrimitives[],
		itemAmount: number,
		totalAmount: number,
	) => {
		if (totalAmount === 0) return [];
		return splits.map((split) => ({
			accountId: split.accountId,
			amount: Number(
				((split.amount * itemAmount) / totalAmount).toFixed(2),
			),
			currency: split.currency,
		}));
	};

	// Category/Subcategory options
	const categoryOptions = useMemo(
		() =>
			categories
				.map((cat) => ({ id: cat.id.value, name: cat.name.value }))
				.sort((a, b) => a.name.localeCompare(b.name)),
		[categories],
	);

	const subCategoryOptions = useCallback(
		(parentCategoryName: string) =>
			(parentCategoryName === ""
				? subCategories
				: subCategories.filter((sub) => {
						const cat = categories.find(
							(c) => c.name.value === parentCategoryName,
						);
						if (!cat) return false;
						return cat.id.value === sub.category.value;
					})
			)
				.map((sub) => ({ id: sub.id.value, name: sub.name.value }))
				.sort((a, b) => a.name.localeCompare(b.name)),
		[categories, subCategories],
	);

	// Update helpers
	const updateTransactionItem = (
		id: string,
		updates: Partial<TransactionItem>,
	) => {
		setTransactionItems(
			transactionItems.map((item) =>
				item.id === id ? { ...item, ...updates } : item,
			),
		);
	};

	// Inline category creation functions
	const handleCreateCategory = async (itemId: string) => {
		logger.debug("Creating category", { newCategoryName });
		if (!newCategoryName.trim()) return;

		setIsCreatingCategory(true);
		setCategoryCreationError(null);

		try {
			await createCategory.execute(
				Category.create(new CategoryName(newCategoryName.trim())),
			);
			logger.debug("Category created successfully");
			updateCategories();
			updateCategoriesWithSubcategories();
			setNewCategoryName("");
			setShowCategoryCreation(false);
			updateTransactionItem(itemId, { category: newCategoryName.trim() });
		} catch (error) {
			logger.error("Failed to create category", error);
			setCategoryCreationError(
				error instanceof Error
					? error.message
					: "Failed to create category",
			);
		} finally {
			setIsCreatingCategory(false);
		}
	};

	// Inline subcategory creation functions
	const handleCreateSubcategory = async (itemId: string) => {
		logger.debug("Creating subcategory", {
			newSubcategoryName,
			selectedParentCategory,
		});
		if (!newSubcategoryName.trim() || !selectedParentCategory) return;

		setIsCreatingSubcategory(true);
		setSubcategoryCreationError(null);

		try {
			const parentCategory = categories.find(
				(c) => c.name.value === selectedParentCategory,
			);
			logger.debug("Found parent category", { parentCategory });
			if (!parentCategory) {
				throw new Error("Parent category not found");
			}

			await createSubCategory.execute(
				SubCategory.create(
					parentCategory.id,
					new SubCategoryName(newSubcategoryName.trim()),
				),
			);
			logger.debug("Subcategory created successfully");
			updateSubCategories();
			updateCategoriesWithSubcategories();
			setNewSubcategoryName("");
			setSelectedParentCategory("");
			setShowSubcategoryCreation(false);
			updateTransactionItem(itemId, {
				subCategory: newSubcategoryName.trim(),
			});
		} catch (error) {
			logger.error("Failed to create subcategory", error);
			setSubcategoryCreationError(
				error instanceof Error
					? error.message
					: "Failed to create subcategory",
			);
		} finally {
			setIsCreatingSubcategory(false);
		}
	};

	// Name select handler
	const handleNameSelect = (transactionId: string, displayName: string) => {
		const match = transactions.find(
			(transaction) => transaction.name.value === displayName,
		);
		if (match) {
			updateSharedProperties({
				operation: match.operation.value,
				fromSplits: match.originAccounts.map((split) => ({
					accountId: split.accountId.value,
					amount: split.amount.value,
					currency:
						accounts.find((acc) => acc.id.equalTo(split.accountId))
							?.currency.value || "",
				})),
				toSplits: match.destinationAccounts.map((split) => ({
					accountId: split.accountId.value,
					amount: split.amount.value,
					currency:
						accounts.find((acc) => acc.id.equalTo(split.accountId))
							?.currency.value || "",
				})),
			});
			updateTransactionItem(transactionId, {
				name: match.name.value,
				amount: match.originAmount.price,
				category:
					categories.find((c) => c.id.value === match.category.value)
						?.name.value || "",
				subCategory:
					subCategories.find(
						(s) => s.id.value === match.subCategory.value,
					)?.name.value || "",
			});
		} else {
			updateTransactionItem(transactionId, {
				name: displayName,
			});
		}
	};

	// Store, brand, provider, name options
	const storeOptions = useMemo(
		() =>
			Array.from(
				new Set(
					stores
						.map((store) => store.name.value)
						.filter(
							(t): t is string =>
								typeof t === "string" && t.trim() !== "",
						),
				),
			),
		[stores],
	);

	const nameOptions = useMemo(
		() =>
			Array.from(
				new Set(
					transactions.map((transaction) => transaction.name.value),
				),
			),
		[transactions],
	);

	// Calculator functions
	const openCalculator = (itemId: string, currentAmount: number) => {
		setCurrentAmountField(itemId);
		setCalculatorExpression(currentAmount.toString());
		setCalculatorError("");
		setCalculatorModalOpen(true);
	};

	const calculateResult = () => {
		try {
			setCalculatorError("");
			const result = math.evaluate(calculatorExpression);
			const numericResult = Number(result);
			if (Number.isNaN(numericResult)) {
				setCalculatorError("Invalid expression");
				return;
			}
			if (numericResult < 0) {
				setCalculatorError("Amount cannot be negative");
				return;
			}
			updateTransactionItem(currentAmountField, {
				amount: numericResult,
			});
			setCalculatorModalOpen(false);
		} catch {
			setCalculatorError("Invalid mathematical expression");
		}
	};

	const handleCalculatorKeyPress = (event: React.KeyboardEvent) => {
		if (event.key === "Enter") calculateResult();
	};

	// Add/remove transaction item
	const addTransactionItem = () => {
		const newItem: TransactionItem = {
			id: Date.now().toString(),
			name: "",
			amount: 0,
			quantity: 1,
			category: "",
			subCategory: "",
		};
		setTransactionItems([...transactionItems, newItem]);
	};

	const removeTransactionItem = (id: string) => {
		if (transactionItems.length > 1) {
			setTransactionItems(
				transactionItems.filter((item) => item.id !== id),
			);
		}
	};

	const updateSharedProperties = useCallback(
		(updates: Partial<typeof sharedProperties>) => {
			setSharedProperties((prev) => ({ ...prev, ...updates }));
		},
		[],
	);

	// Sync date changes with shared properties
	useEffect(() => {
		updateSharedProperties({ date });
	}, [date]);

	// Submit handler
	const handleSubmit = async (withClose: boolean) => {
		if (!validate()) return;
		try {
			const totalAmount = transactionItems.reduce(
				(sum, item) => sum + item.amount * item.quantity,
				0,
			);

			const allStores = [...stores];

			// For edit mode, keep old logic (single transaction)
			if (transaction) {
				const firstItem = transactionItems[0];
				if (!firstItem) throw new Error("No transaction items found");

				const fromSplits = sharedProperties.fromSplits.map(
					(split) =>
						new PaymentSplit(
							new Nanoid(split.accountId),
							new TransactionAmount(split.amount),
						),
				);
				const toSplits = sharedProperties.toSplits.map(
					(split) =>
						new PaymentSplit(
							new Nanoid(split.accountId),
							new TransactionAmount(
								split.amount *
									(sharedProperties.exchangeRate ?? 1),
							),
						),
				);
				const categoryId = categories.find(
					(c) => c.name.value === firstItem.category,
				)?.id;
				const subCategoryId = subCategories.find(
					(sc) => sc.name.value === firstItem.subCategory,
				)?.id;
				if (!categoryId || !subCategoryId) {
					throw new Error("Category and subcategory are required");
				}
				const transactionData = {
					name: new TransactionName(firstItem.name),
					operation: new TransactionOperation(
						sharedProperties.operation,
					),
					category: new CategoryID(categoryId.value),
					subCategory: new SubCategoryID(subCategoryId.value),
					date: new TransactionDate(sharedProperties.date),
					fromSplits,
					toSplits,
					store: sharedProperties.store,
				};
				transaction.updateName(transactionData.name);
				transaction.updateOperation(transactionData.operation);
				transaction.updateCategory(transactionData.category);
				transaction.updateSubCategory(transactionData.subCategory);
				transaction.updateDate(transactionData.date);
				transaction.setOriginAccounts(transactionData.fromSplits);
				transaction.setDestinationAccounts(transactionData.toSplits);
				sharedProperties.exchangeRate &&
					transaction.updateExchangeRate(
						new NumberValueObject(sharedProperties.exchangeRate),
					);
				await updateTransaction.execute(transaction);
			} else {
				// Create a transaction for each item
				for (const item of transactionItems) {
					const categoryId = categories.find(
						(c) => c.name.value === item.category,
					)?.id;
					const subCategoryId = subCategories.find(
						(sc) => sc.name.value === item.subCategory,
					)?.id;
					if (!categoryId || !subCategoryId) {
						throw new Error(
							"Category and subcategory are required",
						);
					}
					const fromSplits = getProportionalSplits(
						sharedProperties.fromSplits,
						item.amount,
						totalAmount,
					).map(
						(split) =>
							new PaymentSplit(
								new Nanoid(split.accountId),
								new TransactionAmount(split.amount),
							),
					);
					const toSplits =
						sharedProperties.operation === "transfer"
							? getProportionalSplits(
									sharedProperties.toSplits,
									item.amount,
									totalAmount,
								).map(
									(split) =>
										new PaymentSplit(
											new Nanoid(split.accountId),
											new TransactionAmount(split.amount),
										),
								)
							: [];
					let store: Store | undefined = undefined;
					if (sharedProperties.store) {
						store = allStores.find(
							(s) => s.name.value === sharedProperties.store,
						);
						if (!store) {
							const newStore = Store.create(
								new StringValueObject(sharedProperties.store),
							);
							await createStore.execute(newStore);
							allStores.push(newStore);
						}
						logger.debug("store", { store });
					}

					for (let i = 1; i <= item.quantity; i++)
						await recordTransaction.execute(
							new Transaction(
								TransactionID.generate(),
								fromSplits,
								toSplits,
								new TransactionName(item.name),
								new TransactionOperation(
									sharedProperties.operation,
								),
								new CategoryID(categoryId.value),
								new SubCategoryID(subCategoryId.value),
								new TransactionDate(sharedProperties.date),
								DateValueObject.createNowDate(),
								sharedProperties.store
									? new StringValueObject(
											sharedProperties.store,
										)
									: undefined,
								sharedProperties.exchangeRate
									? new NumberValueObject(
											sharedProperties.exchangeRate,
										)
									: undefined,
							),
						);
				}
			}

			onSubmit(withClose);
			setUpdateData(true);
			updateAccounts();
			if (withClose) {
				close();
			} else {
				resetFormForNewTransaction();
			}
		} catch (error) {
			logger.error(
				"Error saving transaction",
				error instanceof Error
					? error
					: new Error("Error saving transaction"),
			);
		}
	};

	// Main UI rendering
	const currentColors = TRANSACTION_TYPE_COLORS[sharedProperties.operation];

	return (
		<Box
			className="create-budget-item-modal"
			sx={{
				backgroundColor: currentColors.background,
				border: `1px solid ${currentColors.border}`,
				borderRadius: 2,
				p: 3,
				transition: "all 0.3s ease",
			}}
		>
			{/* Header */}
			<Box sx={{ mb: 3 }}>
				<Typography
					variant="h4"
					sx={{
						mb: 2,
						textAlign: "center",
						color: currentColors.primary,
					}}
				>
					{transaction ? "Edit Transaction" : "Create Transaction"}
				</Typography>

				{/* Transaction Type Buttons */}
				<Box sx={{ display: "flex", gap: 1, mb: 3 }}>
					{(["expense", "income", "transfer"] as const).map(
						(type) => (
							<Button
								key={type}
								variant={
									sharedProperties.operation === type
										? "contained"
										: "outlined"
								}
								onClick={() =>
									updateSharedProperties({ operation: type })
								}
								sx={{
									flex: 1,
									backgroundColor:
										sharedProperties.operation === type
											? TRANSACTION_TYPE_COLORS[type]
													.primary
											: "transparent",
									borderColor:
										TRANSACTION_TYPE_COLORS[type].primary,
									color:
										sharedProperties.operation === type
											? "white"
											: TRANSACTION_TYPE_COLORS[type]
													.primary,
									textTransform: "none",
									fontWeight: 600,
									"&:hover": {
										backgroundColor:
											sharedProperties.operation === type
												? TRANSACTION_TYPE_COLORS[type]
														.primary
												: TRANSACTION_TYPE_COLORS[type]
														.background,
									},
								}}
							>
								{type.charAt(0).toUpperCase() + type.slice(1)}
							</Button>
						),
					)}
				</Box>
			</Box>

			{/* Validation Error Display */}
			{getFieldError("general") && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{getFieldError("general")}
				</Alert>
			)}

			{/* Core Transaction Details */}
			<Box sx={{ mb: 3 }}>
				<Typography
					variant="h6"
					sx={{ mb: 2, color: currentColors.primary }}
				>
					Transaction Details
				</Typography>

				{/* Date Input */}
				<Box sx={{ mb: 2 }}>
					<Typography
						variant="body2"
						sx={{ mb: 1, color: "var(--text-muted)" }}
					>
						Date *
					</Typography>
					{DateInputBase}
					{getFieldError("date") && (
						<Typography
							variant="caption"
							color="error"
							sx={{ mt: 0.5, display: "block" }}
						>
							{getFieldError("date")}
						</Typography>
					)}
				</Box>
			</Box>

			{/* Transaction Items Section */}
			<Box sx={{ mb: 3 }}>
				<Typography
					variant="h6"
					sx={{ mb: 2, color: currentColors.primary }}
				>
					Transaction Items
				</Typography>

				{transactionItems.map((item, index) => (
					<Box
						key={item.id}
						sx={{
							mb: 2,
							p: 2,
							border: `1px solid ${currentColors.border}`,
							borderRadius: 1,
							backgroundColor: "var(--background-primary)",
						}}
					>
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								mb: 2,
							}}
						>
							<Typography
								variant="subtitle1"
								sx={{
									color: currentColors.primary,
									fontWeight: 600,
								}}
							>
								Item {index + 1}
							</Typography>
							{transactionItems.length > 1 && (
								<IconButton
									size="small"
									onClick={() =>
										removeTransactionItem(item.id)
									}
									color="error"
								>
									<DeleteIcon />
								</IconButton>
							)}
						</Box>

						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								gap: 2,
							}}
						>
							{/* Name */}
							<Box>
								<Typography
									variant="body2"
									sx={{ mb: 1, color: "var(--text-muted)" }}
								>
									Name *
								</Typography>
								<SelectWithCreation
									id={`name-${item.id}`}
									label=""
									item={item.name || ""}
									items={nameOptions}
									onChange={(name) =>
										handleNameSelect(item.id, name)
									}
								/>
							</Box>

							{/* Amount */}
							<Box
								sx={{
									display: "flex",
									alignItems: "flex-end",
									gap: 1,
								}}
							>
								<PriceInput
									id={`amount-${item.id}`}
									placeholder="Amount *"
									value={
										new PriceValueObject(item.amount || 0, {
											withSign: false,
											decimals: 2,
											withZeros: true,
										})
									}
									onChange={(val) =>
										updateTransactionItem(item.id, {
											amount: val.toNumber(),
										})
									}
									prefix={
										sharedProperties.fromSplits[0]
											?.accountId
											? accounts.find((acc) =>
													acc.id.equalTo(
														new Nanoid(
															sharedProperties
																.fromSplits[0]
																.accountId,
														),
													),
												)?.currency.symbol
											: "$"
									}
								/>
								<IconButton
									size="small"
									onClick={() =>
										openCalculator(
											item.id,
											item.amount || 0,
										)
									}
									sx={{ mb: 1 }}
									title="Calculator"
								>
									<CalculateIcon />
								</IconButton>
							</Box>

							{/* Quantity */}
							{sharedProperties.operation !== "transfer" && (
								<TextField
									id={`quantity-${item.id}`}
									label="Quantity *"
									type="number"
									value={item.quantity}
									onChange={(e) => {
										const value =
											Number.parseInt(e.target.value) ??
											0;
										updateTransactionItem(item.id, {
											quantity: value,
										});
									}}
									slotProps={{
										htmlInput: { min: 0, step: 1 },
									}}
									variant="outlined"
									size="small"
									sx={{
										color: "var(--text-normal)",
										"& .MuiInputBase-input": {
											color: "var(--text-normal)",
										},
										"& .MuiInputLabel-root": {
											color: "var(--text-normal)",
										},
										"& .MuiFormHelperText-root": {
											color: "var(--text-muted)",
										},
									}}
								/>
							)}

							{/* Category */}
							<Box>
								<SelectWithCreation
									id={`category-${item.id}`}
									label="Category *"
									item={item.category || ""}
									items={categoryOptions.map(
										(opt) => opt.name,
									)}
									onChange={(categoryName) => {
										logger.debug("Selected category", {
											categoryName,
										});
										if (
											categoryName &&
											categoryOptions.some(
												(opt) =>
													opt.name === categoryName,
											)
										) {
											updateTransactionItem(item.id, {
												category: categoryName,
											});
										}
									}}
								/>
								<Button
									variant="text"
									size="small"
									onClick={() =>
										setShowCategoryCreation(
											!showCategoryCreation,
										)
									}
									sx={{
										p: 0,
										mt: 0.5,
										textTransform: "none",
										color: "var(--text-muted)",
										fontSize: "0.75rem",
										"&:hover": {
											backgroundColor: "transparent",
										},
									}}
								>
									{showCategoryCreation ? "▼" : "▶"} Create
									New Category
								</Button>
								<Collapse
									in={showCategoryCreation}
									timeout="auto"
								>
									<Box
										sx={{
											mt: 1,
											p: 2,
											border: "1px solid var(--background-modifier-border)",
											borderRadius: 1,
											backgroundColor:
												"var(--background-secondary)",
										}}
									>
										{categoryCreationError && (
											<Alert
												severity="error"
												sx={{ mb: 1 }}
											>
												{categoryCreationError}
											</Alert>
										)}
										<TextField
											fullWidth
											label="New Category Name"
											placeholder="Enter category name..."
											value={newCategoryName}
											onChange={(e) => {
												setNewCategoryName(
													e.target.value,
												);
												if (categoryCreationError)
													setCategoryCreationError(
														null,
													);
											}}
											size="small"
											disabled={isCreatingCategory}
											error={newCategoryName.length > 50}
											helperText={
												newCategoryName.length > 50
													? "Name must be 50 characters or less"
													: `${newCategoryName.length}/50 characters`
											}
											sx={{
												mb: 1,
												color: "var(--text-normal)",
												"& .MuiInputBase-input": {
													color: "var(--text-normal)",
												},
												"& .MuiInputLabel-root": {
													color: "var(--text-normal)",
												},
												"& .MuiFormHelperText-root": {
													color: "var(--text-muted)",
												},
											}}
										/>
										<Box sx={{ display: "flex", gap: 1 }}>
											<Button
												variant="contained"
												size="small"
												onClick={() =>
													handleCreateCategory(
														item.id,
													)
												}
												disabled={
													!newCategoryName.trim() ||
													newCategoryName.length >
														50 ||
													isCreatingCategory
												}
												startIcon={
													isCreatingCategory ? (
														<CircularProgress
															size={16}
															sx={{
																color: "inherit",
															}}
														/>
													) : (
														<AddIcon />
													)
												}
												sx={{ flex: 1 }}
											>
												{isCreatingCategory
													? "Creating..."
													: "Create Category"}
											</Button>
											<Button
												variant="outlined"
												size="small"
												onClick={() => {
													setNewCategoryName("");
													setCategoryCreationError(
														null,
													);
													setShowCategoryCreation(
														false,
													);
												}}
												disabled={isCreatingCategory}
											>
												Cancel
											</Button>
										</Box>
									</Box>
								</Collapse>
							</Box>

							{/* Subcategory */}
							<Box>
								<SelectWithCreation
									id={`subcategory-${item.id}`}
									label="Subcategory *"
									item={item.subCategory || ""}
									items={subCategoryOptions(
										item.category,
									).map((opt) => opt.name)}
									onChange={(subCategoryName) => {
										if (
											subCategoryName &&
											subCategoryOptions(
												item.category,
											).some(
												(opt) =>
													opt.name ===
													subCategoryName,
											)
										) {
											updateTransactionItem(item.id, {
												subCategory: subCategoryName,
											});
										}
									}}
								/>
								<Button
									variant="text"
									size="small"
									onClick={() =>
										setShowSubcategoryCreation(
											!showSubcategoryCreation,
										)
									}
									sx={{
										p: 0,
										mt: 0.5,
										textTransform: "none",
										color: "var(--text-muted)",
										fontSize: "0.75rem",
										"&:hover": {
											backgroundColor: "transparent",
										},
									}}
								>
									{showSubcategoryCreation ? "▼" : "▶"} Create
									New Subcategory
								</Button>
								<Collapse
									in={showSubcategoryCreation}
									timeout="auto"
								>
									<Box
										sx={{
											mt: 1,
											p: 2,
											border: "1px solid var(--background-modifier-border)",
											borderRadius: 1,
											backgroundColor:
												"var(--background-secondary)",
										}}
									>
										{subcategoryCreationError && (
											<Alert
												severity="error"
												sx={{ mb: 1 }}
											>
												{subcategoryCreationError}
											</Alert>
										)}
										<Select
											id="parent-category-select"
											label="Parent Category *"
											value={selectedParentCategory}
											values={categoryOptions.map(
												(opt) => opt.name,
											)}
											onChange={(categoryName) => {
												setSelectedParentCategory(
													categoryName,
												);
												if (subcategoryCreationError)
													setSubcategoryCreationError(
														null,
													);
											}}
										/>
										<TextField
											fullWidth
											label="New Subcategory Name"
											placeholder="Enter subcategory name..."
											value={newSubcategoryName}
											onChange={(e) => {
												setNewSubcategoryName(
													e.target.value,
												);
												if (subcategoryCreationError)
													setSubcategoryCreationError(
														null,
													);
											}}
											size="small"
											disabled={isCreatingSubcategory}
											error={
												newSubcategoryName.length > 50
											}
											helperText={
												newSubcategoryName.length > 50
													? "Name must be 50 characters or less"
													: `${newSubcategoryName.length}/50 characters`
											}
											sx={{
												mb: 1,
												mt: 1,
												color: "var(--text-normal)",
												"& .MuiInputBase-input": {
													color: "var(--text-normal)",
												},
												"& .MuiInputLabel-root": {
													color: "var(--text-normal)",
												},
												"& .MuiFormHelperText-root": {
													color: "var(--text-muted)",
												},
											}}
										/>
										<Box sx={{ display: "flex", gap: 1 }}>
											<Button
												variant="contained"
												size="small"
												onClick={() =>
													handleCreateSubcategory(
														item.id,
													)
												}
												disabled={
													!newSubcategoryName.trim() ||
													!selectedParentCategory ||
													newSubcategoryName.length >
														50 ||
													isCreatingSubcategory
												}
												startIcon={
													isCreatingSubcategory ? (
														<CircularProgress
															size={16}
															sx={{
																color: "inherit",
															}}
														/>
													) : (
														<AddIcon />
													)
												}
												sx={{ flex: 1 }}
											>
												{isCreatingSubcategory
													? "Creating..."
													: "Create Subcategory"}
											</Button>
											<Button
												variant="outlined"
												size="small"
												onClick={() => {
													setNewSubcategoryName("");
													setSelectedParentCategory(
														"",
													);
													setSubcategoryCreationError(
														null,
													);
													setShowSubcategoryCreation(
														false,
													);
												}}
												disabled={isCreatingSubcategory}
											>
												Cancel
											</Button>
										</Box>
									</Box>
								</Collapse>
							</Box>
						</Box>
					</Box>
				))}

				{/* Add Item Button */}
				<Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
					<Button
						variant="outlined"
						startIcon={<AddIcon />}
						onClick={addTransactionItem}
						size="small"
					>
						Add Item
					</Button>
				</Box>

				{/* Total Amount Display */}
				<Box sx={{ mb: 2 }}>
					<Button
						variant="text"
						onClick={() => setShowBreakdown(!showBreakdown)}
						sx={{
							p: 0,
							textTransform: "none",
							color: "var(--text-muted)",
							"&:hover": { backgroundColor: "transparent" },
						}}
					>
						<Typography variant="body2">
							{showBreakdown ? "▼" : "▶"} Total: $
							{totalAmount.toFixed(2)}
						</Typography>
					</Button>
					<Box
						sx={{
							display: showBreakdown ? "block" : "none",
							mt: 1,
						}}
					>
						<Box
							sx={{
								p: 2,
								backgroundColor: "var(--background-secondary)",
								borderRadius: 1,
								border: `1px solid ${currentColors.border}`,
							}}
						>
							<Typography
								variant="h6"
								sx={{
									textAlign: "center",
									mb: 1,
									color: currentColors.primary,
								}}
							>
								Total Amount: ${totalAmount.toFixed(2)}
							</Typography>
							{transactionItems.length > 0 && (
								<Box sx={{ mt: 1 }}>
									<Typography
										variant="body2"
										color="var(--text-muted)"
										sx={{ mb: 1 }}
									>
										Breakdown:
									</Typography>
									{transactionItems.map((item, index) => (
										<Typography
											key={item.id}
											variant="body2"
											color="var(--text-muted)"
											sx={{ ml: 1, mb: 0.5 }}
										>
											• {item.name || `Item ${index + 1}`}
											: $
											{(
												item.amount * item.quantity
											).toFixed(2)}{" "}
											({item.quantity} × $
											{item.amount.toFixed(2)})
										</Typography>
									))}
								</Box>
							)}
						</Box>
					</Box>
				</Box>
			</Box>
			{sharedProperties.operation !== "transfer" && (
				<Box sx={{ mb: 2 }}>
					<SelectWithCreation
						id="store"
						label="Store (optional)"
						item={sharedProperties.store}
						items={storeOptions}
						onChange={(store) => updateSharedProperties({ store })}
					/>
				</Box>
			)}

			{/* Account Selection Section */}
			<Box sx={{ mb: 3 }}>
				<Typography
					variant="h6"
					sx={{ mb: 2, color: currentColors.primary }}
				>
					Account Distribution
				</Typography>

				{/* From Account Selection */}
				<Box sx={{ mb: 2 }}>
					<Typography
						variant="body2"
						sx={{ mb: 1, color: "var(--text-muted)" }}
					>
						{sharedProperties.operation === "transfer"
							? "From Accounts *"
							: "Accounts *"}
					</Typography>
					<MultiSelectDropdown
						id="fromSplits"
						label=""
						placeholder="Select accounts..."
						selectedAccounts={sharedProperties.fromSplits}
						totalAmount={totalAmount}
						onChange={(fromSplits) => {
							updateSharedProperties({ fromSplits });
						}}
						error={getFieldError("fromSplits")}
					/>
					{getFieldError("fromSplits") && (
						<Typography
							variant="caption"
							color="error"
							sx={{ mt: 0.5, display: "block" }}
						>
							{getFieldError("fromSplits")}
						</Typography>
					)}
				</Box>

				{/* Transfer To Accounts */}
				{sharedProperties.operation === "transfer" && (
					<Box sx={{ mb: 2 }}>
						<Typography
							variant="body2"
							sx={{ mb: 1, color: "var(--text-muted)" }}
						>
							To Accounts *
						</Typography>
						<MultiSelectDropdown
							id="toSplits"
							label=""
							placeholder="Select to accounts..."
							selectedAccounts={sharedProperties.toSplits}
							totalAmount={totalAmount}
							onChange={(toSplits) => {
								updateSharedProperties({ toSplits });
							}}
							error={getFieldError("toSplits")}
						/>
						{getFieldError("toSplits") && (
							<Typography
								variant="caption"
								color="error"
								sx={{ mt: 0.5, display: "block" }}
							>
								{getFieldError("toSplits")}
							</Typography>
						)}
					</Box>
				)}
			</Box>
			{sharedProperties.operation === "transfer" &&
				sharedProperties.fromSplits?.[0]?.currency !==
					sharedProperties.toSplits?.[0]?.currency && (
					<>
						<PriceInput
							id={"exchange-rate"}
							key={"exchange-rate"}
							label="Exchange Rate"
							value={
								new PriceValueObject(
									sharedProperties.exchangeRate || 0,
									{
										decimals: 2,
										withZeros: true,
									},
								)
							}
							onChange={(value) =>
								updateSharedProperties({
									exchangeRate: value.value,
								})
							}
						/>
						{getFieldError("exchangeRate") && (
							<Typography
								variant="caption"
								color="error"
								sx={{ mt: 0.5, display: "block" }}
							>
								{getFieldError("exchangeRate")}
							</Typography>
						)}
					</>
				)}

			{children}

			{/* Action Buttons */}
			<Box
				sx={{
					mt: 3,
					display: "flex",
					justifyContent: "center",
					gap: 2,
				}}
			>
				{/* Show both buttons for new transactions, only Save button for editing */}
				{!transaction && (
					<Button
						type="button"
						variant="outlined"
						onClick={() => handleSubmit(false)}
						sx={{
							borderColor: currentColors.primary,
							color: currentColors.primary,
							"&:hover": {
								borderColor: currentColors.primary,
								backgroundColor: currentColors.background,
							},
						}}
					>
						Save & Create Another
					</Button>
				)}
				<Button
					type="button"
					variant="contained"
					onClick={() => handleSubmit(true)}
					sx={{
						backgroundColor: currentColors.primary,
						"&:hover": {
							backgroundColor: currentColors.primary,
							opacity: 0.9,
						},
					}}
				>
					{transaction ? "Save" : "Save & Finish"}
				</Button>
			</Box>

			{/* Calculator Modal */}
			<Dialog
				open={calculatorModalOpen}
				onClose={() => setCalculatorModalOpen(false)}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>Calculator</DialogTitle>
				<DialogContent>
					<Typography variant="body2" sx={{ mb: 2 }}>
						Enter a mathematical expression using numbers, operators
						(+, -, *, /), and parentheses for grouping.
					</Typography>
					<TextField
						autoFocus
						fullWidth
						label="Expression"
						value={calculatorExpression}
						onChange={(e) =>
							setCalculatorExpression(e.target.value)
						}
						onKeyUp={handleCalculatorKeyPress}
						placeholder="e.g., 10 + 5 * 2, (15 + 3) / 2"
						variant="outlined"
						sx={{ mb: 2 }}
					/>
					{calculatorError && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{calculatorError}
						</Alert>
					)}
					<Typography variant="body2" color="text.secondary">
						Examples: 10 + 5, 20 * 0.15, (100 - 10) / 2
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setCalculatorModalOpen(false)}>
						Cancel
					</Button>
					<Button onClick={calculateResult} variant="contained">
						Calculate
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};
