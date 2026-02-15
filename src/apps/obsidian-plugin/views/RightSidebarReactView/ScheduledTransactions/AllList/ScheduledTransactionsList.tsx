import { PriceValueObject } from "@juandardilag/value-objects";
import { motion } from "framer-motion";
import {
	ArrowDown,
	ArrowUp,
	Calendar,
	List,
	Plus,
	RefreshCw,
	Search,
} from "lucide-react";
import { useContext, useEffect, useMemo, useState } from "react";
import { ScheduledMonthlyReport } from "../../../../../../contexts/Reports/domain";
import {
	ItemRecurrenceInfo,
	ScheduledTransaction,
} from "../../../../../../contexts/ScheduledTransactions/domain";
import { AccountSplit } from "../../../../../../contexts/Transactions/domain/account-split.valueobject";
import { LoadingSpinner } from "../../../../components/LoadingSpinner";
import {
	AccountsContext,
	CategoriesContext,
	ScheduledTransactionsContext,
} from "../../Contexts";
import {
	MonthlySummaryData,
	ScheduledMonthlySummary,
} from "../../Reports/MonthlyProjection/ScheduledMonthlySummary";
import { ScheduledCalendarList } from "../CalendarList/ScheduledCalendarList";
import { EditScheduledTransactionModal } from "../EditScheduledTransactionModal";
import { ScheduledItemRow } from "../ScheduledItemRow";
import { AddScheduledTransactionModal } from "./AddScheduledTransactionModal";
import { DeleteScheduledTransactionModal } from "./DeleteScheduledTransactionModal";

type ViewMode = "list" | "calendar";
type SortField = "nextOccurrence" | "name";
type SortDirection = "asc" | "desc";

