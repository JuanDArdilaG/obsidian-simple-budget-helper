import { DateValueObject } from "@juandardilag/value-objects";
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
import { EditScheduledTransactionPanel } from "apps/obsidian-plugin/panels/CreateBudgetItemPanel/EditScheduledTransactionPanel";
import { RecordItemPanel } from "apps/obsidian-plugin/panels/RecordItemPanel";
import { AccountBalance, AccountName } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { useContext, useEffect, useMemo, useState } from "react";
import { ItemWithAccumulatedBalance } from "../../../../../../contexts/ScheduledTransactions/application/items-with-accumulated-balance.usecase";
import { ItemRecurrenceInfo } from "../../../../../../contexts/ScheduledTransactions/domain";
import { Nanoid } from "../../../../../../contexts/Shared/domain";
import { ConfirmationModal } from "../../../../components/ConfirmationModal";
import {
	AccountsContext,
	AppContext,
	CategoriesContext,
	ScheduledTransactionsContext,
} from "../../Contexts";
import { CalendarScheduledTransactionsListSummary } from "./CalendarScheduledTransactionsListSummary";

// Filter types
interface FilterState {
	searchText: string;
	selectedCategory: CategoryID | null;
	selectedSubCategory: SubCategoryID | null;
	selectedAccount: Nanoid | null;
	selectedOperationType: "income" | "expense" | "transfer" | "all";
	selectedTags: string[];
	priceRange: {
		min: number | null;
		max: number | null;
	};
}

