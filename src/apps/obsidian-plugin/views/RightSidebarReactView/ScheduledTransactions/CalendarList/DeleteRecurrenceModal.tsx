import { motion } from "framer-motion";
import { AlertTriangle, Calendar, X } from "lucide-react";
import { ItemRecurrenceInfo } from "../../../../../../contexts/ScheduledTransactions/domain";

interface DeleteRecurrenceModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	recurrence: ItemRecurrenceInfo | null;
}
export function DeleteRecurrenceModal({
	isOpen,
	onClose,
	onConfirm,
	recurrence,
}: Readonly<DeleteRecurrenceModalProps>) {
	if (!isOpen || !recurrence) return null;

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
							Delete This Occurrence
						</h3>
						<p className="text-sm text-gray-600">
							Are you sure you want to delete this specific
							occurrence? This will not affect other occurrences
							or the scheduled transaction.
						</p>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors"
					>
						<X size={20} />
					</button>
				</div>

				{/* Recurrence Details */}
				<div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<span className="text-sm text-gray-600">
								Transaction:
							</span>
							<span className="text-sm font-medium text-gray-900">
								{recurrence.name.toString()}
							</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="text-sm text-gray-600">
								Occurrence:
							</span>
							<span className="text-sm font-medium text-gray-900">
								#{String(recurrence.occurrenceIndex)}
							</span>
						</div>
						{recurrence.store && (
							<div className="flex justify-between items-center">
								<span className="text-sm text-gray-600">
									Store:
								</span>
								<span className="text-sm font-medium text-gray-900">
									{recurrence.store.toString()}
								</span>
							</div>
						)}
						<div className="flex justify-between items-center">
							<span className="text-sm text-gray-600">Date:</span>
							<span className="text-sm font-medium text-gray-900">
								{new Date(recurrence.date).toLocaleDateString(
									undefined,
									{
										weekday: "short",
										month: "short",
										day: "numeric",
										year: "numeric",
									},
								)}
							</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="text-sm text-gray-600">
								Amount:
							</span>
							<span className="text-sm font-bold text-gray-900">
								{recurrence.originAmount.toString()}
							</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="text-sm text-gray-600">Type:</span>
							<span className="text-sm font-medium text-gray-900 capitalize">
								{recurrence.operation.type.value}
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
						This will only delete this specific occurrence. The
						scheduled transaction and other occurrences will remain
						unchanged.
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
						Delete Occurrence
					</button>
				</div>
			</motion.div>
		</div>
	);
}
