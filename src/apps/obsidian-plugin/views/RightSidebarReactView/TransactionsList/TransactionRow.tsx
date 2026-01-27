import { motion } from "framer-motion";
import {
	ArrowDownLeft,
	ArrowUpRight,
	Check,
	DollarSign,
	Pencil,
	RefreshCw,
	Trash2,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import { useContext, useMemo, useState } from "react";
import { TransactionWithAccumulatedBalance } from "../../../../../contexts/Reports/domain";
import {
	AccountSplit,
	Transaction,
	TransactionAmount,
} from "../../../../../contexts/Transactions/domain";
import { AccountsContext, CategoriesContext } from "../Contexts";

export interface TransactionRowProps {
	transactionWithAccumulatedBalance: TransactionWithAccumulatedBalance;
	onEdit?: (transaction: Transaction) => void;
	onDelete?: (transaction: Transaction) => void;
	isSelected?: boolean;
	onToggleSelect?: (transaction: Transaction) => void;
}

export function TransactionRow({
	transactionWithAccumulatedBalance,
	onEdit,
	onDelete,
	isSelected = false,
	onToggleSelect,
}: Readonly<TransactionRowProps>) {
	const { transaction } = useMemo(
		() => transactionWithAccumulatedBalance,
		[transactionWithAccumulatedBalance],
	);
	const { getAccountByID } = useContext(AccountsContext);
	const { getCategoryByID, getSubCategoryByID } =
		useContext(CategoriesContext);
	const transactionCategory = useMemo(
		() => getCategoryByID(transaction.category),
		[getCategoryByID, transaction.category],
	);
	const transactionSubcategory = useMemo(
		() => getSubCategoryByID(transaction.subcategory),
		[getSubCategoryByID, transaction.subcategory],
	);
	const [isHovered, setIsHovered] = useState(false);

	const handleClick = () => {
		if (onToggleSelect) {
			onToggleSelect(transaction);
		}
	};

	const getOperationStyles = (operation: string) => {
		switch (operation) {
			case "expense":
				return {
					bg: "bg-rose-50",
					text: "text-rose-600",
					border: "border-rose-100",
					icon: <ArrowUpRight className="w-5 h-5" />,
					label: "Expense",
				};
			case "income":
				return {
					bg: "bg-emerald-50",
					text: "text-emerald-600",
					border: "border-emerald-100",
					icon: <ArrowDownLeft className="w-5 h-5" />,
					label: "Income",
				};
			case "transfer":
				return {
					bg: "bg-blue-50",
					text: "text-blue-600",
					border: "border-blue-100",
					icon: <RefreshCw className="w-5 h-5" />,
					label: "Transfer",
				};
			default:
				return {
					bg: "bg-gray-50",
					text: "text-gray-600",
					border: "border-gray-100",
					icon: <DollarSign className="w-5 h-5" />,
					label: "Transaction",
				};
		}
	};
	const styles = useMemo(
		() =>
			getOperationStyles(
				transactionWithAccumulatedBalance.transaction.operation.value,
			),
		[transactionWithAccumulatedBalance.transaction.operation.value],
	);

	// Determine if we have multiple splits
	const hasMultipleSplits = useMemo(
		() =>
			transaction.operation.isTransfer()
				? transaction.originAccounts.length +
						(transaction.destinationAccounts?.length || 0) >
					2
				: transaction.originAccounts.length > 1,
		[transaction],
	);

	const renderAccountSplit = (
		twb: TransactionWithAccumulatedBalance,
		split: AccountSplit,
		isFrom: boolean,
	) => {
		const balances = twb.originAccounts.find(
			(s) => s.account.id === split.accountId.value,
		);
		return (
			<div key={twb.transaction.id} className="mt-1 pl-8">
				{/* Account name - full width on mobile */}
				<div className="flex items-center justify-between mb-1">
					<span className="font-medium text-gray-600 text-xs truncate pr-2">
						{getAccountByID(split.accountId)?.name ||
							"Unknown Account"}
					</span>
					{/* Transaction amount - only show if multiple splits */}
					{hasMultipleSplits && (
						<div className="flex items-center gap-1 flex-shrink-0">
							{isFrom ? (
								<TrendingDown className="w-3 h-3 text-rose-500" />
							) : (
								<TrendingUp className="w-3 h-3 text-emerald-500" />
							)}
							<span
								className={`font-bold text-xs ${isFrom ? "text-rose-600" : "text-emerald-600"}`}
							>
								{isFrom ? "-" : "+"}
								{split.amount.toString()}
							</span>
						</div>
					)}
				</div>

				{/* Balance info - stacked on mobile, inline on desktop */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-1 sm:gap-3 text-[10px]">
					<div className="flex items-center gap-1 text-gray-500">
						<span className="text-gray-400">Prev:</span>
						<span className="font-medium">
							{new TransactionAmount(
								balances?.prevBalance ?? 0,
							).toString()}
						</span>
					</div>
					<div className="flex items-center gap-1 text-gray-700">
						<span className="text-gray-400">New:</span>
						<span className="font-semibold">
							{new TransactionAmount(
								balances?.balance ?? 0,
							).toString()}
						</span>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onClick={handleClick}
			className={`p-4 rounded-lg border ${styles.border} ${styles.bg} mb-3 transition-all hover:shadow-md relative group ${onToggleSelect ? "cursor-pointer" : ""} ${isSelected ? "ring-2 ring-indigo-500 ring-offset-2" : ""}`}
		>
			{/* Selection Indicator */}
			{onToggleSelect && (
				<div className="absolute top-4 left-4">
					<div
						className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? "bg-indigo-600 border-indigo-600" : "bg-white border-gray-300 group-hover:border-indigo-400"}`}
					>
						{isSelected && (
							<Check size={14} className="text-white" />
						)}
					</div>
				</div>
			)}
			{/* Desktop Action Buttons - hover animation */}
			<motion.div
				initial={{
					opacity: 0,
					x: 10,
				}}
				animate={{
					opacity: isHovered ? 1 : 0,
					x: isHovered ? 0 : 10,
				}}
				transition={{
					duration: 0.2,
				}}
				className="hidden md:flex absolute top-4 right-4 items-center gap-2"
			>
				{onEdit && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							onEdit(transaction);
						}}
						className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm"
						aria-label="Edit transaction"
					>
						<Pencil size={16} />
					</button>
				)}
				{onDelete && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							onDelete(transaction);
						}}
						className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-all shadow-sm"
						aria-label="Delete transaction"
					>
						<Trash2 size={16} />
					</button>
				)}
			</motion.div>

			{/* Main Row */}
			<div className="flex items-start justify-between mb-2 gap-2">
				<div
					className={`flex items-start gap-3 flex-1 md:pr-24 min-w-0 ${onToggleSelect ? "pl-7" : ""}`}
				>
					<div
						className={`p-2 rounded-full bg-white ${styles.text} shadow-sm mt-1 flex-shrink-0`}
					>
						{styles.icon}
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2">
							<h3 className="font-semibold! text-gray-900! truncate!">
								{transaction.name}
							</h3>
						</div>
						<div className="flex items-center gap-2 mt-0.5">
							<span className="text-sm text-gray-600 truncate">
								{transactionCategory?.name}
								{` • ${transactionSubcategory?.name}`}
							</span>
						</div>
						{transaction.store && (
							<div className="text-xs text-gray-500 mt-1 truncate!">
								at {transaction.store}
							</div>
						)}
					</div>
				</div>
				<div className="text-right flex-shrink-0 min-w-fit">
					<div
						className={`font-bold text-lg ${styles.text} whitespace-nowrap`}
					>
						{transaction.operation.isExpense() && "-"}
						{transaction.operation.isIncome() && "+"}
						{transaction.originAmount.toString()}
					</div>
					<div className="text-xs text-gray-500 whitespace-nowrap">
						{new Date(transaction.date).toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
						})}
					</div>
				</div>
			</div>

			{/* Mobile Action Buttons - below main content */}
			<div className="flex md:hidden items-center justify-end gap-2 pb-2 border-b border-gray-200/50">
				{onEdit && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							onEdit(transaction);
						}}
						className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-gray-700 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm active:scale-95 text-sm font-medium"
						aria-label="Edit transaction"
					>
						<Pencil size={14} />
						<span>Edit</span>
					</button>
				)}
				{onDelete && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							onDelete(transaction);
						}}
						className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-gray-700 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-all shadow-sm active:scale-95 text-sm font-medium"
						aria-label="Delete transaction"
					>
						<Trash2 size={14} />
						<span>Delete</span>
					</button>
				)}
			</div>

			{/* Account Details */}
			<div className="border-t border-gray-200/50 pt-2 mt-2 space-y-1">
				{transaction.operation.isTransfer() &&
				transaction.destinationAccounts ? (
					<>
						<div className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-8 mb-1">
							From
						</div>
						{transaction.originAccounts.map((split) =>
							renderAccountSplit(
								transactionWithAccumulatedBalance,
								split,
								true,
							),
						)}
						<div className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-8 mt-2 mb-1">
							To
						</div>
						{transaction.destinationAccounts.map((split) =>
							renderAccountSplit(
								transactionWithAccumulatedBalance,
								split,
								false,
							),
						)}
					</>
				) : (
					<>
						{transaction.originAccounts.map((split) =>
							renderAccountSplit(
								transactionWithAccumulatedBalance,
								split,
								transaction.operation.isIncome(),
							),
						)}
					</>
				)}
			</div>
		</div>
	);
}
