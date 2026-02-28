import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowDownLeft,
	ArrowUpRight,
	Check,
	ChevronDown,
	ChevronUp,
	DollarSign,
	Pencil,
	RefreshCw,
	ShoppingBag,
	Trash2,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import { useContext, useMemo, useState } from "react";
import { TransactionWithAccumulatedBalance } from "../../../../../contexts/Reports/domain";
import { Nanoid } from "../../../../../contexts/Shared/domain";
import { PriceVO } from "../../../../../contexts/Shared/domain/value-objects/price.vo";
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
	const [isHovered, setIsHovered] = useState(false);
	const [isItemsExpanded, setIsItemsExpanded] = useState(false);
	const hasMultipleItems = transaction.items && transaction.items.length > 1;
	const displayName = getTransactionDisplayName(transaction);

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
		const balances = (
			isFrom ? twb.originAccounts : twb.destinationAccounts
		)?.find((s) => s.account.id === split.accountId.value);
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
						<div className="flex items-center gap-1 shrink-0">
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
						className={`p-2 rounded-full bg-white ${styles.text} shadow-sm mt-1 shrink-0`}
					>
						{styles.icon}
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2">
							<h3 className="font-semibold! text-gray-900! truncate!">
								{displayName}
							</h3>
							{hasMultipleItems && (
								<button
									onClick={(e) => {
										e.stopPropagation();
										setIsItemsExpanded(!isItemsExpanded);
									}}
									className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-xs font-medium shrink-0"
								>
									<ShoppingBag size={12} />
									{transaction.items.length} items
									{isItemsExpanded ? (
										<ChevronUp size={12} />
									) : (
										<ChevronDown size={12} />
									)}
								</button>
							)}
						</div>
						<div className="flex items-center gap-2 mt-0.5">
							<span className="text-sm text-gray-600 truncate">
								{
									getCategoryByID(
										getTransactionCategory(transaction)
											.category ?? Nanoid.generate(),
									)?.name
								}
								{getTransactionCategory(transaction)
									.subcategory &&
									` • ${getSubCategoryByID(getTransactionCategory(transaction).subcategory ?? Nanoid.generate())?.name}`}
							</span>
						</div>
						{transaction.store && (
							<div className="text-xs text-gray-500 mt-1 truncate!">
								at {transaction.store}
							</div>
						)}
					</div>
				</div>
				<div className="text-right shrink-0 min-w-fit">
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

			{/* Multi-Item Breakdown (expandable) */}
			<AnimatePresence>
				{hasMultipleItems && isItemsExpanded && (
					<motion.div
						initial={{
							height: 0,
							opacity: 0,
						}}
						animate={{
							height: "auto",
							opacity: 1,
						}}
						exit={{
							height: 0,
							opacity: 0,
						}}
						transition={{
							duration: 0.2,
						}}
						className="overflow-hidden"
					>
						<div className="border-t border-gray-200/50 pt-2 mt-1 mb-2 ml-8 space-y-1.5">
							{transaction.items.map((item) => (
								<div
									key={item.name.value}
									className="flex items-center justify-between text-sm py-1 px-2 rounded-md bg-white/60"
								>
									<div className="flex-1 min-w-0">
										<span className="font-medium text-gray-800 truncate block">
											{item.name}
										</span>
										{
											<span className="text-xs text-gray-500">
												{
													getCategoryByID(
														item.categoryId,
													)?.name
												}
												{` • ${getSubCategoryByID(item.subcategoryId)?.name}`}
											</span>
										}
									</div>
									<div className="flex items-center gap-2 shrink-0 ml-3">
										{item.quantity > 1 && (
											<span className="text-xs text-gray-500">
												×{item.quantity}
											</span>
										)}
										<span className="font-semibold text-gray-700 text-sm">
											{new PriceVO(
												item.price.value *
													item.quantity,
											).toString()}
										</span>
									</div>
								</div>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

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
				transaction.destinationAccounts.length > 0 ? (
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
								true,
							),
						)}
					</>
				)}
			</div>
		</div>
	);
}

// Helper to get display name from a transaction's items
export function getTransactionDisplayName(transaction: Transaction): string {
	if (!transaction.items || transaction.items.length === 0) {
		return "Unnamed Transaction";
	}
	if (transaction.items.length === 1) {
		return transaction.items[0].name.value || "Unnamed Item";
	}
	return `${transaction.items[0].name.value} +${transaction.items.length - 1} more`;
}

// Helper to get primary category from a transaction's items
export function getTransactionCategory(transaction: Transaction): {
	category?: Nanoid;
	subcategory?: Nanoid;
} {
	if (!transaction.items || transaction.items.length === 0) {
		return {
			category: undefined,
			subcategory: undefined,
		};
	}
	return {
		category: transaction.items[0].categoryId || undefined,
		subcategory: transaction.items[0].subcategoryId || undefined,
	};
}
