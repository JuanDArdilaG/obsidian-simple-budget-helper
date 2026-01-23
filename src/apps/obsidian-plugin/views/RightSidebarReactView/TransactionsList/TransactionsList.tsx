import { motion } from "framer-motion";
import { Plus, RefreshCw, Search } from "lucide-react";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { List, RowComponentProps } from "react-window";
import {
	TransactionsReport,
	TransactionWithAccumulatedBalance,
} from "../../../../../contexts/Reports/domain";
import { Nanoid } from "../../../../../contexts/Shared/domain";
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

export function TransactionsList() {
	const { categoriesWithSubcategories } = useContext(CategoriesContext);
	const {
		isLoading,
		transactions,
		updateTransactions,
		useCases: { recordTransaction, updateTransaction, deleteTransaction },
	} = useContext(TransactionsContext);
	const { accounts } = useContext(AccountsContext);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [editingTransaction, setEditingTransaction] =
		useState<Transaction | null>(null);
	const [deletingTransaction, setDeletingTransaction] =
		useState<Transaction | null>(null);
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	// Filters
	const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
	const [selectedCategory, setSelectedCategory] = useState("");
	const [selectedSubcategory, setSelectedSubcategory] = useState("");

	const transactionsWithAccumulatedBalances = useMemo(() => {
		const transactionsReport = new TransactionsReport(transactions);
		return transactionsReport.withAccumulatedBalance();
	}, [transactions]);

	const handleRefresh = () => {
		setIsRefreshing(true);
		updateTransactions();
		setIsRefreshing(false);
	};

	const handleAddTransaction = async (newTransactions: Transaction[]) => {
		await Promise.all(
			newTransactions.map((t) => recordTransaction.execute(t)),
		);
		setIsAddModalOpen(false);
	};

	const handleEditTransaction = (transaction: Transaction) => {
		setEditingTransaction(transaction);
	};

	const handleUpdateTransaction = async (
		updatedTransactions: Transaction[],
	) => {
		if (!editingTransaction) return;
		await Promise.all(
			updatedTransactions.map((t) => updateTransaction.execute(t)),
		);
		setEditingTransaction(null);
	};

	const handleDeleteTransaction = (transactionId: Nanoid) => {
		if (transactionId) {
			const transaction = transactions.find((t) =>
				t.id.equalTo(transactionId),
			);
			if (!transaction) return;
			setDeletingTransaction(transaction);
		}
	};

	const confirmDelete = async () => {
		if (deletingTransaction) {
			await deleteTransaction.execute(deletingTransaction.id);
			setDeletingTransaction(null);
		}
	};

	// Filter Logic
	const filteredTransactions = useMemo(() => {
		return transactionsWithAccumulatedBalances.filter(
			({ transaction: t }) => {
				const matchesSearch =
					t.store
						?.toLowerCase()
						.includes(searchQuery.toLowerCase()) ||
					t.name.toLowerCase().includes(searchQuery.toLowerCase());
				const matchesAccount =
					selectedAccounts.length === 0 ||
					t.originAccounts.some((a) =>
						selectedAccounts.includes(a.account.id.value),
					) ||
					t.destinationAccounts.some((a) =>
						selectedAccounts.includes(a.account.id.value),
					);
				const matchesCategory =
					!selectedCategory ||
					t.category.id.value === selectedCategory;
				const matchesSubcategory =
					!selectedSubcategory ||
					t.subcategory.id.value === selectedSubcategory;
				return (
					matchesSearch &&
					matchesAccount &&
					matchesCategory &&
					matchesSubcategory
				);
			},
		);
	}, [
		transactionsWithAccumulatedBalances,
		searchQuery,
		selectedAccounts,
		selectedCategory,
		selectedSubcategory,
	]);

	// Group by Date for Rendering
	const groupedTransactions = useMemo(() => {
		const groups: {
			date: string;
			transactions: TransactionWithAccumulatedBalance[];
		}[] = [];
		let currentDate = "";
		filteredTransactions.forEach((transactionWithBalance) => {
			const date = new Date(
				transactionWithBalance.transaction.date,
			).toLocaleDateString(undefined, {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
			});
			if (date !== currentDate) {
				groups.push({
					date,
					transactions: [],
				});
				currentDate = date;
			}
			groups.at(-1)?.transactions.push(transactionWithBalance);
		});
		return groups;
	}, [filteredTransactions]);

	const rowHeight = (
		index: number,
		{
			groupedTransactions,
		}: {
			groupedTransactions: {
				date: string;
				transactions: TransactionWithAccumulatedBalance[];
			}[];
		},
	) => {
		return groupedTransactions[index].transactions.length * 100 + 40;
	};

	const listRef = useRef<{
		readonly element: HTMLDivElement | null;
		scrollToRow(config: {
			align?: "auto" | "center" | "end" | "smart" | "start";
			behavior?: "auto" | "instant" | "smooth";
			index: number;
		}): void;
	}>(null);

	useEffect(() => {
		if (listRef.current) {
			listRef.current.element?.childNodes.forEach((node) => {
				(node as HTMLDivElement).className = "space-y-6";
			});
		}
	}, [listRef]);

	if (isLoading) {
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
							className="absolute! left-3! top-1/2! -translate-y-1/2! text-gray-400!"
							size={18}
						/>
						<input
							type="text"
							placeholder="Search transactions..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full! pl-10! pr-4! py-4! border! border-gray-300! rounded-lg! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500! bg-gray-50! focus:bg-white! transition-colors!"
						/>
					</div>

					<button
						onClick={() => setIsAddModalOpen(true)}
						className="flex! items-center! gap-2! px-4! py-2! bg-indigo-600! text-white! rounded-lg! hover:bg-indigo-700! transition-colors! shadow-sm! font-medium! cursor-pointer!"
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
				accounts={accounts}
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
					<div className="space-y-6">
						<List<TransactionGroupProps>
							rowComponent={TransactionGroup}
							rowCount={groupedTransactions.length}
							rowProps={{
								groupedTransactions,
								onEdit: handleEditTransaction,
								onDelete: handleDeleteTransaction,
							}}
							rowHeight={rowHeight}
							listRef={listRef}
						/>
					</div>
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

			<AddTransactionModal
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				onSave={handleAddTransaction}
				accounts={accounts}
				categoriesWithSubcategories={categoriesWithSubcategories}
			/>
			{/* Edit Transaction Modal */}
			<AddTransactionModal
				isOpen={!!editingTransaction}
				onClose={() => setEditingTransaction(null)}
				onSave={handleUpdateTransaction}
				accounts={accounts}
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

export type TransactionGroupProps = {
	groupedTransactions: {
		date: string;
		transactions: TransactionWithAccumulatedBalance[];
	}[];
	onEdit?: (transaction: Transaction) => void;
	onDelete?: (transactionId: Nanoid) => void;
};

function TransactionGroup({
	index,
	groupedTransactions,
	onEdit,
	onDelete,
}: RowComponentProps<TransactionGroupProps>) {
	const { date, transactions } = useMemo(() => {
		return groupedTransactions[index];
	}, [groupedTransactions, index]);

	return (
		<div key={date}>
			<h3 className="text-sm! font-semibold! text-gray-500! uppercase! tracking-wider! mb-3! sticky! bg-gray-50/95! backdrop-blur-sm! py-2! z-[5]!">
				{date}
			</h3>
			<div className="space-y-2">
				{transactions.map((transactionWithAccumulatedBalance) => (
					<TransactionRow
						key={
							transactionWithAccumulatedBalance.transaction.id
								.value
						}
						transactionWithAccumulatedBalance={
							transactionWithAccumulatedBalance
						}
						onEdit={onEdit}
						onDelete={onDelete}
					/>
				))}
			</div>
		</div>
	);
}
