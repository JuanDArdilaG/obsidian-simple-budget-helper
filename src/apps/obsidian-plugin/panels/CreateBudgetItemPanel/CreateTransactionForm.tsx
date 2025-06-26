import { PriceValueObject } from "@juandardilag/value-objects";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
	Box,
	Button,
	ButtonGroup,
	IconButton,
	Typography,
} from "@mui/material";
import { PriceInput } from "apps/obsidian-plugin/components/Input/PriceInput";
import { useDateInput } from "apps/obsidian-plugin/components/Input/useDateInput";
import {
	MultiAccountSelect,
	Select,
	SelectWithCreation,
} from "apps/obsidian-plugin/components/Select";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import {
	AccountsContext,
	CategoriesContext,
	ItemsContext,
	TransactionsContext,
} from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { Category } from "contexts/Categories/domain";
import { CategoryName } from "contexts/Categories/domain/category-name.valueobject";
import {
	Item,
	ItemType,
	ProductItem,
	ServiceItem,
} from "contexts/Items/domain";
import { Brand as BrandEntity } from "contexts/Items/domain/brand.entity";
import { ItemName } from "contexts/Items/domain/item-name.valueobject";
import { Provider as ProviderEntity } from "contexts/Items/domain/provider.entity";
import { Store as StoreEntity } from "contexts/Items/domain/store.entity";
import { OperationType } from "contexts/Shared/domain";
import { SubCategory } from "contexts/Subcategories/domain";
import { SubCategoryName } from "contexts/Subcategories/domain/subcategory-name.valueobject";
import {
	PaymentSplitPrimitives,
	Transaction,
	TransactionID,
	TransactionPrimitives,
} from "contexts/Transactions/domain";
import React, {
	PropsWithChildren,
	useContext,
	useEffect,
	useState,
} from "react";

// Interface for individual transaction items in the multi-transaction form
interface TransactionItem {
	id: string;
	name: string;
	amount: number;
	category: string;
	subCategory: string;
	itemType: ItemType;
	brand: string;
	provider: string;
	itemId?: string; // ID of the associated item if it exists
}

// Validation interface
interface ValidationErrors {
	items?: string;
	date?: string;
	operation?: string;
	fromSplits?: string;
	toSplits?: string;
}

// Validation hook for multi-transaction form
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

	return {
		validate,
		getFieldError,
		clearErrors,
		errors,
	};
};

