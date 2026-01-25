import { motion } from "framer-motion";
import {
	ChevronLeft,
	ChevronRight,
	Plus,
	RefreshCw,
	Search,
} from "lucide-react";
import { useContext, useEffect, useMemo, useState } from "react";
import { TransactionWithAccumulatedBalance } from "../../../../../contexts/Reports/domain";
import { Transaction } from "../../../../../contexts/Transactions/domain";
import { LoadingSpinner } from "../../../components/LoadingSpinner";
import {
	AccountsContext,
	CategoriesContext,
	TransactionsContext,
} from "../Contexts";
import { AddTransactionModal } from "./AddTransactionModal";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { TransactionFilters } from "./TransactionFilters";
import { TransactionRow } from "./TransactionRow";

// Pagination constant
const ITEMS_PER_PAGE = 25;

export function TransactionsList() {
	const { accountsMap } = useContext(AccountsContext);
	const { categoriesWithSubcategories, categoriesMap } =
		useContext(CategoriesContext);
	const {
		useCases: {
			recordTransaction,
			updateTransaction,
			deleteTransaction,
			getTransactionsWithPagination,
		},
	} = useContext(TransactionsContext);

	const [isRefreshing, setIsRefreshing] = useState(true);

	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [editingTransaction, setEditingTransaction] =
		useState<Transaction | null>(null);
	const [deletingTransaction, setDeletingTransaction] =
		useState<Transaction | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	// Filters
	const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
	const [selectedCategory, setSelectedCategory] = useState("");
	const [selectedSubcategory, setSelectedSubcategory] = useState("");

	// Reset to page 1 when filters change
	useEffect(() => {
		setCurrentPage(1);
	}, [searchQuery, selectedAccounts, selectedCategory, selectedSubcategory]);

	const handleRefresh = () => {
		setIsRefreshing(true);
	};

	const handleAddTransaction = async (newTransactions: Transaction[]) => {
		await Promise.all(
			newTransactions.map((t) => recordTransaction.execute(t)),
		);
		setCurrentPage(1); // Go to first page to see new transactions
	};

	const handleEditTransaction = (transaction: Transaction) => {
		setEditingTransaction(transaction);
	};

	const handleUpdateTransaction = async (updatedTransaction: Transaction) => {
		if (!editingTransaction) return;
		await updateTransaction.execute(updatedTransaction);
		setEditingTransaction(null);
	};

	const handleDeleteTransaction = (transaction: Transaction) => {
		setDeletingTransaction(transaction);
	};

	const confirmDelete = async () => {
		if (deletingTransaction) {
			await deleteTransaction.execute(deletingTransaction.nanoid);
			setDeletingTransaction(null);
		}
	};

	const [totalCount, setTotalCount] = useState(0);
	const [totalPages, setTotalPages] = useState(0);

	// Filter Logic
	const [
		filteredAndPaginatedTransactions,
		setFilteredAndPaginatedTransactions,
	] = useState<TransactionWithAccumulatedBalance[]>([]);
	useEffect(() => {
		if (!isRefreshing) return;
		getTransactionsWithPagination
			.execute({
				page: currentPage,
				pageSize: ITEMS_PER_PAGE,
				searchQuery,
				selectedAccounts,
				selectedCategory,
				selectedSubcategory,
			})
			.then(({ transactions, totalCount, totalPages }) => {
				setFilteredAndPaginatedTransactions(transactions);
				setTotalCount(totalCount);
				setTotalPages(totalPages);
			})
			.finally(() => {
				setIsRefreshing(false);
			});
	}, [
		getTransactionsWithPagination,
		currentPage,
		searchQuery,
		selectedAccounts,
		selectedCategory,
		selectedSubcategory,
		isRefreshing,
	]);

	// Group by Date for Rendering (only paginated transactions)
	const groupedTransactions = useMemo(() => {
		const groups: {
			date: string;
			transactions: TransactionWithAccumulatedBalance[];
		}[] = [];
		let currentDate = "";
		filteredAndPaginatedTransactions.forEach((twb) => {
			const date = new Date(twb.transaction.date).toLocaleDateString(
				undefined,
				{
					weekday: "long",
					year: "numeric",
					month: "long",
					day: "numeric",
				},
			);
			if (date !== currentDate) {
				groups.push({
					date,
					transactions: [],
				});
				currentDate = date;
			}
			groups.at(-1)?.transactions.push(twb);
		});
		return groups;
	}, [filteredAndPaginatedTransactions]);

	const handlePageChange = (newPage: number) => {
		setCurrentPage(newPage);
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	if (isRefreshing) {
		return <LoadingSpinner />;
	}

	return (
		<div className="min-h-screen bg-gray-50 font-sans">
			{/* Header */}
			<header className="bg-white border-b border-gray-200 sticky top-0 z-20">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
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

					<div className="flex-1 max-w-lg relative">
						<Search
							className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
							size={18}
						/>
						<input
							type="text"
							placeholder="Search transactions..."
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
						<span className="hidden sm:inline">
							Add Transaction
						</span>
					</button>
				</div>
			</header>

			{/* Filters */}
			<TransactionFilters
				accountsMap={accountsMap}
				selectedAccounts={selectedAccounts}
				onAccountChange={(id) => {
					if (selectedAccounts.includes(id)) {
						setSelectedAccounts(
							selectedAccounts.filter((a) => a !== id),
						);
					} else {
						setSelectedAccounts([...selectedAccounts, id]);
					}
				}}
				selectedCategory={selectedCategory}
				onCategoryChange={setSelectedCategory}
				selectedSubcategory={selectedSubcategory}
				onSubcategoryChange={setSelectedSubcategory}
				categoriesWithSubcategories={categoriesWithSubcategories}
				onClearFilters={() => {
					setSelectedAccounts([]);
					setSelectedCategory("");
					setSelectedSubcategory("");
					setSearchQuery("");
				}}
			/>

			{/* List */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				{groupedTransactions.length > 0 ? (
					<>
						{/* Transactions count */}
						<div className="mb-4 text-sm text-gray-600">
							Showing{" "}
							{Math.min(
								ITEMS_PER_PAGE,
								filteredAndPaginatedTransactions.length,
							)}{" "}
							of {totalCount} transactions
						</div>

						<div className="space-y-6">
							{groupedTransactions.map((group, groupIndex) => (
								<div key={group.date}>
									<h3 className="text-sm! font-semibold! text-gray-500! uppercase! tracking-wider! mb-3! sticky! top-44! md:top-32! bg-gray-50/95! backdrop-blur-sm! py-2! z-10!">
										{group.date}
									</h3>
									<div className="space-y-2">
										{group.transactions.map((twb) => (
											<TransactionRow
												key={twb.transaction.id}
												transactionWithAccumulatedBalance={
													twb
												}
												onEdit={handleEditTransaction}
												onDelete={
													handleDeleteTransaction
												}
											/>
										))}
									</div>
								</div>
							))}
						</div>

						{/* Pagination Controls */}
						{totalPages > 1 && (
							<div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
								<div className="flex items-center gap-2">
									<button
										onClick={() =>
											handlePageChange(currentPage - 1)
										}
										disabled={currentPage === 1}
										className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
									>
										<ChevronLeft size={16} />
										<span className="hidden sm:inline">
											Previous
										</span>
									</button>

									<div className="flex items-center gap-1">
										{Array.from(
											{
												length: totalPages,
											},
											(_, i) => i + 1,
										).map((page) => {
											const showPage =
												page === 1 ||
												page === totalPages ||
												(page >= currentPage - 1 &&
													page <= currentPage + 1);
											if (!showPage) {
												if (
													page === currentPage - 2 ||
													page === currentPage + 2
												) {
													return (
														<span
															key={page}
															className="px-2 text-gray-400 hidden sm:inline"
														>
															...
														</span>
													);
												}
												return null;
											}
											return (
												<button
													key={page}
													onClick={() =>
														handlePageChange(page)
													}
													className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
												>
													{page}
												</button>
											);
										})}
									</div>

									<button
										onClick={() =>
											handlePageChange(currentPage + 1)
										}
										disabled={currentPage === totalPages}
										className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
									>
										<span className="hidden sm:inline">
											Next
										</span>
										<ChevronRight size={16} />
									</button>
								</div>

								<div className="text-sm text-gray-600 hidden md:block">
									Page {currentPage} of {totalPages}
								</div>
							</div>
						)}
					</>
				) : (
					<div className="flex flex-col items-center justify-center h-64 text-gray-500">
						<Search size={48} className="mb-4 text-gray-300" />
						<p className="text-lg font-medium">
							No transactions found
						</p>
						<p className="text-sm">
							Try adjusting your filters or search query
						</p>
					</div>
				)}
			</main>

			{/* Add Transaction Modal */}
			<AddTransactionModal
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				onSave={handleAddTransaction}
				accountsMap={accountsMap}
				categoriesMap={categoriesMap}
				categoriesWithSubcategories={categoriesWithSubcategories}
			/>

			{/* Edit Transaction Modal */}
			<AddTransactionModal
				isOpen={!!editingTransaction}
				onClose={() => setEditingTransaction(null)}
				onSave={async (transactions) => {
					// For edit, we only expect one transaction
					if (transactions.length > 0) {
						await handleUpdateTransaction(transactions[0]);
					}
				}}
				accountsMap={accountsMap}
				categoriesMap={categoriesMap}
				categoriesWithSubcategories={categoriesWithSubcategories}
				editTransaction={editingTransaction}
			/>

			{/* Delete Confirmation Modal */}
			<DeleteConfirmationModal
				isOpen={!!deletingTransaction}
				onClose={() => setDeletingTransaction(null)}
				onConfirm={confirmDelete}
				transaction={deletingTransaction}
			/>
		</div>
	);
}
