import { AnimatePresence, motion } from "framer-motion";
import { DollarSign, X } from "lucide-react";
import { useMemo } from "react";
import {
	Transaction,
	TransactionAmount,
} from "../../../../../contexts/Transactions/domain";

interface SelectedTransactionsBarProps {
	selectedTransactions: Transaction[];
	onClearSelection: () => void;
}

export function SelectedTransactionsBar({
	selectedTransactions,
	onClearSelection,
}: Readonly<SelectedTransactionsBarProps>) {
	const totalAmount = useMemo(
		() =>
			selectedTransactions.reduce((sum, transaction) => {
				const transactionAmount = transaction.originAccounts.reduce(
					(splitSum, split) => splitSum + split.amount.value,
					0,
				);
				if (transaction.operation.isExpense()) {
					return sum - transactionAmount;
				} else if (transaction.operation.isIncome()) {
					return sum + transactionAmount;
				}
				// Transfers don't affect the total
				return sum;
			}, 0),
		[selectedTransactions],
	);

	const isVisible = useMemo(
		() => selectedTransactions.length > 0,
		[selectedTransactions],
	);

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					initial={{
						y: 100,
						opacity: 0,
					}}
					animate={{
						y: 0,
						opacity: 1,
					}}
					exit={{
						y: 100,
						opacity: 0,
					}}
					transition={{
						type: "spring",
						damping: 25,
						stiffness: 300,
					}}
					className="fixed! bottom-0! left-0! right-0! z-50! bg-white! border-t-2! border-indigo-200! shadow-2xl!"
				>
					<div className="max-w-7xl! mx-auto! px-4! sm:px-6! lg:px-8! py-4!">
						<div className="flex! items-center! justify-between! gap-4!">
							{/* Left: Selection Info */}
							<div className="flex! items-center! gap-4!">
								<div className="flex! items-center! gap-2!">
									<div className="w-10! h-10! bg-indigo-100! rounded-full! flex! items-center! justify-center!">
										<DollarSign className="w-5! h-5! text-indigo-600!" />
									</div>
									<div>
										<div className="text-sm! font-semibold! text-gray-900!">
											{selectedTransactions.length}{" "}
											transaction
											{selectedTransactions.length === 1
												? ""
												: "s"}{" "}
											selected
										</div>
										<div className="text-xs! text-gray-600!">
											Total:{" "}
											<span
												className={`font-bold! ${totalAmount >= 0 ? "text-emerald-600!" : "text-rose-600!"}`}
											>
												{totalAmount >= 0 ? "+" : ""}
												{new TransactionAmount(
													totalAmount,
												).toString()}
											</span>
										</div>
									</div>
								</div>
							</div>

							{/* Right: Actions */}
							<div className="flex! items-center! gap-2!">
								<button
									onClick={onClearSelection}
									className="flex! items-center! gap-2! px-4! py-2! text-gray-700! hover:text-gray-900! hover:bg-gray-100! rounded-lg! transition-colors! font-medium! text-sm!"
								>
									<X size={16} />
									<span className="hidden! sm:inline!">
										Clear Selection
									</span>
								</button>
							</div>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