export const CreateTransactionForm = ({
	items,
	close,
	children,
	onCreate,
}: PropsWithChildren<{
	items: Item[];
	close: () => void;
	onCreate: () => void;
}>) => {
	const { logger } = useLogger("CreateTransactionForm");

	const {
		updateBrands,
		updateStores,
		updateTransactions,
		useCases: { recordTransaction },
	} = useContext(TransactionsContext);
	const { updateAccounts, accounts } = useContext(AccountsContext);
	const {
		useCases: categoryUseCases,
		categories,
		subCategories,
		updateCategories,
		updateSubCategories,
	} = useContext(CategoriesContext);
	const {
		useCases: {
			createRegularItem,
			updateRegularItem,
			createBrand,
			createStore,
			createProvider,
			getAllBrands,
			getAllStores,
			getAllProviders,
		},
	} = useContext(ItemsContext);

	// State for brands, stores, and providers
	const [brands, setBrands] = useState<BrandEntity[]>([]);
	const [stores, setStores] = useState<StoreEntity[]>([]);
	const [providers, setProviders] = useState<ProviderEntity[]>([]);

	// Load brands, stores, and providers
	useEffect(() => {
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
	}, [getAllBrands, getAllStores, getAllProviders, logger]);

	// Shared properties for all transactions
	const [sharedProperties, setSharedProperties] = useState({
		date: new Date(),
		operation: "expense" as OperationType,
		fromSplits: [] as PaymentSplitPrimitives[],
		toSplits: [] as PaymentSplitPrimitives[],
		store: "",
	});

	// Individual transaction items
	const [transactionItems, setTransactionItems] = useState<TransactionItem[]>(
		[
			{
				id: "1",
				name: "",
				amount: 0,
				category: "",
				subCategory: "",
				itemType: ItemType.PRODUCT,
				brand: "",
				provider: "",
			},
		]
	);

	const [selectedTransaction, setSelectedTransaction] =
		useState<TransactionPrimitives>(Transaction.emptyPrimitives());

	const { DateInput: DateInputBase, date } = useDateInput({
		id: "date",
		lock: false,
		setLock: () => {},
	});

	// Initialize validation
	const { validate, getFieldError, clearErrors } =
		useMultiTransactionValidation(
			transactionItems,
			date,
			sharedProperties.operation,
			sharedProperties.fromSplits,
			sharedProperties.toSplits
		);

	// Create DateInput with error prop
	const DateInput = React.cloneElement(DateInputBase, {
		error: getFieldError("date"),
	});

	// Calculate total amount
	const totalAmount = transactionItems.reduce(
		(sum, item) => sum + item.amount,
		0
	);

	// 1. Category/Subcategory: use IDs, display names
	const categoryOptions = categories
		.map((cat) => ({
			id: cat.id.value,
			name: cat.name.value,
		}))
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
			.map((sub) => ({
				id: sub.id.value,
				name: sub.name.value,
			}))
			.sort((a, b) => a.name.localeCompare(b.name));

	// Helper functions to get category/subcategory id from name
	const getCategoryIdByName = (name: string) =>
		categories.find((c) => c.name.value === name)?.id;
	const getSubCategoryIdByName = (name: string) =>
		subCategories.find((s) => s.name.value === name)?.id;

	// 2. Name SelectWithCreation: populate item fields on select
	const handleNameSelect = (itemId: string, displayName: string) => {
		// Find matching item by name
		const match = items.find((item) => {
			return item.name.value === displayName;
		});

		if (match) {
			updateTransactionItem(itemId, {
				name: match.name.value,
				category:
					categories.find((c) => c.id.value === match.category.value)
						?.name.value || "",
				subCategory:
					subCategories.find(
						(s) => s.id.value === match.subCategory.value
					)?.name.value || "",
				itemType: match.type,
				itemId: match.id.value,
			});
		} else {
			updateTransactionItem(itemId, { name: displayName });
		}
	};

	// 3. Add Item button below last item
	// (move the button rendering after the transactionItems.map)

	// 4. Store options: unique, non-empty, plain strings
	const storeOptions = Array.from(
		new Set(
			stores
				.map((store) => store.name.value)
				.filter(
					(t): t is string => typeof t === "string" && t.trim() !== ""
				)
		)
	);

	// Compute unique brand options
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

	// Compute unique provider options
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

	// For name options - create display names that include brand and store info
	const nameOptions = Array.from(
		new Set(
			items.map((item) => {
				return item.name.value;
			})
		)
	);

	// Get brand options for a specific item by name
	const getBrandOptionsForItem = (itemName?: string) => {
		logger.debug("getBrandOptionsForItem called", { itemName });
		const item = items.find((i) => i.name.value === itemName);
		logger.debug("getBrandOptionsForItem found item", { item });
		if (!item || !(item instanceof ProductItem)) {
			logger.debug("getBrandOptionsForItem fallback to all brands", {
				brandOptions,
			});
			return brandOptions;
		}
		const brandsList = item.brands
			.map((brandId) => brands.find((b) => b.id.value === brandId.value))
			.filter((brand): brand is BrandEntity => !!brand)
			.map((brand) => brand.name.value)
			.filter((name) => !!name && name.trim() !== "");
		logger.debug("getBrandOptionsForItem returning brands", { brandsList });
		return brandsList;
	};

	const getProviderOptionsForItem = (itemName?: string) => {
		const item = items.find((i) => i.name.value === itemName);
		if (!item || !(item instanceof ServiceItem)) {
			return providerOptions;
		}
		const providersList = item.providers
			.map((providerId) =>
				providers.find((p) => p.id.value === providerId.value)
			)
			.filter((provider): provider is ProviderEntity => !!provider)
			.map((provider) => provider.name.value)
			.filter((name) => !!name && name.trim() !== "");
		return providersList;
	};

	// Add new transaction item
	const addTransactionItem = () => {
		const newItem: TransactionItem = {
			id: Date.now().toString(),
			name: "",
			amount: 0,
			category: "",
			subCategory: "",
			itemType: ItemType.PRODUCT,
			brand: "",
			provider: "",
		};
		setTransactionItems([...transactionItems, newItem]);
	};

	// Remove transaction item
	const removeTransactionItem = (id: string) => {
		if (transactionItems.length > 1) {
			setTransactionItems(
				transactionItems.filter((item) => item.id !== id)
			);
		}
	};

	// Add a ref to prevent infinite loops
	const isProcessingRef = React.useRef(false);

	useEffect(() => {
		if (
			selectedTransaction &&
			selectedTransaction.name &&
			!isProcessingRef.current
		) {
			isProcessingRef.current = true;
			logger.debug("selected item on creation", {
				selectedTransaction,
			});

			// Update shared properties from selected transaction
			updateSharedProperties({
				operation: selectedTransaction.operation,
				fromSplits: selectedTransaction.fromSplits || [],
				toSplits: selectedTransaction.toSplits || [],
			});

			// Update first transaction item with selected transaction details
			if (transactionItems.length > 0) {
				logger.debug("updating transaction item", {
					itemId: transactionItems[0].id,
					updates: {
						name: selectedTransaction.name,
						category: selectedTransaction.category,
						subCategory: selectedTransaction.subCategory,
						brand: selectedTransaction.brand || "",
					},
				});
				updateTransactionItem(transactionItems[0].id, {
					name: selectedTransaction.name,
					category: selectedTransaction.category,
					subCategory: selectedTransaction.subCategory,
					brand: selectedTransaction.brand || "",
				});
			}

			// Clear the selected transaction to prevent infinite loop
			setSelectedTransaction(Transaction.emptyPrimitives());
			isProcessingRef.current = false;
		}
	}, [selectedTransaction]);

	// Add debug logs to updateTransactionItem
	const updateTransactionItem = (
		id: string,
		updates: Partial<TransactionItem>
	) => {
		logger.debug("updateTransactionItem called", { id, updates });
		setTransactionItems(
			transactionItems.map((item) =>
				item.id === id ? { ...item, ...updates } : item
			)
		);
	};

	// Update shared properties
	const updateSharedProperties = (
		updates: Partial<typeof sharedProperties>
	) => {
		setSharedProperties({ ...sharedProperties, ...updates });
	};

	const handleSubmit = (withClose: boolean) => async () => {
		// Validate before submission
		if (!validate()) {
			logger.debug("Validation failed");
			return;
		}

		try {
			// 1. Gather all unique new categories
			const newCategories = Array.from(
				new Set(
					transactionItems
						.map((item) => item.category)
						.filter(
							(categoryName) =>
								categoryName &&
								!categories.some(
									(cat) =>
										String(cat.name) ===
										String(categoryName)
								)
						)
				)
			);
			for (const categoryName of newCategories) {
				const newCategory = Category.create(
					new CategoryName(categoryName)
				);
				await categoryUseCases.createCategory.execute(newCategory);
			}
			updateCategories();

			// 2. Gather all unique new subcategories (per parent category)
			const newSubCategories = Array.from(
				new Set(
					transactionItems
						.map((item) => ({
							category: item.category,
							subCategory: item.subCategory,
						}))
						.filter(({ category, subCategory }) => {
							const parentCategory = categories.find(
								(cat) => String(cat.name) === String(category)
							);
							return (
								category &&
								subCategory &&
								parentCategory &&
								!subCategories.some(
									(sub) =>
										String(sub.name) ===
											String(subCategory) &&
										String(sub.category) ===
											String(parentCategory.id)
								)
							);
						})
						.map(
							({ category, subCategory }) =>
								`${String(category)}|||${String(subCategory)}`
						)
				)
			);
			for (const entry of newSubCategories) {
				const [categoryName, subCategoryName] = entry.split("|||");
				const parentCategory = categories.find(
					(cat) => String(cat.name) === String(categoryName)
				);
				if (parentCategory) {
					const newSubCategory = SubCategory.create(
						parentCategory.id,
						new SubCategoryName(subCategoryName)
					);
					await categoryUseCases.createSubCategory.execute(
						newSubCategory
					);
				}
			}
			updateSubCategories();

			// Create individual transactions for each item
			for (const item of transactionItems) {
				// Handle item creation/update
				let itemId = item.itemId;

				if (!itemId) {
					// Create new item
					const categoryId = getCategoryIdByName(item.category);
					const subCategoryId = getSubCategoryIdByName(
						item.subCategory
					);

					if (categoryId && subCategoryId) {
						let newItem;

						if (item.itemType === ItemType.PRODUCT) {
							// Handle brand and store creation for products
							const brandEntities: BrandEntity[] = [];
							const storeEntities: StoreEntity[] = [];

							if (item.brand) {
								// Check if brand exists, if not create it
								const existingBrand = brands.find(
									(b) => b.name.value === item.brand
								);
								if (!existingBrand) {
									const brandEntity = BrandEntity.create(
										new ItemName(item.brand)
									);
									await createBrand.execute(brandEntity);
									brandEntities.push(brandEntity);
								} else {
									brandEntities.push(existingBrand);
								}
							}

							if (sharedProperties.store) {
								// Check if store exists, if not create it
								const existingStore = stores.find(
									(s) =>
										s.name.value === sharedProperties.store
								);
								if (!existingStore) {
									const storeEntity = StoreEntity.create(
										new ItemName(sharedProperties.store)
									);
									await createStore.execute(storeEntity);
									storeEntities.push(storeEntity);
								} else {
									storeEntities.push(existingStore);
								}
							}

							// Create the item with arrays
							newItem = ProductItem.create(
								new ItemName(item.name),
								categoryId,
								subCategoryId,
								brandEntities.map((b) => b.id),
								storeEntities.map((s) => s.id)
							);
						} else {
							// Handle provider creation for services
							const providerEntities: ProviderEntity[] = [];

							if (item.provider) {
								// Check if provider exists, if not create it
								const existingProvider = providers.find(
									(p) => p.name.value === item.provider
								);
								if (!existingProvider) {
									const providerEntity =
										ProviderEntity.create(
											new ItemName(item.provider)
										);
									await createProvider.execute(
										providerEntity
									);
									providerEntities.push(providerEntity);
								} else {
									providerEntities.push(existingProvider);
								}
							}

							// Create the item with array
							newItem = ServiceItem.create(
								new ItemName(item.name),
								categoryId,
								subCategoryId,
								providerEntities.map((p) => p.id)
							);
						}

						await createRegularItem.execute(newItem);
						itemId = newItem.id.value;
					}
				} else {
					// Update existing item if information changed
					const existingItem = items.find(
						(i) => i.id.value === itemId
					);
					if (existingItem) {
						let needsUpdate = false;
						const updatedItem = existingItem.copy();

						if (existingItem.name.value !== item.name) {
							updatedItem.updateName(new ItemName(item.name));
							needsUpdate = true;
						}

						const categoryId = getCategoryIdByName(item.category);
						if (
							categoryId &&
							!existingItem.category.equalTo(categoryId)
						) {
							updatedItem.updateCategory(categoryId);
							needsUpdate = true;
						}

						const subCategoryId = getSubCategoryIdByName(
							item.subCategory
						);
						if (
							subCategoryId &&
							!existingItem.subCategory.equalTo(subCategoryId)
						) {
							updatedItem.updateSubCategory(subCategoryId);
							needsUpdate = true;
						}

						// Handle brand/store/provider updates
						if (
							item.itemType === ItemType.PRODUCT &&
							existingItem instanceof ProductItem
						) {
							if (item.brand) {
								const existingBrand = brands.find(
									(b) => b.name.value === item.brand
								);
								if (existingBrand) {
									const brandId = existingBrand.id;
									if (
										!existingItem.brands.some(
											(b) => b.value === brandId.value
										)
									) {
										existingItem.addBrand(brandId);
										needsUpdate = true;
									}
								}
							}

							if (sharedProperties.store) {
								const existingStore = stores.find(
									(s) =>
										s.name.value === sharedProperties.store
								);
								if (existingStore) {
									const storeId = existingStore.id;
									if (
										!existingItem.stores.some(
											(s) => s.value === storeId.value
										)
									) {
										existingItem.addStore(storeId);
										needsUpdate = true;
									}
								}
							}
						} else if (
							item.itemType === ItemType.SERVICE &&
							existingItem instanceof ServiceItem
						) {
							if (item.provider) {
								const existingProvider = providers.find(
									(p) => p.name.value === item.provider
								);
								if (existingProvider) {
									const providerId = existingProvider.id;
									if (
										!existingItem.providers.some(
											(p) => p.value === providerId.value
										)
									) {
										existingItem.addProvider(providerId);
										needsUpdate = true;
									}
								}
							}
						}

						if (needsUpdate) {
							await updateRegularItem.execute(updatedItem);
						}
					}
				}

				// Create proportional splits for this transaction based on its amount
				const itemFromSplits = sharedProperties.fromSplits.map(
					(split) => ({
						...split,
						amount: (split.amount / totalAmount) * item.amount,
					})
				);

				const itemToSplits = sharedProperties.toSplits.map((split) => ({
					...split,
					amount: (split.amount / totalAmount) * item.amount,
				}));

				const transactionPrimitives: TransactionPrimitives = {
					id: TransactionID.generate().value,
					item: itemId,
					name: item.name,
					category:
						categories.find((c) => c.name.value === item.category)
							?.id.value ?? "",
					subCategory:
						subCategories.find(
							(s) => s.name.value === item.subCategory
						)?.id.value ?? "",
					fromSplits: itemFromSplits,
					toSplits: itemToSplits,
					operation: sharedProperties.operation,
					date,
					brand: item.brand || undefined,
					store: sharedProperties.store || undefined,
					updatedAt: new Date().toISOString(),
				};

				const transactionToPersist = Transaction.fromPrimitives(
					transactionPrimitives
				);
				await recordTransaction.execute(transactionToPersist);
			}

			updateTransactions();
			updateAccounts();
			updateBrands();
			updateStores();

			onCreate();

			if (withClose) return close();

			// Reset form
			setSelectedTransaction(Transaction.emptyPrimitives());
			setTransactionItems([
				{
					id: "1",
					name: "",
					amount: 0,
					category: "",
					subCategory: "",
					itemType: ItemType.PRODUCT,
					brand: "",
					provider: "",
				},
			]);
			setSharedProperties({
				date: new Date(),
				operation: "expense",
				fromSplits: [],
				toSplits: [],
				store: "",
			});
			clearErrors();
		} catch (error) {
			logger.error(
				error instanceof Error
					? error
					: new Error("Error creating transactions")
			);
		}
	};

	return (
		<div className="create-budget-item-modal">
			<h1>Create Transaction</h1>

			{/* Transaction Items Section */}
			<Box sx={{ mb: 3 }}>
				<Typography variant="h6" sx={{ mb: 2 }}>
					Transaction Items
				</Typography>

				{transactionItems.map((item, index) => (
					<Box
						key={item.id}
						sx={{
							mb: 2,
							p: 2,
							border: "1px solid #eee",
							borderRadius: 1,
						}}
					>
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								mb: 1,
							}}
						>
							<Typography variant="subtitle1">
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
								display: "grid",
								gridTemplateColumns: {
									xs: "1fr",
									sm: "1fr 1fr",
								},
								gap: 2,
							}}
						>
							<SelectWithCreation
								id={`name-${item.id}`}
								label="Name"
								item={item.name || ""}
								items={nameOptions}
								onChange={(name) =>
									handleNameSelect(item.id, name)
								}
								isLocked={false}
								setIsLocked={() => {}}
							/>
							<PriceInput
								id={`amount-${item.id}`}
								label="Amount"
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
							<Select
								id={`itemType-${item.id}`}
								label="Item Type"
								value={item.itemType}
								values={[ItemType.PRODUCT, ItemType.SERVICE]}
								onChange={(itemType) => {
									updateTransactionItem(item.id, {
										itemType: itemType as ItemType,
										// Clear brand/store/provider when switching types
										brand:
											itemType === ItemType.PRODUCT
												? item.brand
												: "",
										provider:
											itemType === ItemType.SERVICE
												? item.provider
												: "",
									});
								}}
								isLocked={false}
								setIsLocked={() => {}}
							/>
							<SelectWithCreation
								id={`category-${item.id}`}
								label="Category"
								item={item.category || ""}
								items={categoryOptions.map((opt) => opt.name)}
								onChange={(categoryName) => {
									logger.debug("category onChange called", {
										categoryName,
									});
									if (
										categoryName &&
										categoryOptions.some(
											(opt) => opt.name === categoryName
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
							<SelectWithCreation
								id={`subcategory-${item.id}`}
								label="Subcategory"
								item={item.subCategory || ""}
								items={subCategoryOptions(item.category).map(
									(opt) => opt.name
								)}
								onChange={(subCategoryName) => {
									logger.debug(
										"subcategory onChange called",
										{ subCategoryName }
									);
									if (
										subCategoryName &&
										subCategoryOptions(item.category).some(
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

							{/* Conditional fields based on item type */}
							{item.itemType === ItemType.PRODUCT && (
								<>
									<SelectWithCreation
										id={`brand-${item.id}`}
										label="Brand (optional)"
										item={item.brand || ""}
										items={(() => {
											const opts = getBrandOptionsForItem(
												item.name
											);
											logger.debug(
												"Brand SelectWithCreation items",
												{ opts, item }
											);
											return opts;
										})()}
										onChange={(brand) => {
											logger.debug(
												"Brand SelectWithCreation onChange",
												{ brand }
											);
											updateTransactionItem(item.id, {
												brand,
											});
										}}
										isLocked={false}
										setIsLocked={() => {}}
									/>
								</>
							)}

							{item.itemType === ItemType.SERVICE && (
								<SelectWithCreation
									id={`provider-${item.id}`}
									label="Provider (optional)"
									item={item.provider || ""}
									items={getProviderOptionsForItem(item.name)}
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

				{/* Add Item Button - moved below the last item */}
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
				<Box
					sx={{
						mt: 2,
						p: 2,
						backgroundColor: "#f5f5f5",
						borderRadius: 1,
					}}
				>
					<Typography variant="h6" sx={{ textAlign: "center" }}>
						Total Amount: ${totalAmount.toFixed(2)}
					</Typography>
				</Box>
			</Box>

			{/* Shared Properties Section */}
			<Box
				sx={{ mb: 3, p: 2, border: "1px solid #ddd", borderRadius: 1 }}
			>
				<Typography variant="h6" sx={{ mb: 2 }}>
					Shared Properties
				</Typography>

				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						gap: "5px",
						alignItems: "flex-end",
						marginTop: "10px",
					}}
				>
					{DateInput}
				</div>

				<Select
					id="type"
					label="Type"
					value={sharedProperties.operation}
					values={["expense", "income", "transfer"]}
					onChange={(operation) => {
						updateSharedProperties({
							operation: operation.toLowerCase() as OperationType,
						});
					}}
					isLocked={false}
					setIsLocked={() => {}}
					error={getFieldError("operation")}
				/>

				<MultiAccountSelect
					id="fromSplits"
					label="From Accounts"
					placeholder="Select from accounts..."
					selectedAccounts={sharedProperties.fromSplits}
					totalAmount={totalAmount}
					onChange={(fromSplits) => {
						updateSharedProperties({ fromSplits });
					}}
					error={getFieldError("fromSplits")}
				/>

				{sharedProperties.operation === "transfer" && (
					<MultiAccountSelect
						id="toSplits"
						label="To Accounts"
						placeholder="Select to accounts..."
						selectedAccounts={sharedProperties.toSplits}
						totalAmount={totalAmount}
						onChange={(toSplits) => {
							updateSharedProperties({ toSplits });
						}}
						error={getFieldError("toSplits")}
					/>
				)}

				<SelectWithCreation
					id="store"
					label="Store"
					item={sharedProperties.store}
					items={storeOptions}
					onChange={(store) => updateSharedProperties({ store })}
					isLocked={false}
					setIsLocked={() => {}}
				/>

				{/* Display selected accounts and amounts */}
				{(sharedProperties.fromSplits.length > 0 ||
					sharedProperties.toSplits.length > 0) && (
					<Box
						sx={{
							mt: 2,
							p: 2,
							backgroundColor:
								"var(--background-secondary, #222)",
							borderRadius: 1,
						}}
					>
						<Typography
							variant="subtitle2"
							sx={{ mb: 1, color: "var(--text-normal, #fff)" }}
						>
							Account Distribution:
						</Typography>

						{sharedProperties.fromSplits.length > 0 && (
							<Box sx={{ mb: 1 }}>
								<Typography
									variant="body2"
									color="var(--text-muted, #ccc)"
								>
									From:{" "}
									{sharedProperties.fromSplits
										.map((split) => {
											const account = accounts.find(
												(acc) =>
													String(acc.id) ===
													String(split.accountId)
											);
											return `${
												account?.name ||
												String(split.accountId)
											} ($${split.amount.toFixed(2)})`;
										})
										.join(", ")}
								</Typography>
							</Box>
						)}

						{sharedProperties.operation === "transfer" &&
							sharedProperties.toSplits.length > 0 && (
								<Box>
									<Typography
										variant="body2"
										color="var(--text-muted, #ccc)"
									>
										To:{" "}
										{sharedProperties.toSplits
											.map((split) => {
												const account = accounts.find(
													(acc) =>
														String(acc.id) ===
														String(split.accountId)
												);
												return `${
													account?.name ||
													String(split.accountId)
												} ($${split.amount.toFixed(
													2
												)})`;
											})
											.join(", ")}
									</Typography>
								</Box>
							)}
					</Box>
				)}
			</Box>

			{children}

			<ButtonGroup
				variant="contained"
				aria-label="Save Buttons"
				orientation="vertical"
				sx={{
					display: "flex",
					justifyContent: "center",
					marginTop: 3,
					"@media (min-width: 600px)": {
						flexDirection: "row",
					},
				}}
			>
				<Button onClick={handleSubmit(false)}>
					Save & Create Another
				</Button>
				<Button onClick={handleSubmit(true)}>Save & Finish</Button>
			</ButtonGroup>
		</div>
	);
};
