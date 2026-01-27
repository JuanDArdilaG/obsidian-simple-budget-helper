import { AlertTriangle, X } from "lucide-react";
import { Transaction } from "../../../../../contexts/Transactions/domain";

interface DeleteConfirmationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => Promise<void>;
	transaction: Transaction | null;
}

export function DeleteConfirmationModal({
	isOpen,
	onClose,
	onConfirm,
	transaction,
}: Readonly<DeleteConfirmationModalProps>) {
	if (!isOpen || !transaction) return null;

	const formatDate = (date: Date) => {
		return date.toLocaleDateString(undefined, {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-20">
			<div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-100">
				<div className="flex items-start gap-4 mb-4">
					<div className="p-3 bg-rose-50 rounded-full">
						<AlertTriangle className="w-6 h-6 text-rose-600" />
					</div>
					<div className="flex-1">
						<h3 className="text-lg font-semibold text-gray-900 mb-1">
							Delete Transaction
						</h3>
						<p className="text-sm text-gray-600">
							Are you sure you want to delete this transaction?
							This action cannot be undone.
						</p>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600"
					>
						<X size={20} />
					</button>
				</div>

				{/* Transaction Details */}
				<div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<span className="text-sm text-gray-600">
								Store/Description:
							</span>
							<span className="text-sm font-medium text-gray-900">
								{transaction.name.value}
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
						<div className="flex justify-between items-center">
							<span className="text-sm text-gray-600">Date:</span>
							<span className="text-sm font-medium text-gray-900">
								{formatDate(transaction.date.value)}
							</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="text-sm text-gray-600">Type:</span>
							<span className="text-sm font-medium text-gray-900 capitalize">
								{transaction.operation.value}
							</span>
						</div>
					</div>
				</div>

				{/* Actions */}
				<div className="flex gap-3">
					<button
						onClick={onClose}
						className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
					>
						Cancel
					</button>
					<button
						onClick={async () => await onConfirm()}
						className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 shadow-sm"
					>
						Delete Transaction
					</button>
				</div>
			</div>
		</div>
	);
}