export const CalendarScheduledTransactionsList = ({
	untilDate,
	selectedItem,
	setSelectedItem,
	filters,
	setFilters,
	showFilters,
	setShowFilters,
}: {
	untilDate: Date;
	selectedItem?: {
		recurrence: ItemRecurrenceInfo;
		scheduleTransactionId: Nanoid;
	};
	setSelectedItem: React.Dispatch<
		React.SetStateAction<
			| {
					recurrence: ItemRecurrenceInfo;
					scheduleTransactionId: Nanoid;
			  }
			| undefined
		>
	>;
	filters: FilterState;
	setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
	showFilters: boolean;
	setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
	const logger = useLogger("CalendarScheduledTransactionsList");
	const { getAccountByID, accounts } = useContext(AccountsContext);
	const { categories, subCategories } = useContext(CategoriesContext);
	const [refreshItems, setRefreshItems] = useState(true);

	const {
		useCases: { itemsWithAccumulatedBalanceUseCase },
	} = useContext(ScheduledTransactionsContext);

	const [showPanel, setShowPanel] = useState<{
		item: {
			recurrence: ItemRecurrenceInfo;
			scheduleTransactionId: Nanoid;
		};
		action?: "edit" | "record";
	}>();

	const [action, setAction] = useState<"edit" | "record">();

	const [itemsWithAccountsBalance, setItemsWithAccountsBalance] = useState<
		ItemWithAccumulatedBalance[]
	>([]);

	useEffect(() => {
		if (!refreshItems) return;
		setRefreshItems(false);
		itemsWithAccumulatedBalanceUseCase
			.execute(new DateValueObject(untilDate))
			.then((items) => setItemsWithAccountsBalance(items));
	}, [untilDate, refreshItems]);

	useEffect(() => {
		itemsWithAccumulatedBalanceUseCase
			.execute(new DateValueObject(untilDate))
			.then((items) => setItemsWithAccountsBalance(items));
	}, [untilDate]);

	// Filter the items based on current filters
	const filteredItems = useMemo(() => {
		return itemsWithAccountsBalance.filter(({ recurrence }) => {
			// Text search
			if (
				filters.searchText &&
				!recurrence.name.value
					.toLowerCase()
					.includes(filters.searchText.toLowerCase())
			) {
				return false;
			}

			// Category filter
			if (
				filters.selectedCategory &&
				!recurrence.category.category.id.equalTo(
					filters.selectedCategory,
				)
			) {
				return false;
			}

			// Subcategory filter
			if (
				filters.selectedSubCategory &&
				!recurrence.category.subCategory.id.equalTo(
					filters.selectedSubCategory,
				)
			) {
				return false;
			}

			// Account filter
			if (filters.selectedAccount) {
				const hasFromAccount = recurrence.originAccounts.some((split) =>
					split.accountId.equalTo(filters.selectedAccount!),
				);
				const hasToAccount = recurrence.destinationAccounts.some(
					(split) =>
						split.accountId.equalTo(filters.selectedAccount!),
				);
				if (!hasFromAccount && !hasToAccount) {
					return false;
				}
			}

			// Operation type filter
			if (
				filters.selectedOperationType !== "all" &&
				recurrence.operation.type.value !==
					filters.selectedOperationType
			) {
				return false;
			}

			// Tags filter
			if (filters.selectedTags.length > 0) {
				const itemTags = recurrence.tags?.toArray() ?? [];
				const hasSelectedTag = filters.selectedTags.some(
					(selectedTag) => itemTags.includes(selectedTag),
				);
				if (!hasSelectedTag) {
					return false;
				}
			}

			// Price range filter - use the same logic as getItemSplitPrice
			const accountId =
				recurrence.originAccounts?.[0]?.accountId ??
				recurrence.originAccounts[0]?.accountId;
			const split = recurrence.originAccounts.find(
				(split) => split.accountId.value === accountId.value,
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

	// Get all available tags from items
	const availableTags = useMemo(() => {
		const tagSet = new Set<string>();
		itemsWithAccountsBalance.forEach(({ recurrence }) => {
			recurrence.tags?.toArray().forEach((tag) => tagSet.add(tag));
		});
		return Array.from(tagSet).toSorted((a, b) => a.localeCompare(b));
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

	// Filter handlers
	const handleFilterChange = <K extends keyof FilterState>(
		key: K,
		value: FilterState[K],
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
			<CalendarScheduledTransactionsListSummary
				date={untilDate}
				recurrences={filteredItems.map((item) => item.recurrence)}
			/>

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
										e.target.value,
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
											categoryId,
										);
										// Reset subcategory when category changes
										handleFilterChange(
											"selectedSubCategory",
											null,
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
											subCategoryId,
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
													filters.selectedCategory!,
												),
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
											? new Nanoid(e.target.value)
											: null;
										handleFilterChange(
											"selectedAccount",
											accountId,
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
											e.target.value,
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
												: value,
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
							recurrence,
							accountBalance,
							accountPrevBalance,
							toAccountBalance,
							toAccountPrevBalance,
						},
						index,
					) => {
						const monthKey =
							recurrence.date.value.toLocaleDateString(
								"default",
								{
									year: "numeric",
									month: "long",
								},
							);

						if (!groups[monthKey]) {
							groups[monthKey] = [];
						}
						groups[monthKey].push({
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
							recurrence: ItemRecurrenceInfo;
							accountBalance: AccountBalance;
							accountPrevBalance: AccountBalance;
							toAccountBalance?: AccountBalance;
							toAccountPrevBalance?: AccountBalance;
							index: number;
						}>
					>,
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
									recurrence,
									accountBalance,
									accountPrevBalance,
									toAccountBalance,
									toAccountPrevBalance,
									index,
								}) => (
									<div
										key={
											recurrence.date.value.getTime() +
											index
										}
									>
										<CalendarItemsListItem
											key={
												recurrence.date.value.getTime() +
												index
											}
											recurrence={recurrence}
											accountName={
												getAccountByID(
													recurrence
														.originAccounts?.[0]
														?.accountId ??
														recurrence
															.originAccounts[0]
															?.accountId,
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
											updateItems={() =>
												setRefreshItems(true)
											}
										/>
										{recurrence.operation.type.isTransfer() &&
											toAccountBalance &&
											toAccountPrevBalance && (
												<CalendarItemsListItem
													key={
														recurrence
															.scheduledTransactionId
															.value +
														index +
														"-transfer"
													}
													recurrence={recurrence}
													accountName={
														getAccountByID(
															recurrence
																.destinationAccounts?.[0]
																?.accountId ??
																recurrence
																	.destinationAccounts[0]
																	?.accountId,
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
													updateItems={() =>
														setRefreshItems(true)
													}
												/>
											)}
									</div>
								),
							)}
						</List>
					),
				);
			})()}
		</div>
	);
};

const CalendarItemsListItem = ({
	recurrence,
	accountName,
	accountBalance,
	accountPrevBalance,
	showPanel,
	setShowPanel,
	setSelectedItem,
	setAction,
	updateItems,
}: {
	updateItems: () => void;
	recurrence: ItemRecurrenceInfo;
	accountName: AccountName;
	accountBalance: AccountBalance;
	accountPrevBalance: AccountBalance;
	showPanel:
		| {
				item: {
					recurrence: ItemRecurrenceInfo;
					scheduleTransactionId: Nanoid;
				};
				action?: "edit" | "record";
		  }
		| undefined;
	setShowPanel: React.Dispatch<
		React.SetStateAction<
			| {
					item: {
						recurrence: ItemRecurrenceInfo;
						scheduleTransactionId: Nanoid;
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
					scheduleTransactionId: Nanoid;
			  }
			| undefined
		>
	>;
	setAction: React.Dispatch<
		React.SetStateAction<"edit" | "record" | undefined>
	>;
}) => {
	const { plugin } = useContext(AppContext);
	const {
		scheduledItems,
		useCases: { deleteItemRecurrence },
	} = useContext(ScheduledTransactionsContext);
	// Check if this item is currently selected for recording
	const isSelectedForRecord = useMemo(() => {
		if (!showPanel) return false;
		console.log("Checking selection for record:", {
			showPanel,
			recurrence,
		});
		return (
			showPanel?.action === "record" &&
			showPanel.item.recurrence.scheduledTransactionId.equalTo(
				recurrence.scheduledTransactionId,
			) &&
			showPanel.item.recurrence.date.value.getTime() ===
				recurrence.date.value.getTime()
		);
	}, [showPanel, recurrence]);

	const scheduledTransaction = useMemo(
		() =>
			scheduledItems.find((item) =>
				item.id.equalTo(recurrence.scheduledTransactionId),
			),
		[scheduledItems, recurrence],
	);

	if (!scheduledTransaction) {
		return null;
	}

	// Reusable responsive scheduled item component
	return (
		<>
			<ResponsiveScheduledItem
				scheduleTransaction={scheduledTransaction}
				recurrence={recurrence}
				accountName={accountName}
				accountBalance={accountBalance}
				accountPrevBalance={accountPrevBalance}
				price={recurrence.originAmount}
				isSelected={isSelectedForRecord}
				setAction={setAction}
				setSelectedItem={setSelectedItem}
				context="calendar"
				currentAction={showPanel?.action}
				recurrentContextMenu={{
					recurrence,
					scheduleTransactionId: scheduledTransaction.id,
				}}
				handleEdit={async () => {
					setAction((prev) => (prev === "edit" ? undefined : "edit"));
					setSelectedItem((prev) =>
						prev
							? undefined
							: {
									recurrence,
									scheduleTransactionId:
										scheduledTransaction.id,
								},
					);
				}}
				handleDelete={async () => {
					new ConfirmationModal(
						plugin.app,
						async (confirmed: boolean) => {
							if (!confirmed) return;
							console.log("Deleting recurrence:", {
								scheduledTransaction,
								recurrence,
								n: recurrence.occurrenceIndex,
							});
							await deleteItemRecurrence.execute({
								id: scheduledTransaction.id,
								n: recurrence.occurrenceIndex,
							});
							updateItems();
						},
					).open();
				}}
			/>
			{showPanel &&
				showPanel.item.scheduleTransactionId.equalTo(
					scheduledTransaction.id,
				) &&
				showPanel.item.recurrence.date.value.getTime() ===
					recurrence.date.value.getTime() && (
					<>
						{showPanel.action === "edit" && (
							<EditScheduledTransactionPanel
								scheduledTransaction={scheduledTransaction}
								recurrence={showPanel.item.recurrence}
								onClose={() => {
									setShowPanel(undefined);
									setSelectedItem(undefined);
									setAction(undefined);
								}}
								updateItems={updateItems}
								initialScope="single"
							/>
						)}
						{showPanel.action === "record" && (
							<RecordItemPanel
								recurrence={showPanel.item.recurrence}
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
