import {
	DateValueObject,
	NumberValueObject,
	PriceValueObject,
} from "@juandardilag/value-objects";
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Collapse,
	FormControl,
	InputLabel,
	List,
	ListSubheader,
	MenuItem,
	Select,
	TextField,
	Typography,
} from "@mui/material";
import { ResponsiveScheduledItem } from "apps/obsidian-plugin/components/ResponsiveScheduledItem";
import { useLogger } from "apps/obsidian-plugin/hooks";
import { EditItemRecurrencePanel } from "apps/obsidian-plugin/panels/CreateBudgetItemPanel/EditItemRecurrencePanel";
import { RecordItemPanel } from "apps/obsidian-plugin/panels/RecordItemPanel";
import {
	AccountBalance,
	AccountID,
	AccountName,
	AccountType,
} from "contexts/Accounts/domain";
import { Account } from "contexts/Accounts/domain/account.entity";
import { CategoryID } from "contexts/Categories/domain";
import { GetItemsUntilDateUseCaseOutput } from "contexts/Items/application/get-items-until-date.usecase";
import { ItemWithAccumulatedBalance } from "contexts/Items/application/items-with-accumulated-balance.usecase";
import {
	ItemID,
	ItemRecurrenceInfo,
	ScheduledItem,
} from "contexts/Items/domain";
import { AccountsReport } from "contexts/Reports/domain";
import { ItemsReport } from "contexts/Reports/domain/items-report.entity";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { useContext, useEffect, useMemo, useState } from "react";
import {
	AccountsContext,
	CategoriesContext,
	ItemsContext,
} from "../../Contexts";
import { ItemReportContext } from "../../Contexts/ItemReportContext";

// Filter types
interface FilterState {
	searchText: string;
	selectedCategory: CategoryID | null;
	selectedSubCategory: SubCategoryID | null;
	selectedAccount: AccountID | null;
	selectedOperationType: "income" | "expense" | "transfer" | "all";
	selectedTags: string[];
	priceRange: {
		min: number | null;
		max: number | null;
	};
}

