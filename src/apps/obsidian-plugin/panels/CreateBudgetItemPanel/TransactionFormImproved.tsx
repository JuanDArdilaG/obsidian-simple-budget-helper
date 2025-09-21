import {
	DateValueObject,
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
	CategoriesContext,
	ItemsContext,
	TransactionsContext,
} from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { AccountID } from "contexts/Accounts/domain";
import { Category, CategoryID, CategoryName } from "contexts/Categories/domain";
import {
	Item,
	ItemBrand,
	ItemID,
	ItemName,
	ItemPrice,
	ItemProductInfo,
	ItemStore,
	ItemType,
	ProductItem,
	ServiceItem,
} from "contexts/Items/domain";
import {
	Brand,
	Brand as BrandEntity,
} from "contexts/Items/domain/brand.entity";
import {
	Provider,
	Provider as ProviderEntity,
} from "contexts/Items/domain/provider.entity";
import {
	Store,
	Store as StoreEntity,
} from "contexts/Items/domain/store.entity";
import { OperationType } from "contexts/Shared/domain";
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
	useState,
} from "react";

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
	itemType: ItemType;
	brand: string;
	provider: string;
	item?: Item;
}

// Validation interface
interface ValidationErrors {
	items?: string;
	date?: string;
	operation?: string;
	fromSplits?: string;
	toSplits?: string;
	general?: string;
}