export function ScheduledTransactionsList() {
	const {
		scheduledItems,
		updateScheduledTransactions,
		useCases: {
			createScheduledItem,
			editScheduledTransaction,
			deleteScheduledTransaction,
			modifyNItemRecurrence,
			nextPendingOccurrenceUseCase,
			nextMonthExpensesUseCase,
		},
	} = useContext(ScheduledTransactionsContext);
	const { accountsMap } = useContext(AccountsContext);

	const [nextMonthExpenses, setNextMonthExpenses] = useState<
		{ info: ItemRecurrenceInfo; monthAmount: PriceValueObject }[]
	>([]);

	useEffect(() => {
		nextMonthExpensesUseCase.execute().then((recurrences) => {
			setNextMonthExpenses(recurrences);
		});
	}, [scheduledItems]);

	const scheduledReport = useMemo(() => {
		const report = new ScheduledMonthlyReport(scheduledItems, accountsMap);
		return report;
	}, [scheduledItems, accountsMap]);

	const monthlySummaryData = useMemo<MonthlySummaryData>(() => {
		return {
			savingsForNextMonth: {
				total: nextMonthExpenses.reduce(
					(acc, curr) => acc + curr.monthAmount.toNumber(),
					0,
				),
				transactions:
					scheduledItems.length > 0
						? nextMonthExpenses.map((e) => {
								const scheduledTransaction =
									scheduledItems.find(
										(t) =>
											t.nanoid.value ===
											e.info.scheduledTransactionId.value,
									);
								if (!scheduledTransaction) {
									throw new Error(
										`Scheduled transaction with ID ${e.info.scheduledTransactionId} not found`,
									);
								}
								return scheduledTransaction;
							})
						: [],
			},
			totalIncomePerMonth: {
				total: scheduledReport
					.onlyIncomes()
					.scheduledTransactionsWithAccounts.reduce(
						(acc, { scheduledTransaction, account, toAccount }) =>
							acc +
							scheduledTransaction
								.getPricePerMonthWithAccountTypes(
									account.type.value,
									toAccount?.type.value,
								)
								.toNumber(),
						0,
					),
				transactions:
					scheduledReport.onlyIncomes().scheduledTransactions,
			},
			totalExpensesPerMonth: {
				total: scheduledReport
					.onlyExpenses()
					.scheduledTransactionsWithAccounts.reduce(
						(acc, { scheduledTransaction, account, toAccount }) =>
							acc +
							scheduledTransaction
								.getPricePerMonthWithAccountTypes(
									account.type.value,
									toAccount?.type.value,
								)
								.toNumber(),
						0,
					),
				transactions:
					scheduledReport.onlyExpenses().scheduledTransactions,
			},
			longTermExpensesPerMonth: {
				total: scheduledReport
					.onlyExpenses()
					.onlyInfiniteRecurrent()
					.scheduledTransactionsWithAccounts.reduce(
						(acc, { scheduledTransaction, account, toAccount }) =>
							acc +
							scheduledTransaction
								.getPricePerMonthWithAccountTypes(
									account.type.value,
									toAccount?.type.value,
								)
								.toNumber(),
						0,
					),
				transactions: scheduledReport
					.onlyExpenses()
					.onlyInfiniteRecurrent().scheduledTransactions,
			},
			shortTermExpensesPerMonth: {
				total: scheduledReport
					.onlyExpenses()
					.onlyFiniteRecurrent()
					.scheduledTransactionsWithAccounts.reduce(
						(acc, { scheduledTransaction, account, toAccount }) =>
							acc +
							scheduledTransaction
								.getPricePerMonthWithAccountTypes(
									account.type.value,
									toAccount?.type.value,
								)
								.toNumber(),
						0,
					),
				transactions: scheduledReport
					.onlyExpenses()
					.onlyFiniteRecurrent().scheduledTransactions,
			},
			totalPerMonth: {
				total: scheduledReport.scheduledTransactionsWithAccounts.reduce(
					(acc, { scheduledTransaction, account, toAccount }) =>
						acc +
						scheduledTransaction
							.getPricePerMonthWithAccountTypes(
								account.type.value,
								toAccount?.type.value,
							)
							.toNumber(),
					0,
				),
				transactions: scheduledReport.scheduledTransactions,
			},
		};
	}, [scheduledReport, nextMonthExpenses]);

	const { categoriesWithSubcategories } = useContext(CategoriesContext);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortField, setSortField] = useState<SortField>("nextOccurrence");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [editingTransaction, setEditingTransaction] =
		useState<ScheduledTransaction | null>(null);
	const [deletingTransaction, setDeletingTransaction] =
		useState<ScheduledTransaction | null>(null);
	const [nextPendingOccurrences, setNextPendingOccurrences] = useState<
		Record<string, ItemRecurrenceInfo>
	>({});

	useEffect(() => {
		Promise.all(
			scheduledItems.map(async (item) => {
				const occurrence = await nextPendingOccurrenceUseCase.execute(
					item.nanoid,
				);
				if (occurrence) {
					return { [item.id]: occurrence };
				}
			}),
		).then((occurrences) => {
			setNextPendingOccurrences(Object.assign({}, ...occurrences));
		});
	}, [scheduledItems, nextPendingOccurrenceUseCase]);

	const [viewMode, setViewMode] = useState<ViewMode>("calendar");

	useEffect(() => {
		if (isRefreshing) {
			// Reset refreshing state after a short delay to allow data to load
			const timer = setTimeout(() => {
				setIsRefreshing(false);
			}, 500);
			return () => clearTimeout(timer);
		}
	}, [isRefreshing, scheduledItems]);

	const handleEditSingle = async (
		recurrence: ItemRecurrenceInfo,
		updates: {
			date: Date;
			fromSplits: AccountSplit[];
			toSplits: AccountSplit[];
		},
	) => {
		console.log("handleEditSingle called:", {
			recurrence,
			updates,
		});
		try {
			await modifyNItemRecurrence.execute({
				scheduledItemId: recurrence.scheduledTransactionId,
				occurrenceIndex: recurrence.occurrenceIndex,
				date: updates.date,
				fromSplits: updates.fromSplits,
				toSplits: updates.toSplits,
			});
			console.log("modifyNItemRecurrence.execute completed successfully");
		} catch (error) {
			console.error("Error in modifyNItemRecurrence.execute:", error);
			throw error;
		}
		updateScheduledTransactions();
	};

	const handleRefresh = () => {
		setIsRefreshing(true);
		updateScheduledTransactions();
	};

	const handleAddTransaction = async (
		newTransaction: ScheduledTransaction,
	) => {
		await createScheduledItem.execute(newTransaction);
	};

	const handleEdit = (transaction: ScheduledTransaction) => {
		setEditingTransaction(transaction);
	};

	const handleUpdateTransaction = async (
		updatedTransaction: ScheduledTransaction,
	) => {
		try {
			await editScheduledTransaction.execute({
				scheduledTransaction: updatedTransaction,
			});
		} catch (error) {
			console.error("Error updating transaction:", error);
			throw error;
		}

		updateScheduledTransactions();
		setEditingTransaction(null);
	};

	const handleDelete = (transaction: ScheduledTransaction) => {
		setDeletingTransaction(transaction);
	};

	const confirmDelete = async () => {
		if (deletingTransaction) {
			await deleteScheduledTransaction.execute(
				deletingTransaction.nanoid,
			);
			setDeletingTransaction(null);
			updateScheduledTransactions();
		}
	};

	const handleToggleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
		} else {
			setSortField(field);
			setSortDirection("asc");
		}
	};

	// Filter and sort transactions
	const filteredAndSortedTransactions = useMemo(() => {
		const filtered = scheduledItems.filter((t) => {
			const matchesSearch =
				t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.store?.toLowerCase().includes(searchQuery.toLowerCase());
			return matchesSearch;
		});

		// Sort by next occurrence date (soonest first)
		const sorted = filtered.toSorted((a, b) => {
			let comparison = 0;
			if (sortField === "nextOccurrence") {
				const nextA = nextPendingOccurrences[a.id]?.date || new Date(0);
				const nextB = nextPendingOccurrences[b.id]?.date || new Date(0);
				comparison = nextA.getTime() - nextB.getTime();
			} else if (sortField === "name") {
				comparison = a.name.localeCompare(b.name.value);
			}
			return sortDirection === "asc" ? comparison : -comparison;
		});

		return sorted;
	}, [
		scheduledItems,
		searchQuery,
		nextPendingOccurrences,
		sortField,
		sortDirection,
	]);

	if (isRefreshing) {
		return <LoadingSpinner />;
	}

	return (
		<div className="min-h-screen! bg-gray-50! font-sans!">
			{/* Header */}
			<header className="bg-white! border-b! border-gray-200! sticky! top-0! z-20!">
				<div className="max-w-7xl! mx-auto! px-4! sm:px-6! lg:px-8! h-16! flex! items-center! justify-between! gap-4!">
					<button
						onClick={handleRefresh}
						disabled={isRefreshing}
						className="p-2! text-gray-400! hover:text-indigo-600! hover:bg-gray-100! rounded-full! transition-colors!"
					>
						<motion.div
							animate={{
								rotate: isRefreshing ? 360 : 0,
							}}
							transition={{
								duration: 1,
								repeat: isRefreshing ? Infinity : 0,
								ease: "linear",
							}}
						>
							<RefreshCw size={20} />
						</motion.div>
					</button>

					<div className="flex-1! max-w-lg! relative!">
						<Search
							className="absolute! left-3! top-1/2! -translate-y-1/2! text-gray-400!"
							size={18}
						/>
						<input
							type="text"
							placeholder="Search scheduled transactions..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full! pl-10! pr-4! py-2! border! border-gray-300! rounded-lg! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500! bg-gray-50! focus:bg-white! transition-colors!"
						/>
					</div>

					<button
						onClick={() => setIsAddModalOpen(true)}
						className="flex! items-center! gap-2! px-4! py-2! bg-indigo-600! text-white! rounded-lg! hover:bg-indigo-700! transition-colors! shadow-sm! font-medium!"
					>
						<Plus size={18} />
						<span className="hidden! sm:inline!">
							Add Scheduled
						</span>
					</button>
				</div>
			</header>{" "}
			{/* View Mode Tabs */}
			<div className="bg-white! border-b! border-gray-200! sticky! top-16! z-10!">
				<div className="max-w-7xl! mx-auto! px-4! sm:px-6! lg:px-8!">
					<div className="flex! gap-1!">
						<button
							onClick={() => setViewMode("calendar")}
							className={`flex! items-center! gap-2! px-4! py-3! border-b-2! transition-all! font-medium! text-sm! ${viewMode === "calendar" ? "border-indigo-600! text-indigo-600!" : "border-transparent! text-gray-600! hover:text-gray-900! hover:border-gray-300!"}`}
						>
							<Calendar size={18} />
							<span>Calendar View</span>
						</button>
						<button
							onClick={() => setViewMode("list")}
							className={`flex! items-center! gap-2! px-4! py-3! border-b-2! transition-all! font-medium! text-sm! ${viewMode === "list" ? "border-indigo-600! text-indigo-600!" : "border-transparent! text-gray-600! hover:text-gray-900! hover:border-gray-300!"}`}
						>
							<List size={18} />
							<span>Scheduled List</span>
						</button>
					</div>
				</div>
			</div>
			{/* Content Area - Conditionally render based on view mode */}
			{viewMode === "calendar" ? (
				<ScheduledCalendarList
					accountsMap={accountsMap}
					isRefreshing={isRefreshing}
					onRefresh={handleRefresh}
					onSaveSingle={handleEditSingle}
					categories={categoriesWithSubcategories}
					onSaveAll={handleUpdateTransaction}
				/>
			) : (
				<>
					<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
						{filteredAndSortedTransactions.length > 0 ? (
							<>
								<div className="mb-4 flex items-center justify-between">
									<div className="text-sm text-gray-600">
										{filteredAndSortedTransactions.length}{" "}
										scheduled transaction
										{filteredAndSortedTransactions.length ===
										1
											? ""
											: "s"}
									</div>
									<div className="flex items-center gap-1">
										<span className="text-xs text-gray-500 mr-1.5">
											Sort by:
										</span>
										<button
											onClick={() =>
												handleToggleSort(
													"nextOccurrence",
												)
											}
											className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${sortField === "nextOccurrence" ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-100"}`}
										>
											Next Date
											{sortField === "nextOccurrence" &&
												(sortDirection === "asc" ? (
													<ArrowUp
														size={12}
														className="text-indigo-500"
													/>
												) : (
													<ArrowDown
														size={12}
														className="text-indigo-500"
													/>
												))}
										</button>
										<button
											onClick={() =>
												handleToggleSort("name")
											}
											className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${sortField === "name" ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-100"}`}
										>
											Name
											{sortField === "name" &&
												(sortDirection === "asc" ? (
													<ArrowUp
														size={12}
														className="text-indigo-500"
													/>
												) : (
													<ArrowDown
														size={12}
														className="text-indigo-500"
													/>
												))}
										</button>
									</div>
								</div>

								<div className="space-y-2!">
									{filteredAndSortedTransactions.map(
										(transaction, index) => (
											<motion.div
												key={transaction.id}
												initial={{
													opacity: 0,
													y: 20,
												}}
												animate={{
													opacity: 1,
													y: 0,
												}}
												transition={{
													delay: index * 0.05,
												}}
											>
												<ScheduledItemRow
													item={{
														type: "scheduled",
														data: transaction,
													}}
													accountsMap={accountsMap}
													onEditScheduled={handleEdit}
													onDeleteScheduled={
														handleDelete
													}
													daysUntilNext={nextPendingOccurrences[
														transaction.id
													]?.date.getRemainingDays()}
													monthlyTotal={
														transaction
															.pricePerMonth.value
													}
												/>
											</motion.div>
										),
									)}
								</div>
							</>
						) : (
							<div className="flex! flex-col! items-center! justify-center! h-64! text-gray-500!">
								<Calendar
									size={48}
									className="mb-4! text-gray-300!"
								/>
								<p className="text-lg! font-medium!">
									No scheduled transactions found
								</p>
								<p className="text-sm!">
									{searchQuery
										? "Try adjusting your search query"
										: "Create your first scheduled transaction"}
								</p>
							</div>
						)}
					</main>

					{/* Monthly Summary - Only show in list view */}
					{filteredAndSortedTransactions.length > 0 && (
						<ScheduledMonthlySummary data={monthlySummaryData} />
					)}
				</>
			)}
			{/* Add Transaction Modal */}
			<AddScheduledTransactionModal
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				onSave={handleAddTransaction}
				accountsMap={accountsMap}
				categoriesWithSubcategoriesMap={categoriesWithSubcategories}
			/>
			{/* Edit Transaction Modal */}
			<EditScheduledTransactionModal
				isOpen={!!editingTransaction}
				onClose={() => setEditingTransaction(null)}
				onEditAll={handleUpdateTransaction}
				onEditSingle={handleEditSingle}
				accountsMap={accountsMap}
				categories={categoriesWithSubcategories}
				recurrence={
					nextPendingOccurrences[editingTransaction?.id || ""]
				}
				scheduledTransaction={editingTransaction}
				initialEditMode="all"
			/>
			{/* Delete Confirmation Modal */}
			<DeleteScheduledTransactionModal
				isOpen={!!deletingTransaction}
				onClose={() => setDeletingTransaction(null)}
				onConfirm={confirmDelete}
				transaction={deletingTransaction}
			/>
		</div>
	);
}