export const CalendarItemsList = ({
	items,
	untilDate,
	selectedItem,
	setSelectedItem,
	action,
	setAction,
	updateItems,
	filters,
	setFilters,
	showFilters,
	setShowFilters,
}: {
	items: GetItemsUntilDateUseCaseOutput;
	untilDate: Date;
	selectedItem?: {
		recurrence: ItemRecurrenceInfo;
		itemID: ItemID;
	};
	setSelectedItem: React.Dispatch<
		React.SetStateAction<
			| {
					recurrence: ItemRecurrenceInfo;
					itemID: ItemID;
			  }
			| undefined
		>
	>;
	action?: "edit" | "record";
	setAction: React.Dispatch<
		React.SetStateAction<"edit" | "record" | undefined>
	>;
	updateItems: () => void;
	filters: FilterState;
	setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
	showFilters: boolean;
	setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
	const logger = useLogger("CalendarItemsList");
	const { getAccountByID, accounts } = useContext(AccountsContext);
	const { categories, subCategories } = useContext(CategoriesContext);
	const report = useMemo(() => new AccountsReport(accounts), [accounts]);
	const totalAssets = useMemo(() => report.getTotalForAssets(), [report]);

	const {
		useCases: { itemsWithAccumulatedBalanceUseCase },
	} = useContext(ItemsContext);
	const {
		useCases: { getTotal },
	} = useContext(ItemReportContext);

	const [showPanel, setShowPanel] = useState<{
		item: {
			recurrence: ItemRecurrenceInfo;
			itemID: ItemID;
		};
		action?: "edit" | "record";
	}>();

	const [itemsWithAccountsBalance, setItemsWithAccountsBalance] = useState<
		ItemWithAccumulatedBalance[]
	>([]);

	useEffect(() => {
		itemsWithAccumulatedBalanceUseCase
			.execute(new DateValueObject(untilDate))
			.then((items) => setItemsWithAccountsBalance(items));
	}, [untilDate]);

	// Filter the items based on current filters
	const filteredItems = useMemo(() => {
		return itemsWithAccountsBalance.filter(({ item, recurrence }) => {
			// Text search
			if (
				filters.searchText &&
				!item.name.value
					.toLowerCase()
					.includes(filters.searchText.toLowerCase())
			) {
				return false;
			}

			// Category filter
			if (
				filters.selectedCategory &&
				!item.category.equalTo(filters.selectedCategory)
			) {
				return false;
			}

			// Subcategory filter
			if (
				filters.selectedSubCategory &&
				!item.subCategory.equalTo(filters.selectedSubCategory)
			) {
				return false;
			}

			// Account filter
			if (filters.selectedAccount) {
				const hasFromAccount = item.fromSplits.some((split) =>
					split.accountId.equalTo(filters.selectedAccount!)
				);
				const hasToAccount = item.toSplits.some((split) =>
					split.accountId.equalTo(filters.selectedAccount!)
				);
				if (!hasFromAccount && !hasToAccount) {
					return false;
				}
			}

			// Operation type filter
			if (filters.selectedOperationType !== "all") {
				const operationType = item.operation.type.value;
				if (operationType !== filters.selectedOperationType) {
					return false;
				}
			}

			// Tags filter
			if (filters.selectedTags.length > 0) {
				const itemTags = item.tags?.toArray() ?? [];
				const hasSelectedTag = filters.selectedTags.some(
					(selectedTag) => itemTags.includes(selectedTag)
				);
				if (!hasSelectedTag) {
					return false;
				}
			}

			// Price range filter - use the same logic as getItemSplitPrice
			const accountId =
				recurrence.fromSplits?.[0]?.accountId ??
				item.fromSplits[0]?.accountId;
			const split = item.fromSplits.find(
				(split) => split.accountId.value === accountId.value
			);
			const itemPrice = split ? Math.abs(split.amount.value) : 0;

			if (
				filters.priceRange.min !== null &&
				itemPrice < filters.priceRange.min
			) {
				return false;
			}
			if (
				filters.priceRange.max !== null &&
				itemPrice > filters.priceRange.max
			) {
				return false;
			}

			return true;
		});
	}, [itemsWithAccountsBalance, filters]);

	// Create a filtered report based on the filtered items
	const filteredItemsReport = useMemo(() => {
		const filteredModifiedItems = filteredItems
			.map(({ recurrence, item }) => {
				// Instead of mutating the original item, create a clone/copy and apply modification
				const itemCopy = item.copy
					? item.copy()
					: Object.create(
							Object.getPrototypeOf(item),
							Object.getOwnPropertyDescriptors(item)
					  );
				if (itemCopy.applyModification) {
					itemCopy.applyModification(recurrence);
				}
				return itemCopy;
			})
			.filter((item) => !!item);
		logger.logger.debug("filteredModifiedItems", { filteredModifiedItems });
		return new ItemsReport(filteredModifiedItems);
	}, [filteredItems]);

	const [total, setTotal] = useState(NumberValueObject.zero());
	useEffect(() => {
		getTotal.execute({ report: filteredItemsReport }).then(setTotal);
	}, [getTotal, filteredItemsReport]);

	const [totalExpenses, setTotalExpenses] = useState(
		NumberValueObject.zero()
	);
	useEffect(() => {
		getTotal
			.execute({ report: filteredItemsReport, type: "expenses" })
			.then(setTotalExpenses);
	}, [getTotal, filteredItemsReport]);

	const [totalIncomes, setTotalIncomes] = useState(NumberValueObject.zero());
	useEffect(() => {
		getTotal
			.execute({ report: filteredItemsReport, type: "incomes" })
			.then(setTotalIncomes);
	}, [getTotal, filteredItemsReport]);

	// Get all available tags from items
	const availableTags = useMemo(() => {
		const tagSet = new Set<string>();
		itemsWithAccountsBalance.forEach(({ item }) => {
			item.tags?.toArray().forEach((tag) => tagSet.add(tag));
		});
		return Array.from(tagSet).sort();
	}, [itemsWithAccountsBalance]);

	useEffect(() => {
		if (selectedItem) {
			logger.debug("item selected for action.", {
				selectedItem,
				action,
				showPanel,
			});
			setShowPanel({ item: selectedItem, action });
		} else {
			// Clear the panel when selectedItem is undefined
			setShowPanel(undefined);
		}
	}, [action, selectedItem]);

	// Define the accountTypeLookup function
	const accountTypeLookup = (id: AccountID): AccountType => {
		const account = getAccountByID(id);
		if (!account) return new AccountType("asset"); // fallback
		return account.type;
	};

	// Filter handlers
	const handleFilterChange = <K extends keyof FilterState>(
		key: K,
		value: FilterState[K]
	) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
	};

	const handleResetFilters = () => {
		setFilters({
			searchText: "",
			selectedCategory: null,
			selectedSubCategory: null,
			selectedAccount: null,
			selectedOperationType: "all",
			selectedTags: [],
			priceRange: {
				min: null,
				max: null,
			},
		});
	};

	const activeFiltersCount = useMemo(() => {
		let count = 0;
		if (filters.searchText) count++;
		if (filters.selectedCategory) count++;
		if (filters.selectedSubCategory) count++;
		if (filters.selectedAccount) count++;
		if (filters.selectedOperationType !== "all") count++;
		if (filters.selectedTags.length > 0) count++;
		if (filters.priceRange.min !== null || filters.priceRange.max !== null)
			count++;
		return count;
	}, [filters]);

	return (
		<div>
			<div
				style={{
					textAlign: "right",
					marginTop: 10,
					marginBottom: 10,
					fontSize: "1.3em",
					padding: "12px",
					backgroundColor: "var(--background-secondary)",
					borderRadius: "6px",
					border: "1px solid var(--background-modifier-border)",
				}}
			>
				{/* Scheduled Items Summary */}
				<div
					style={{
						marginBottom: "12px",
						paddingBottom: "8px",
						borderBottom:
							"1px solid var(--background-modifier-border)",
					}}
				>
					<div
						style={{
							fontSize: "0.9em",
							color: "var(--text-muted)",
							marginBottom: "4px",
						}}
					>
						Scheduled Items Summary
						{activeFiltersCount > 0 && (
							<span
								style={{
									fontSize: "0.8em",
									color: "var(--text-muted)",
									marginLeft: "8px",
								}}
							>
								({filteredItems.length} of{" "}
								{itemsWithAccountsBalance.length} items)
							</span>
						)}
					</div>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: "4px",
						}}
					>
						<span
							style={{
								fontSize: "0.8em",
								color: "var(--text-muted)",
							}}
						>
							Incomes:
						</span>
						<span
							style={{
								color: "var(--color-green)",
								fontWeight: "500",
							}}
						>
							{totalIncomes.toString()}
						</span>
					</div>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: "4px",
						}}
					>
						<span
							style={{
								fontSize: "0.8em",
								color: "var(--text-muted)",
							}}
						>
							Expenses:
						</span>
						<span
							style={{
								color: "var(--color-red)",
								fontWeight: "500",
							}}
						>
							{totalExpenses.toString()}
						</span>
					</div>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<span
							style={{
								fontSize: "0.8em",
								color: "var(--text-muted)",
							}}
						>
							{total.isNegative() ? "Deficit" : "Surplus"}:
						</span>
						<span
							style={{
								fontWeight: "600",
								color: total.isNegative()
									? "var(--color-red)"
									: "var(--color-green)",
							}}
						>
							{total.toString()}
						</span>
					</div>
				</div>

				{/* Current Financial Position */}
				<div>
					<div
						style={{
							fontSize: "0.9em",
							color: "var(--text-muted)",
							marginBottom: "4px",
						}}
					>
						Current Financial Position
					</div>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: "4px",
						}}
					>
						<span
							style={{
								fontSize: "0.8em",
								color: "var(--text-muted)",
							}}
						>
							Current Assets:
						</span>
						<span style={{ fontWeight: "500" }}>
							{totalAssets.toString()}
						</span>
					</div>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<span
							style={{
								fontSize: "0.8em",
								color: "var(--text-muted)",
							}}
						>
							Projected Balance:
						</span>
						<span
							style={{
								fontWeight: "600",
								color: totalAssets.plus(total).isNegative()
									? "var(--color-red)"
									: "var(--color-green)",
							}}
						>
							{totalAssets.plus(total).toString()}
						</span>
					</div>
				</div>
			</div>

			{/* Filter Section */}
			<Card
				style={{
					marginBottom: "16px",
					backgroundColor: "var(--background-secondary)",
				}}
			>
				<CardContent style={{ padding: "12px" }}>
					<Box
						display="flex"
						alignItems="center"
						justifyContent="space-between"
						marginBottom="12px"
					>
						<Typography
							variant="h6"
							style={{
								fontSize: "1em",
								color: "var(--text-normal)",
							}}
						>
							Filters{" "}
							{activeFiltersCount > 0 && (
								<Chip
									label={activeFiltersCount}
									size="small"
									style={{ marginLeft: "8px" }}
								/>
							)}
						</Typography>
						<Box>
							<Button
								size="small"
								onClick={() => setShowFilters(!showFilters)}
								style={{
									marginRight: "8px",
									color: "var(--text-normal)",
								}}
							>
								{showFilters ? "Hide" : "Show"} Filters
							</Button>
							{activeFiltersCount > 0 && (
								<Button
									size="small"
									onClick={handleResetFilters}
									style={{ color: "var(--text-muted)" }}
								>
									Clear All
								</Button>
							)}
						</Box>
					</Box>

					<Collapse in={showFilters}>
						<Box
							display="grid"
							gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))"
							gap="12px"
						>
							{/* Search Text */}
							<TextField
								label="Search Items"
								value={filters.searchText}
								onChange={(e) =>
									handleFilterChange(
										"searchText",
										e.target.value
									)
								}
								size="small"
								style={{
									backgroundColor:
										"var(--background-primary)",
								}}
								slotProps={{
									inputLabel: {
										style: { color: "var(--text-muted)" },
									},
								}}
							/>

							{/* Category Filter */}
							<FormControl
								size="small"
								style={{
									backgroundColor:
										"var(--background-primary)",
								}}
							>
								<InputLabel
									style={{ color: "var(--text-muted)" }}
								>
									Category
								</InputLabel>
								<Select
									value={
										filters.selectedCategory?.value || ""
									}
									onChange={(e) => {
										const categoryId = e.target.value
											? new CategoryID(e.target.value)
											: null;
										handleFilterChange(
											"selectedCategory",
											categoryId
										);
										// Reset subcategory when category changes
										handleFilterChange(
											"selectedSubCategory",
											null
										);
									}}
									label="Category"
									sx={{
										"& .MuiSelect-select": {
											color: "var(--text-muted)",
										},
									}}
								>
									<MenuItem value="">All Categories</MenuItem>
									{categories.map((category) => (
										<MenuItem
											key={category.id.value}
											value={category.id.value}
										>
											{category.name.value}
										</MenuItem>
									))}
								</Select>
							</FormControl>

							{/* Subcategory Filter */}
							<FormControl
								size="small"
								style={{
									backgroundColor:
										"var(--background-primary)",
								}}
							>
								<InputLabel
									style={{ color: "var(--text-muted)" }}
								>
									Subcategory
								</InputLabel>
								<Select
									value={
										filters.selectedSubCategory?.value || ""
									}
									onChange={(e) => {
										const subCategoryId = e.target.value
											? new SubCategoryID(e.target.value)
											: null;
										handleFilterChange(
											"selectedSubCategory",
											subCategoryId
										);
									}}
									label="Subcategory"
									disabled={!filters.selectedCategory}
									sx={{
										"& .MuiSelect-select": {
											color: "var(--text-muted)",
										},
									}}
								>
									<MenuItem value="">
										All Subcategories
									</MenuItem>
									{filters.selectedCategory &&
										subCategories
											.filter((sub) =>
												sub.category.equalTo(
													filters.selectedCategory!
												)
											)
											.map((subCategory) => (
												<MenuItem
													key={subCategory.id.value}
													value={subCategory.id.value}
												>
													{subCategory.name.value}
												</MenuItem>
											))}
								</Select>
							</FormControl>

							{/* Account Filter */}
							<FormControl
								size="small"
								style={{
									backgroundColor:
										"var(--background-primary)",
								}}
							>
								<InputLabel
									style={{ color: "var(--text-muted)" }}
								>
									Account
								</InputLabel>
								<Select
									value={filters.selectedAccount?.value || ""}
									onChange={(e) => {
										const accountId = e.target.value
											? new AccountID(e.target.value)
											: null;
										handleFilterChange(
											"selectedAccount",
											accountId
										);
									}}
									label="Account"
									sx={{
										"& .MuiSelect-select": {
											color: "var(--text-muted)",
										},
									}}
								>
									<MenuItem value="">All Accounts</MenuItem>
									{accounts.map((account) => (
										<MenuItem
											key={account.id.value}
											value={account.id.value}
										>
											{account.name.value}
										</MenuItem>
									))}
								</Select>
							</FormControl>

							{/* Operation Type Filter */}
							<FormControl
								size="small"
								style={{
									backgroundColor:
										"var(--background-primary)",
								}}
							>
								<InputLabel
									style={{ color: "var(--text-muted)" }}
								>
									Type
								</InputLabel>
								<Select
									value={filters.selectedOperationType}
									onChange={(e) =>
										handleFilterChange(
											"selectedOperationType",
											e.target.value as
												| "income"
												| "expense"
												| "transfer"
												| "all"
										)
									}
									label="Type"
									sx={{
										"& .MuiSelect-select": {
											color: "var(--text-muted)",
										},
									}}
								>
									<MenuItem value="all">All Types</MenuItem>
									<MenuItem value="income">Income</MenuItem>
									<MenuItem value="expense">Expense</MenuItem>
									<MenuItem value="transfer">
										Transfer
									</MenuItem>
								</Select>
							</FormControl>

							{/* Tags Filter */}
							<FormControl
								size="small"
								style={{
									backgroundColor:
										"var(--background-primary)",
								}}
							>
								<InputLabel
									style={{ color: "var(--text-muted)" }}
								>
									Tags
								</InputLabel>
								<Select
									multiple
									value={filters.selectedTags}
									onChange={(e) => {
										const value = e.target.value;
										handleFilterChange(
											"selectedTags",
											typeof value === "string"
												? value.split(",")
												: value
										);
									}}
									label="Tags"
									renderValue={(selected) => (
										<Box
											sx={{
												display: "flex",
												flexWrap: "wrap",
												gap: 0.5,
											}}
										>
											{selected.map((value) => (
												<Chip
													key={value}
													label={value}
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
									)}
									sx={{
										"& .MuiSelect-select": {
											color: "var(--text-muted)",
										},
									}}
								>
									{availableTags.map((tag) => (
										<MenuItem key={tag} value={tag}>
											{tag}
										</MenuItem>
									))}
								</Select>
							</FormControl>

							{/* Price Range */}
							<Box display="flex" gap="8px" alignItems="center">
								<TextField
									label="Min Price"
									type="number"
									value={filters.priceRange.min || ""}
									onChange={(e) =>
										handleFilterChange("priceRange", {
											...filters.priceRange,
											min: e.target.value
												? Number(e.target.value)
												: null,
										})
									}
									size="small"
									style={{
										backgroundColor:
											"var(--background-primary)",
										flex: 1,
									}}
									slotProps={{
										inputLabel: {
											style: {
												color: "var(--text-muted)",
											},
										},
									}}
								/>
								<TextField
									label="Max Price"
									type="number"
									value={filters.priceRange.max || ""}
									onChange={(e) =>
										handleFilterChange("priceRange", {
											...filters.priceRange,
											max: e.target.value
												? Number(e.target.value)
												: null,
										})
									}
									size="small"
									style={{
										backgroundColor:
											"var(--background-primary)",
										flex: 1,
									}}
									slotProps={{
										inputLabel: {
											style: {
												color: "var(--text-muted)",
											},
										},
									}}
								/>
							</Box>
						</Box>
					</Collapse>
				</CardContent>
			</Card>
			{/* Group items by month */}
			{(() => {
				// Group items by month
				const itemsByMonth = filteredItems.reduce(
					(
						groups,
						{
							item,
							n,
							recurrence,
							accountBalance,
							accountPrevBalance,
							toAccountBalance,
							toAccountPrevBalance,
						},
						index
					) => {
						const monthKey =
							recurrence.date.value.toLocaleDateString(
								"default",
								{
									year: "numeric",
									month: "long",
								}
							);

						if (!groups[monthKey]) {
							groups[monthKey] = [];
						}
						groups[monthKey].push({
							item,
							n,
							recurrence,
							accountBalance,
							accountPrevBalance,
							toAccountBalance,
							toAccountPrevBalance,
							index,
						});
						return groups;
					},
					{} as Record<
						string,
						Array<{
							item: ScheduledItem;
							n: NumberValueObject;
							recurrence: ItemRecurrenceInfo;
							accountBalance: AccountBalance;
							accountPrevBalance: AccountBalance;
							toAccountBalance?: AccountBalance;
							toAccountPrevBalance?: AccountBalance;
							index: number;
						}>
					>
				);

				return Object.entries(itemsByMonth).map(
					([monthKey, monthItems]) => (
						<List key={monthKey} style={{ width: "100%" }}>
							<ListSubheader
								style={{
									backgroundColor:
										"var(--background-primary-alt)",
									color: "var(--text-normal)",
								}}
							>
								{monthKey}
							</ListSubheader>
							{monthItems.map(
								({
									item,
									n,
									recurrence,
									accountBalance,
									accountPrevBalance,
									toAccountBalance,
									toAccountPrevBalance,
									index,
								}) => (
									<div key={item.id.value + index}>
										<CalendarItemsListItem
											key={item.id.value + index}
											item={item}
											n={n}
											recurrence={recurrence}
											accountName={
												getAccountByID(
													recurrence.fromSplits?.[0]
														?.accountId ??
														item.fromSplits[0]
															?.accountId
												)?.name ?? AccountName.empty()
											}
											accountBalance={accountBalance}
											accountPrevBalance={
												accountPrevBalance
											}
											showPanel={showPanel}
											setShowPanel={setShowPanel}
											setSelectedItem={setSelectedItem}
											setAction={setAction}
											updateItems={updateItems}
											accountTypeLookup={
												accountTypeLookup
											}
											getAccountByID={getAccountByID}
										/>
										{item.operation.type.isTransfer() &&
											toAccountBalance &&
											toAccountPrevBalance && (
												<CalendarItemsListItem
													key={
														item.id.value +
														index +
														"-transfer"
													}
													item={item}
													n={n}
													recurrence={recurrence}
													accountName={
														getAccountByID(
															recurrence
																.toSplits?.[0]
																?.accountId ??
																item.toSplits[0]
																	?.accountId
														)?.name ??
														AccountName.empty()
													}
													accountBalance={
														toAccountBalance
													}
													accountPrevBalance={
														toAccountPrevBalance
													}
													showPanel={showPanel}
													setShowPanel={setShowPanel}
													setSelectedItem={
														setSelectedItem
													}
													setAction={setAction}
													updateItems={updateItems}
													accountTypeLookup={
														accountTypeLookup
													}
													getAccountByID={
														getAccountByID
													}
												/>
											)}
									</div>
								)
							)}
						</List>
					)
				);
			})()}
		</div>
	);
};

const CalendarItemsListItem = ({
	item,
	n,
	recurrence,
	accountName,
	accountBalance,
	accountPrevBalance,
	showPanel,
	setShowPanel,
	setSelectedItem,
	setAction,
	updateItems,
	accountTypeLookup,
	getAccountByID,
}: {
	item: ScheduledItem;
	n: NumberValueObject;
	recurrence: ItemRecurrenceInfo;
	accountName: AccountName;
	accountBalance: AccountBalance;
	accountPrevBalance: AccountBalance;
	showPanel:
		| {
				item: {
					recurrence: ItemRecurrenceInfo;
					itemID: ItemID;
				};
				action?: "edit" | "record";
		  }
		| undefined;
	setShowPanel: React.Dispatch<
		React.SetStateAction<
			| {
					item: {
						recurrence: ItemRecurrenceInfo;
						itemID: ItemID;
					};
					action?: "edit" | "record";
			  }
			| undefined
		>
	>;
	setSelectedItem: React.Dispatch<
		React.SetStateAction<
			| {
					recurrence: ItemRecurrenceInfo;
					itemID: ItemID;
			  }
			| undefined
		>
	>;
	setAction: React.Dispatch<
		React.SetStateAction<"edit" | "record" | undefined>
	>;
	updateItems: () => void;
	accountTypeLookup: (id: AccountID) => AccountType;
	getAccountByID: (id: AccountID) => Account | undefined;
}) => {
	const getItemSplitPrice = (item: ScheduledItem): PriceValueObject => {
		// If the recurrence has custom splits, use those
		if (recurrence.fromSplits && recurrence.fromSplits.length > 0) {
			const totalAmount = recurrence.fromSplits.reduce(
				(sum, split) => sum + split.amount.value,
				0
			);
			return new PriceValueObject(totalAmount);
		}
		return item.fromAmount;
	};

	const price = getItemSplitPrice(item);

	// Check if this item is currently selected for recording
	const isSelectedForRecord =
		showPanel?.action === "record" &&
		showPanel.item.itemID.value === item.id.value &&
		showPanel.item.recurrence.date.value.getTime() ===
			recurrence.date.value.getTime();

	// Reusable responsive scheduled item component
	return (
		<>
			<ResponsiveScheduledItem
				item={item}
				recurrence={recurrence}
				accountName={accountName}
				accountBalance={accountBalance}
				accountPrevBalance={accountPrevBalance}
				price={price}
				isSelected={isSelectedForRecord}
				accountTypeLookup={accountTypeLookup}
				remainingDays={recurrence.date.getRemainingDays() ?? 0}
				setAction={setAction}
				setSelectedItem={setSelectedItem}
				context="calendar"
				currentAction={showPanel?.action}
				recurrentContextMenu={{ recurrence, itemID: item.id, n }}
			/>
			{showPanel &&
				showPanel.item.itemID.value === item.id.value &&
				showPanel.item.recurrence.date.value.getTime() ===
					recurrence.date.value.getTime() && (
					<>
						{showPanel.action === "edit" && (
							<EditItemRecurrencePanel
								item={item}
								recurrence={{
									recurrence: showPanel.item.recurrence,
									n: n,
								}}
								onClose={() => {
									setShowPanel(undefined);
									setSelectedItem(undefined);
									setAction(undefined);
								}}
								context="calendar"
								updateItems={updateItems}
							/>
						)}
						{showPanel.action === "record" && (
							<RecordItemPanel
								item={item}
								recurrence={{
									recurrence: showPanel.item.recurrence,
									n: n,
								}}
								onClose={() => {
									setShowPanel(undefined);
									setSelectedItem(undefined);
									setAction(undefined);
								}}
								updateItems={updateItems}
							/>
						)}
					</>
				)}
		</>
	);
};