// Validation hook
const useMultiTransactionValidation = (
	items: TransactionItem[],
	date: Date,
	operation: OperationType,
	fromSplits: PaymentSplitPrimitives[],
	toSplits: PaymentSplitPrimitives[]
) => {
	const [errors, setErrors] = useState<ValidationErrors>({});

	const validate = (): boolean => {
		const newErrors: ValidationErrors = {};

		// Items validation
		if (!items || items.length === 0) {
			newErrors.items = "At least one transaction item is required";
		} else {
			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				if (!item.name || item.name.trim() === "") {
					newErrors.items = `Transaction ${i + 1}: Name is required`;
					break;
				}
				if (item.name.length < 2) {
					newErrors.items = `Transaction ${
						i + 1
					}: Name must be at least 2 characters`;
					break;
				}
				if (item.name.length > 100) {
					newErrors.items = `Transaction ${
						i + 1
					}: Name must be less than 100 characters`;
					break;
				}
				if (!item.category || item.category.trim() === "") {
					newErrors.items = `Transaction ${
						i + 1
					}: Category is required`;
					break;
				}
				if (!item.subCategory || item.subCategory.trim() === "") {
					newErrors.items = `Transaction ${
						i + 1
					}: Subcategory is required`;
					break;
				}
				if (item.amount <= 0) {
					newErrors.items = `Transaction ${
						i + 1
					}: Amount must be greater than 0`;
					break;
				}
				if (item.quantity < 1) {
					newErrors.items = `Transaction ${
						i + 1
					}: Quantity must be at least 1`;
					break;
				}
				if (!Number.isInteger(item.quantity)) {
					newErrors.items = `Transaction ${
						i + 1
					}: Quantity must be a whole number`;
					break;
				}
				if (item.brand && item.brand.length > 50) {
					newErrors.items = `Transaction ${
						i + 1
					}: Brand name must be less than 50 characters`;
					break;
				}
				if (item.provider && item.provider.length > 50) {
					newErrors.items = `Transaction ${
						i + 1
					}: Provider name must be less than 50 characters`;
					break;
				}
			}
		}

		// Date validation
		if (!date || isNaN(date.getTime())) {
			newErrors.date = "Valid date is required";
		} else {
			const now = new Date();
			const futureLimit = new Date(
				now.getFullYear() + 10,
				now.getMonth(),
				now.getDate()
			);
			const pastLimit = new Date(
				now.getFullYear() - 10,
				now.getMonth(),
				now.getDate()
			);

			if (date > futureLimit) {
				newErrors.date =
					"Date cannot be more than 10 years in the future";
			} else if (date < pastLimit) {
				newErrors.date =
					"Date cannot be more than 10 years in the past";
			}
		}

		// Operation validation
		if (
			!operation ||
			!["expense", "income", "transfer"].includes(operation)
		) {
			newErrors.operation = "Valid operation type is required";
		}

		// FromSplits validation
		if (!fromSplits || fromSplits.length === 0) {
			newErrors.fromSplits = "At least one from account is required";
		}

		// ToSplits validation (only for transfers)
		if (operation === "transfer" && (!toSplits || toSplits.length === 0)) {
			newErrors.toSplits =
				"At least one to account is required for transfers";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const getFieldError = (
		field: keyof ValidationErrors
	): string | undefined => {
		return errors[field];
	};

	const clearErrors = () => {
		setErrors({});
	};

	return { validate, getFieldError, clearErrors, errors };
};

// Main component
export const TransactionFormImproved = ({
	items,
	close,
	onSubmit,
	transaction,
	children,
}: PropsWithChildren<{
	items: Item[];
	close: () => void;
	onSubmit: (withClose: boolean) => void;
	transaction?: Transaction;
}>) => {
	const { logger } = useLogger("TransactionFormImproved");
	const {
		useCases: { recordTransaction, updateTransaction },
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
		useCases: {
			getAllBrands,
			createBrand,
			getAllStores,
			createStore,
			getAllProviders,
			createProvider,
			getRegularItemById,
			createRegularItem,
			updateRegularItem,
		},
	} = useContext(ItemsContext);

	// State for brands, stores, and providers
	const [brands, setBrands] = useState<BrandEntity[]>([]);
	const [stores, setStores] = useState<StoreEntity[]>([]);
	const [providers, setProviders] = useState<ProviderEntity[]>([]);

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
					const [brandsResult, storesResult, providersResult] =
						await Promise.all([
							getAllBrands.execute(),
							getAllStores.execute(),
							getAllProviders.execute(),
						]);
					setBrands(brandsResult.brands);
					setStores(storesResult.stores);
					setProviders(providersResult.providers);
				} catch (error) {
					logger.error(
						error instanceof Error
							? error
							: new Error(
									"Error loading brands, stores, and providers"
							  )
					);
				}
			};
			loadData();
			setUpdateData(false);
		}
	}, [getAllBrands, getAllStores, getAllProviders, logger, updateData]);

	// Helper to extract primitives from Transaction for editing
	const getInitialTransactionItems = async () => {
		if (!transaction) {
			return [
				{
					id: "1",
					name: "",
					amount: 0,
					quantity: 1,
					category: "",
					subCategory: "",
					itemType: ItemType.PRODUCT,
					brand: "",
					provider: "",
				},
			];
		}

		// Find the item associated with this transaction
		let associatedItem: Item | undefined;
		let itemType = ItemType.PRODUCT; // Default for scheduled items

		if (transaction.itemID) {
			// First check if it's in the scheduled items (from items prop)
			const scheduledItem = items.find(
				(i) => i.id.value === transaction.itemID?.value
			);

			if (scheduledItem) {
				// For scheduled items, we can't get the regular Item, but we can determine type
				// Scheduled items default to PRODUCT type
				itemType = ItemType.PRODUCT;
			} else {
				// If not found in scheduled items, try to get it as a regular item
				try {
					associatedItem = await getRegularItemById.execute(
						transaction.itemID
					);
					itemType = associatedItem?.type || ItemType.PRODUCT;
				} catch (error) {
					logger.debug("Could not find item with ID", {
						itemId: transaction.itemID.value,
					});
				}
			}
		}

		return [
			{
				id: "1",
				name: transaction.name.value,
				amount: transaction.fromSplits[0]?.amount.value || 0,
				quantity: 1,
				category:
					categories.find((c) => c.id.equalTo(transaction.category))
						?.name.value || "",
				subCategory:
					subCategories.find((s) =>
						s.id.equalTo(transaction.subCategory)
					)?.name.value || "",
				itemType: itemType,
				brand: transaction.brand?.value || "",
				provider: "",
				item: associatedItem,
			},
		];
	};

	// Shared properties for all transactions
	const getInitialSharedProperties = () => {
		if (!transaction) {
			return {
				date: new Date(),
				operation: "expense" as OperationType,
				fromSplits: [] as PaymentSplitPrimitives[],
				toSplits: [] as PaymentSplitPrimitives[],
				store: "",
			};
		}
		return {
			date: transaction.date.value,
			operation: transaction.operation.value as OperationType,
			fromSplits: transaction.fromSplits.map((split) => ({
				accountId: split.accountId.value,
				amount: split.amount.value,
			})),
			toSplits: transaction.toSplits.map((split) => ({
				accountId: split.accountId.value,
				amount: split.amount.value,
			})),
			store: transaction.store?.value || "",
		};
	};

	// State
	const [transactionItems, setTransactionItems] = useState<TransactionItem[]>(
		[]
	);
	useEffect(() => {
		getInitialTransactionItems().then((items) => {
			setTransactionItems(items);
		});
	}, [transaction, categories, subCategories, items, getRegularItemById]);
	const [sharedProperties, setSharedProperties] = useState(
		getInitialSharedProperties()
	);

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
			sharedProperties.toSplits
		);

	// Calculate total amount
	const totalAmount = transactionItems.reduce(
		(sum, item) => sum + item.amount * item.quantity,
		0
	);

	// Helper function to reset form while preserving certain fields
	const resetFormForNewTransaction = () => {
		// Preserve date, operation type, and store
		const preservedDate = date;
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
				itemType: ItemType.PRODUCT,
				brand: "",
				provider: "",
			},
		]);

		// Reset shared properties but preserve certain fields
		setSharedProperties({
			date: preservedDate,
			operation: preservedOperation,
			fromSplits: [],
			toSplits: [],
			store: "",
		});

		// Clear validation errors
		clearErrors();
	};

	// Helper to proportionally distribute splits for each item
	const getProportionalSplits = (
		splits: PaymentSplitPrimitives[],
		itemAmount: number,
		totalAmount: number
	) => {
		if (totalAmount === 0) return [];
		return splits.map((split) => ({
			accountId: split.accountId,
			amount: Number(
				((split.amount * itemAmount) / totalAmount).toFixed(2)
			),
		}));
	};

	// Category/Subcategory options
	const categoryOptions = categories
		.map((cat) => ({ id: cat.id.value, name: cat.name.value }))
		.sort((a, b) => a.name.localeCompare(b.name));

	const subCategoryOptions = (parentCategoryName: string) =>
		(!parentCategoryName
			? subCategories
			: subCategories.filter((sub) => {
					const cat = categories.find(
						(c) => c.name.value === parentCategoryName
					);
					if (!cat) return false;
					return cat.id.value === sub.category.value;
			  })
		)
			.map((sub) => ({ id: sub.id.value, name: sub.name.value }))
			.sort((a, b) => a.name.localeCompare(b.name));

	// Helper functions
	const getCategoryIdByName = (name: string) =>
		categories.find((c) => c.name.value === name)?.id;
	const getSubCategoryIdByName = (name: string) =>
		subCategories.find((s) => s.name.value === name)?.id;

	// Inline category creation functions
	const handleCreateCategory = async () => {
		if (!newCategoryName.trim()) return;

		setIsCreatingCategory(true);
		setCategoryCreationError(null);

		try {
			await createCategory.execute(
				Category.create(new CategoryName(newCategoryName.trim()))
			);
			updateCategories();
			updateCategoriesWithSubcategories();
			setNewCategoryName("");
			setShowCategoryCreation(false);
		} catch (error) {
			setCategoryCreationError(
				error instanceof Error
					? error.message
					: "Failed to create category"
			);
		} finally {
			setIsCreatingCategory(false);
		}
	};

	// Inline subcategory creation functions
	const handleCreateSubcategory = async () => {
		if (!newSubcategoryName.trim() || !selectedParentCategory) return;

		setIsCreatingSubcategory(true);
		setSubcategoryCreationError(null);

		try {
			const parentCategory = categories.find(
				(c) => c.name.value === selectedParentCategory
			);
			if (!parentCategory) {
				throw new Error("Parent category not found");
			}

			await createSubCategory.execute(
				SubCategory.create(
					parentCategory.id,
					new SubCategoryName(newSubcategoryName.trim())
				)
			);
			updateSubCategories();
			updateCategoriesWithSubcategories();
			setNewSubcategoryName("");
			setSelectedParentCategory("");
			setShowSubcategoryCreation(false);
		} catch (error) {
			setSubcategoryCreationError(
				error instanceof Error
					? error.message
					: "Failed to create subcategory"
			);
		} finally {
			setIsCreatingSubcategory(false);
		}
	};

	// Name select handler
	const handleNameSelect = (itemId: string, displayName: string) => {
		const match = items.find((item) => item.name.value === displayName);
		if (match) {
			const itemBrands = match instanceof ProductItem ? match.brands : [];
			const brandName =
				itemBrands.length > 0
					? brands.find((b) => b.id.value === itemBrands[0].value)
							?.name.value
					: "";
			updateTransactionItem(itemId, {
				name: match.name.value,
				amount: match.amount.value,
				category:
					categories.find((c) => c.id.value === match.category.value)
						?.name.value || "",
				subCategory:
					subCategories.find(
						(s) => s.id.value === match.subCategory.value
					)?.name.value || "",
				itemType: match.type,
				item: match,
				brand: brandName,
			});
		} else {
			updateTransactionItem(itemId, {
				name: displayName,
				item: undefined,
			});
		}
	};

	// Store, brand, provider, name options
	const storeOptions = Array.from(
		new Set(
			stores
				.map((store) => store.name.value)
				.filter(
					(t): t is string => typeof t === "string" && t.trim() !== ""
				)
		)
	);
	const brandOptions = Array.from(
		new Set(
			[
				...brands.map((brand) => brand.name.value),
				...transactionItems.map((t) => t.brand),
			].filter(
				(t): t is string => typeof t === "string" && t.trim() !== ""
			)
		)
	);
	const providerOptions = Array.from(
		new Set(
			[
				...providers.map((provider) => provider.name.value),
				...transactionItems.map((t) => t.provider),
			].filter(
				(t): t is string => typeof t === "string" && t.trim() !== ""
			)
		)
	);
	const nameOptions = Array.from(
		new Set(items.map((item) => item.name.value))
	);

	const getBrandOptionsForItem = (itemName?: string) => {
		const item = items.find((i) => i.name.value === itemName);
		if (!item || !(item instanceof ProductItem)) return brandOptions;
		const brandsList = item.brands
			.map((brandId) => brands.find((b) => b.id.value === brandId.value))
			.filter((brand): brand is BrandEntity => !!brand)
			.map((brand) => brand.name.value)
			.filter((name) => !!name && name.trim() !== "");
		return brandsList;
	};

	const getProviderOptionsForItem = (itemName?: string) => {
		const item = items.find((i) => i.name.value === itemName);
		if (!item || !(item instanceof ServiceItem)) return providerOptions;
		const providersList = item.providers
			.map((providerId) =>
				providers.find((p) => p.id.value === providerId.value)
			)
			.filter((provider): provider is ProviderEntity => !!provider)
			.map((provider) => provider.name.value)
			.filter((name) => !!name && name.trim() !== "");
		return providersList;
	};

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
			if (isNaN(numericResult)) {
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
			itemType: ItemType.PRODUCT,
			brand: "",
			provider: "",
		};
		setTransactionItems([...transactionItems, newItem]);
	};

	const removeTransactionItem = (id: string) => {
		if (transactionItems.length > 1) {
			setTransactionItems(
				transactionItems.filter((item) => item.id !== id)
			);
		}
	};

	// Update helpers
	const updateTransactionItem = (
		id: string,
		updates: Partial<TransactionItem>
	) => {
		setTransactionItems(
			transactionItems.map((item) =>
				item.id === id ? { ...item, ...updates } : item
			)
		);
	};

	const updateSharedProperties = useCallback(
		(updates: Partial<typeof sharedProperties>) => {
			setSharedProperties((prev) => ({ ...prev, ...updates }));
		},
		[]
	);

	// Sync date changes with shared properties
	useEffect(() => {
		updateSharedProperties({ date });
	}, [date, updateSharedProperties]);

	// Submit handler
	const handleSubmit = async (withClose: boolean) => {
		if (!validate()) return;
		try {
			const totalAmount = transactionItems.reduce(
				(sum, item) => sum + item.amount * item.quantity,
				0
			);

			const allBrands = [...brands];
			const allStores = [...stores];
			const allProviders = [...providers];

			// For edit mode, keep old logic (single transaction)
			if (transaction) {
				const firstItem = transactionItems[0];
				if (!firstItem) throw new Error("No transaction items found");

				const fromSplits = sharedProperties.fromSplits.map(
					(split) =>
						new PaymentSplit(
							new AccountID(split.accountId),
							new TransactionAmount(split.amount)
						)
				);
				const toSplits = sharedProperties.toSplits.map(
					(split) =>
						new PaymentSplit(
							new AccountID(split.accountId),
							new TransactionAmount(split.amount)
						)
				);
				const categoryId = getCategoryIdByName(firstItem.category);
				const subCategoryId = getSubCategoryIdByName(
					firstItem.subCategory
				);
				if (!categoryId || !subCategoryId) {
					throw new Error("Category and subcategory are required");
				}
				const transactionData = {
					name: new TransactionName(firstItem.name),
					operation: new TransactionOperation(
						sharedProperties.operation
					),
					category: new CategoryID(categoryId.value),
					subCategory: new SubCategoryID(subCategoryId.value),
					date: new TransactionDate(sharedProperties.date),
					fromSplits,
					toSplits,
					itemId: firstItem.item ? firstItem.item.id : undefined,
					brand: firstItem.brand
						? new ItemBrand(firstItem.brand)
						: undefined,
					store: sharedProperties.store
						? new ItemProductInfo({
								brand: firstItem.brand
									? new ItemBrand(firstItem.brand)
									: undefined,
								store: new ItemStore(sharedProperties.store),
						  })
						: undefined,
				};
				transaction.updateName(transactionData.name);
				transaction.updateOperation(transactionData.operation);
				transaction.updateCategory(transactionData.category);
				transaction.updateSubCategory(transactionData.subCategory);
				transaction.updateDate(transactionData.date);
				transaction.setFromSplits(transactionData.fromSplits);
				transaction.setToSplits(transactionData.toSplits);
				await updateTransaction.execute(transaction);
			} else {
				// Create a transaction for each item
				for (const item of transactionItems) {
					const categoryId = getCategoryIdByName(item.category);
					const subCategoryId = getSubCategoryIdByName(
						item.subCategory
					);
					if (!categoryId || !subCategoryId) {
						throw new Error(
							"Category and subcategory are required"
						);
					}
					const fromSplits = getProportionalSplits(
						sharedProperties.fromSplits,
						item.amount,
						totalAmount
					).map(
						(split) =>
							new PaymentSplit(
								new AccountID(split.accountId),
								new TransactionAmount(split.amount)
							)
					);
					const toSplits =
						sharedProperties.operation === "transfer"
							? getProportionalSplits(
									sharedProperties.toSplits,
									item.amount,
									totalAmount
							  ).map(
									(split) =>
										new PaymentSplit(
											new AccountID(split.accountId),
											new TransactionAmount(split.amount)
										)
							  )
							: [];
					let brand: Brand | undefined = undefined;
					let store: Store | undefined = undefined;
					logger.debug("item instance of", {
						product: item.item instanceof ProductItem,
						service: item.item instanceof ServiceItem,
					});
					if (!item.item || item.item instanceof ProductItem) {
						if (item.brand) {
							brand = allBrands.find(
								(b) => b.name.value === item.brand
							);
							if (!brand) {
								brand = Brand.create(
									new StringValueObject(item.brand)
								);
								await createBrand.execute(brand);
								allBrands.push(brand);
							}
							logger.debug("brand", { brand });
						}
						if (sharedProperties.store) {
							store = allStores.find(
								(s) => s.name.value === sharedProperties.store
							);
							if (!store) {
								const newStore = Store.create(
									new StringValueObject(
										sharedProperties.store
									)
								);
								await createStore.execute(newStore);
								allStores.push(newStore);
							}
							logger.debug("store", { store });
						}
					}

					let provider: Provider | undefined = undefined;
					if (!item.item || item.item instanceof ServiceItem) {
						if (item.provider) {
							provider = allProviders.find(
								(p) => p.name.value === item.provider
							);
							if (!provider) {
								const newProvider = Provider.create(
									new StringValueObject(item.provider)
								);
								await createProvider.execute(newProvider);
								allProviders.push(newProvider);
							}
							logger.debug("provider", { provider });
						}
					}

					let regularItemId: ItemID | undefined = undefined;

					if (item.item) {
						const itemCopy = item.item.copy();
						itemCopy.updateAmount(new ItemPrice(item.amount));
						itemCopy.updateCategory(categoryId);
						itemCopy.updateSubCategory(subCategoryId);

						if (itemCopy instanceof ProductItem) {
							brand && itemCopy.addBrand(brand.id);
							store && itemCopy.addStore(store.id);
						}
						if (itemCopy instanceof ServiceItem) {
							provider && itemCopy.addProvider(provider.id);
						}

						regularItemId = itemCopy.id;

						await updateRegularItem.execute(itemCopy);
					} else {
						const regularItem =
							item.itemType === ItemType.PRODUCT ||
							sharedProperties.operation === "transfer"
								? ProductItem.create(
										new ItemName(item.name),
										categoryId,
										subCategoryId,
										new ItemPrice(item.amount),
										brand ? [brand.id] : [],
										store ? [store.id] : []
								  )
								: ServiceItem.create(
										new ItemName(item.name),
										categoryId,
										subCategoryId,
										new ItemPrice(item.amount),
										provider ? [provider.id] : []
								  );
						await createRegularItem.execute(regularItem);

						regularItemId = regularItem.id;
					}

					for (let i = 1; i <= item.quantity; i++)
						await recordTransaction.execute(
							new Transaction(
								TransactionID.generate(),
								fromSplits,
								toSplits,
								new TransactionName(item.name),
								new TransactionOperation(
									sharedProperties.operation
								),
								new CategoryID(categoryId.value),
								new SubCategoryID(subCategoryId.value),
								new TransactionDate(sharedProperties.date),
								DateValueObject.createNowDate(),
								regularItemId,
								sharedProperties.store || item.brand
									? new ItemProductInfo({
											brand: item.brand
												? new ItemBrand(item.brand)
												: undefined,
											store: sharedProperties.store
												? new ItemStore(
														sharedProperties.store
												  )
												: undefined,
									  })
									: undefined
							)
						);
				}
			}

			onSubmit(withClose);
			setUpdateData(true);
			if (withClose) {
				close();
			} else {
				resetFormForNewTransaction();
			}
		} catch (error) {
			logger.error(
				error instanceof Error
					? error
					: new Error("Error saving transaction")
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
						)
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
									isLocked={false}
									setIsLocked={() => {}}
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
									label="Amount *"
									value={
										new PriceValueObject(item.amount || 0, {
											withSign: false,
											decimals: 0,
										})
									}
									onChange={(val) =>
										updateTransactionItem(item.id, {
											amount: val.toNumber(),
										})
									}
								/>
								<IconButton
									size="small"
									onClick={() =>
										openCalculator(
											item.id,
											item.amount || 0
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
								<>
									<TextField
										id={`quantity-${item.id}`}
										label="Quantity *"
										type="number"
										value={item.quantity}
										onChange={(e) => {
											const value =
												parseInt(e.target.value) ?? 0;
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

									{/* Item Type */}
									<Select
										id={`itemType-${item.id}`}
										label="Item Type"
										value={item.itemType}
										values={[
											ItemType.PRODUCT,
											ItemType.SERVICE,
										]}
										onChange={(itemType) => {
											updateTransactionItem(item.id, {
												itemType: itemType as ItemType,
												brand:
													itemType ===
													ItemType.PRODUCT
														? item.brand
														: "",
												provider:
													itemType ===
													ItemType.SERVICE
														? item.provider
														: "",
											});
										}}
										isLocked={false}
										setIsLocked={() => {}}
									/>
								</>
							)}

							{/* Category */}
							<Box>
								<SelectWithCreation
									id={`category-${item.id}`}
									label="Category *"
									item={item.category || ""}
									items={categoryOptions.map(
										(opt) => opt.name
									)}
									onChange={(categoryName) => {
										if (
											categoryName &&
											categoryOptions.some(
												(opt) =>
													opt.name === categoryName
											)
										) {
											updateTransactionItem(item.id, {
												category: categoryName,
											});
										}
									}}
									isLocked={false}
									setIsLocked={() => {}}
								/>
								<Button
									variant="text"
									size="small"
									onClick={() =>
										setShowCategoryCreation(
											!showCategoryCreation
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
													e.target.value
												);
												if (categoryCreationError)
													setCategoryCreationError(
														null
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
												onClick={handleCreateCategory}
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
														null
													);
													setShowCategoryCreation(
														false
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
										item.category
									).map((opt) => opt.name)}
									onChange={(subCategoryName) => {
										if (
											subCategoryName &&
											subCategoryOptions(
												item.category
											).some(
												(opt) =>
													opt.name === subCategoryName
											)
										) {
											updateTransactionItem(item.id, {
												subCategory: subCategoryName,
											});
										}
									}}
									isLocked={false}
									setIsLocked={() => {}}
								/>
								<Button
									variant="text"
									size="small"
									onClick={() =>
										setShowSubcategoryCreation(
											!showSubcategoryCreation
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
												(opt) => opt.name
											)}
											onChange={(categoryName) => {
												setSelectedParentCategory(
													categoryName
												);
												if (subcategoryCreationError)
													setSubcategoryCreationError(
														null
													);
											}}
											isLocked={false}
											setIsLocked={() => {}}
										/>
										<TextField
											fullWidth
											label="New Subcategory Name"
											placeholder="Enter subcategory name..."
											value={newSubcategoryName}
											onChange={(e) => {
												setNewSubcategoryName(
													e.target.value
												);
												if (subcategoryCreationError)
													setSubcategoryCreationError(
														null
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
												onClick={
													handleCreateSubcategory
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
														""
													);
													setSubcategoryCreationError(
														null
													);
													setShowSubcategoryCreation(
														false
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

							{/* Brand (for products) */}
							{item.itemType === ItemType.PRODUCT &&
								sharedProperties.operation !== "transfer" && (
									<SelectWithCreation
										id={`brand-${item.id}`}
										label="Brand (optional)"
										item={item.brand || ""}
										items={getBrandOptionsForItem(
											item.name
										)}
										onChange={(brand) =>
											updateTransactionItem(item.id, {
												brand,
											})
										}
										isLocked={false}
										setIsLocked={() => {}}
									/>
								)}

							{/* Provider (for services) */}
							{item.itemType === ItemType.SERVICE &&
								sharedProperties.operation !== "transfer" && (
									<SelectWithCreation
										id={`provider-${item.id}`}
										label="Provider (optional)"
										item={item.provider || ""}
										items={getProviderOptionsForItem(
											item.name
										)}
										onChange={(provider) =>
											updateTransactionItem(item.id, {
												provider,
											})
										}
										isLocked={false}
										setIsLocked={() => {}}
									/>
								)}
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
						isLocked={false}
						setIsLocked={() => {}}
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
