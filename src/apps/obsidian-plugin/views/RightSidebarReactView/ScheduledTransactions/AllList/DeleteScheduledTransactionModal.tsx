import { motion } from "framer-motion";
import { AlertTriangle, Calendar, X } from "lucide-react";
import {
	RecurrenceType,
	ScheduledTransaction,
} from "../../../../../../contexts/ScheduledTransactions/domain";

interface DeleteScheduledTransactionModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	transaction: ScheduledTransaction | null;
}
export function DeleteScheduledTransactionModal({
	isOpen,
	onClose,
	onConfirm,
	transaction,
}: Readonly<DeleteScheduledTransactionModalProps>) {
	if (!isOpen || !transaction) return null;

	const parseFrequency = (frequency?: string): string => {
		if (!frequency) return "One-time";
		const match = frequency.match(/(\d+)(d|w|mo|y)/);
		if (!match) return frequency;
		const [, num, unit] = match;
		const count = parseInt(num);
		const unitMap: Record<string, string> = {
			d: count === 1 ? "day" : "days",
			w: count === 1 ? "week" : "weeks",
			mo: count === 1 ? "month" : "months",
			y: count === 1 ? "year" : "years",
		};
		return `Every ${count} ${unitMap[unit]}`;
	};
	const getRecurrenceLabel = () => {
		const { type, frequency, endDate, maxOccurrences } =
			transaction.recurrencePattern;
		switch (type) {
			case RecurrenceType.ONE_TIME:
				return "One-time";
			case RecurrenceType.INFINITE:
				return parseFrequency(frequency?.value);
			case RecurrenceType.UNTIL_DATE:
				return `${parseFrequency(frequency?.value)} until ${new Date(endDate!).toLocaleDateString()}`;
			case RecurrenceType.N_OCCURRENCES:
				return `${parseFrequency(frequency?.value)} (${maxOccurrences}x)`;
			default:
				return "Unknown";
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
			<motion.div
				initial={{
					opacity: 0,
					scale: 0.95,
				}}
				animate={{
					opacity: 1,
					scale: 1,
				}}
				exit={{
					opacity: 0,
					scale: 0.95,
				}}
				className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-100"
			>
				<div className="flex items-start gap-4 mb-4">
					<div className="p-3 bg-rose-50 rounded-full">
						<AlertTriangle className="w-6 h-6 text-rose-600" />
					</div>
					<div className="flex-1">
						<h3 className="text-lg font-semibold text-gray-900 mb-1">
							Delete Scheduled Transaction
						</h3>
						<p className="text-sm text-gray-600">
							Are you sure you want to delete this scheduled
							transaction? This action cannot be undone.
						</p>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors"
					>
						<X size={20} />
					</button>
				</div>

				{/* Transaction Details */}
				<div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<span className="text-sm text-gray-600">Name:</span>
							<span className="text-sm font-medium text-gray-900">
								{transaction.name}
							</span>
						</div>
						{transaction.store && (
							<div className="flex justify-between items-center">
								<span className="text-sm text-gray-600">
									Store:
								</span>
								<span className="text-sm font-medium text-gray-900">
									{transaction.store}
								</span>
							</div>
						)}
						<div className="flex justify-between items-center">
							<span className="text-sm text-gray-600">
								Category:
							</span>
							<span className="text-sm font-medium text-gray-900">
								{transaction.category}
								{transaction.subcategory &&
									` • ${transaction.subcategory}`}
							</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="text-sm text-gray-600">
								Amount:
							</span>
							<span className="text-sm font-bold text-gray-900">
								{transaction.originAmount.toString()}
							</span>
						</div>
						<div className="flex justify-between items-start">
							<span className="text-sm text-gray-600">
								Recurrence:
							</span>
							<span className="text-sm font-medium text-gray-900 text-right">
								{getRecurrenceLabel()}
							</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="text-sm text-gray-600">
								Start Date:
							</span>
							<span className="text-sm font-medium text-gray-900">
								{new Date(
									transaction.recurrencePattern.startDate,
								).toLocaleDateString()}
							</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="text-sm text-gray-600">Type:</span>
							<span className="text-sm font-medium text-gray-900 capitalize">
								{transaction.operation.type}
							</span>
						</div>
					</div>
				</div>

				{/* Warning Message */}
				<div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-6">
					<Calendar
						size={16}
						className="text-amber-600 mt-0.5 flex-shrink-0"
					/>
					<p className="text-sm text-amber-800">
						This will permanently delete the scheduled transaction.
						Future occurrences will not be created.
					</p>
				</div>

				{/* Actions */}
				<div className="flex gap-3">
					<button
						onClick={onClose}
						className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={onConfirm}
						className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition-colors shadow-sm"
					>
						Delete Scheduled Transaction
					</button>
				</div>
			</motion.div>
		</div>
	);
}
