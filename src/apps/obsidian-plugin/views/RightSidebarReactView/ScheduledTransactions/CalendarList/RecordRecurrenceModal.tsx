import { motion } from "framer-motion";
import { CheckCircle, X } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { ItemRecurrenceInfo } from "../../../../../../contexts/ScheduledTransactions/domain";
import { AccountSplit } from "../../../../../../contexts/Transactions/domain";
import { AccountSplitter } from "../../../../components/AccountSplitter";
import { AccountsContext } from "../../Contexts";

interface RecordRecurrenceModalProps {
	isOpen: boolean;
	onClose: () => void;
	onRecord: (
		recurrence: ItemRecurrenceInfo,
		date: Date,
		amount: number,
		fromSplits: AccountSplit[],
		toSplits: AccountSplit[],
	) => void;
	recurrence: ItemRecurrenceInfo | null;
}
export function RecordRecurrenceModal({
	isOpen,
	onClose,
	onRecord,
	recurrence,
}: Readonly<RecordRecurrenceModalProps>) {
	const [date, setDate] = useState("");
	const [amount, setAmount] = useState(0);
	const [fromSplits, setFromSplits] = useState<AccountSplit[]>([]);
	const [toSplits, setToSplits] = useState<AccountSplit[]>([]);
	const { accountsMap } = useContext(AccountsContext);

	useEffect(() => {
		if (isOpen && recurrence && accountsMap.size > 0) {
			setDate(new Date(recurrence.date).toISOString().split("T")[0]);
			const originAmount = recurrence.originAmount.value;
			setAmount(originAmount);
			// Ensure we have at least one split, even if the recurrence has none
			const originAccounts = recurrence.originAccounts;
			setFromSplits([...originAccounts]);
			const destinationAccounts = recurrence.destinationAccounts;
			setToSplits([...destinationAccounts]);
		}
	}, [isOpen, recurrence, accountsMap]);

	const handleSubmit = () => {
		if (!recurrence || !date || amount <= 0) {
			alert("Please fill in all required fields");
			return;
		}
		const fromTotal = fromSplits.reduce(
			(sum, s) => sum + s.amount.value,
			0,
		);
		if (Math.abs(fromTotal - amount) > 0.01) {
			alert("Account splits must match transaction amount");
			return;
		}
		if (recurrence.operation.type.isTransfer()) {
			const toTotal = toSplits.reduce(
				(sum, s) => sum + s.amount.value,
				0,
			);
			if (Math.abs(toTotal - amount) > 0.01) {
				alert(
					"Transfer destination splits must match transaction amount",
				);
				return;
			}
		}
		onRecord(recurrence, new Date(date), amount, fromSplits, toSplits);
		onClose();
	};

	if (!isOpen || !recurrence) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm overflow-y-auto">
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
				className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 border border-gray-100 my-8"
			>
				<div className="flex justify-between items-center mb-6">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-green-50 rounded-lg">
							<CheckCircle className="w-6 h-6 text-green-600" />
						</div>
						<div>
							<h2 className="text-xl font-bold text-gray-900">
								Record Transaction
							</h2>
							<p className="text-sm text-gray-600">
								Create transaction from occurrence #
								{String(recurrence.occurrenceIndex)}
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600"
					>
						<X size={24} />
					</button>
				</div>

				<div className="space-y-6">
					{/* Transaction Info */}
					<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<span className="text-sm text-gray-600">
									Name:
								</span>
								<span className="text-sm font-medium text-gray-900">
									{recurrence.name.toString()}
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
								<span className="text-sm text-gray-600">
									Type:
								</span>
								<span className="text-sm font-medium text-gray-900 capitalize">
									{recurrence.operation.type.value}
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-gray-600">
									Original Date:
								</span>
								<span className="text-sm font-medium text-gray-900">
									{new Date(
										recurrence.date,
									).toLocaleDateString()}
								</span>
							</div>
						</div>
					</div>

					{/* Editable Fields */}
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Transaction Date *
							</label>
							<input
								type="date"
								value={date}
								onChange={(e) => setDate(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Amount *
							</label>
							<div className="relative">
								<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
									$
								</span>
								<input
									type="number"
									value={amount || ""}
									onChange={(e) =>
										setAmount(
											parseFloat(e.target.value) || 0,
										)
									}
									placeholder="0.00"
									step="0.01"
									className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
								/>
							</div>
						</div>
					</div>

					{/* Account Splits */}
					<div className="space-y-4">
						{fromSplits.length > 0 && (
							<AccountSplitter
								label={
									recurrence.operation.type.isIncome()
										? "Deposit To"
										: "Paid From"
								}
								splits={fromSplits}
								onChange={setFromSplits}
								totalAmount={amount}
							/>
						)}

						{recurrence.operation.type.isTransfer() &&
							toSplits.length > 0 && (
								<AccountSplitter
									label="Transfer To"
									splits={toSplits}
									onChange={setToSplits}
									totalAmount={amount}
								/>
							)}
					</div>
				</div>

				{/* Actions */}
				<div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
					<button
						onClick={onClose}
						className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={handleSubmit}
						className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm"
					>
						Record Transaction
					</button>
				</div>
			</motion.div>
		</div>
	);
}
