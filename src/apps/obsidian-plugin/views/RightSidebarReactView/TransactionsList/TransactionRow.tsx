import { motion } from "framer-motion";
import {
	ArrowDownLeft,
	ArrowRight,
	ArrowUpRight,
	DollarSign,
	Pencil,
	RefreshCw,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { Account } from "../../../../../contexts/Accounts/domain";
import { TransactionWithAccumulatedBalance } from "../../../../../contexts/Reports/domain";
import { Nanoid, OperationType } from "../../../../../contexts/Shared/domain";
import {
	Transaction,
	TransactionAmount,
} from "../../../../../contexts/Transactions/domain";

interface TransactionRowProps {
	transactionWithAccumulatedBalance: TransactionWithAccumulatedBalance;
	onEdit?: (transaction: Transaction) => void;
	onDelete?: (transactionId: Nanoid) => void;
}

export function TransactionRow({
	transactionWithAccumulatedBalance: {
		transaction,
		originAccounts,
		destinationAccounts,
	},
	onEdit,
	onDelete,
}: Readonly<TransactionRowProps>) {
	const [isHovered, setIsHovered] = useState(false);
	const getTypeStyles = (type: OperationType) => {
		switch (type) {
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
	const styles = getTypeStyles(transaction.operation.value);

	const renderAccountDetails = (
		account: Account,
		previousBalance: number,
		newBalance: number,
		isOrigin: boolean,
	) => (
		<div
			key={account.id.value}
			className="flex items-center justify-between text-xs text-gray-500 mt-1 pl-8"
		>
			<span className="font-medium text-gray-600">{account.name}</span>
			<div className="flex items-center gap-3">
				<span>{new TransactionAmount(previousBalance).toString()}</span>
				<ArrowRight className="w-3 h-3 text-gray-400" />
				<span
					className={`font-medium ${isOrigin ? "text-rose-600" : "text-emerald-600"}`}
				>
					{new TransactionAmount(newBalance).toString()}
				</span>
			</div>
		</div>
	);
	return (
		<div
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			className={`p-4 rounded-lg border ${styles.border} ${styles.bg} mb-3 transition-all hover:shadow-sm`}
		>
			{" "}
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
						onClick={() => onEdit(transaction)}
						className="p-2! bg-white! rounded-lg! border! border-gray-200! text-gray-600! hover:text-indigo-600! hover:border-indigo-300! hover:bg-indigo-50! transition-all! shadow-sm!"
						aria-label="Edit transaction"
					>
						<Pencil size={16} />
					</button>
				)}
				{onDelete && (
					<button
						onClick={() => onDelete(transaction.id)}
						className="p-2! bg-white! rounded-lg! border! border-gray-200! text-gray-600! hover:text-rose-600! hover:border-rose-300! hover:bg-rose-50! transition-all! shadow-sm!"
						aria-label="Delete transaction"
					>
						<Trash2 size={16} />
					</button>
				)}
			</motion.div>
			{/* Main Row */}
			<div className="flex items-start justify-between mb-2">
				<div className="flex items-start gap-3">
					<div
						className={`p-2 rounded-full bg-white ${styles.text} shadow-sm mt-1`}
					>
						{styles.icon}
					</div>
					<div>
						<div className="flex! items-center! gap-2!">
							<h3 className="flex! gap-2! font-semibold! text-gray-900!">
								<span>{transaction.name.value}</span>
								{transaction.store && (
									<span className="text-xs font-medium text-gray-500">
										{transaction.store.value}
									</span>
								)}
							</h3>
						</div>
						<div className="text-sm text-gray-600 mt-0.5">
							{transaction.category.name}
						</div>
					</div>
				</div>
				<div className="text-right">
					<div className={`font-bold text-lg ${styles.text}`}>
						{transaction.operation.isExpense() && "-"}
						{transaction.operation.isIncome() && "+"}
						{transaction.originAmount.toString()}
					</div>
					<div className="text-xs text-gray-500">
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
						onClick={() => onEdit(transaction)}
						className="flex! items-center! gap-1.5! px-3! py-1.5! bg-white! rounded-lg! border! border-gray-200! text-gray-700! hover:text-indigo-600! hover:border-indigo-300! hover:bg-indigo-50! transition-all! shadow-sm! active:scale-95! text-sm! font-medium!"
						aria-label="Edit transaction"
					>
						<Pencil size={14} />
						<span>Edit</span>
					</button>
				)}
				{onDelete && (
					<button
						onClick={() => onDelete(transaction.id)}
						className="flex! items-center! gap-1.5! px-3! py-1.5! bg-white! rounded-lg! border! border-gray-200! text-gray-700! hover:text-rose-600! hover:border-rose-300! hover:bg-rose-50! transition-all! shadow-sm! active:scale-95! text-sm! font-medium!"
						aria-label="Delete transaction"
					>
						<Trash2 size={14} />
						<span>Delete</span>
					</button>
				)}
			</div>
			{/* Account Details */}
			<div className="border-t border-gray-200/50 pt-2 mt-2 space-y-1">
				{transaction.operation.isTransfer() && destinationAccounts ? (
					<>
						<div className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-8 mb-1">
							From
						</div>
						{originAccounts.map(
							({ account, prevBalance, balance }) =>
								renderAccountDetails(
									account,
									prevBalance,
									balance,
									true,
								),
						)}
						<div className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-8 mt-2 mb-1">
							To
						</div>
						{destinationAccounts.map(
							({ account, prevBalance, balance }) =>
								renderAccountDetails(
									account,
									prevBalance,
									balance,
									false,
								),
						)}
					</>
				) : (
					<>
						{originAccounts.map(
							({ account, prevBalance, balance }) =>
								renderAccountDetails(
									account,
									prevBalance,
									balance,
									true,
								),
						)}
					</>
				)}
			</div>
		</div>
	);
}
