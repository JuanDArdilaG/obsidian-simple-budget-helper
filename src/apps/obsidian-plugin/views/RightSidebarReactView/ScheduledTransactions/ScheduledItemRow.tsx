import { motion } from "framer-motion";
import {
	ArrowDownLeft,
	ArrowUpRight,
	Calendar,
	CheckCircle,
	DollarSign,
	Pencil,
	RefreshCw,
	Repeat,
	Trash2,
} from "lucide-react";
import { useContext, useMemo, useState } from "react";
import { AccountsMap } from "../../../../../contexts/Accounts/application/get-all-accounts.usecase";
import {
	ItemRecurrenceInfo,
	RecurrenceState,
	RecurrenceType,
	ScheduledTransaction,
} from "../../../../../contexts/ScheduledTransactions/domain";
import { OperationType } from "../../../../../contexts/Shared/domain";
import { TransactionAmount } from "../../../../../contexts/Transactions/domain";
import { CategoriesContext } from "../Contexts";

type ScheduledItemData =
	| {
			type: "scheduled";
			data: ScheduledTransaction;
	  }
	| {
			type: "recurrence";
			data: ItemRecurrenceInfo;
	  };

interface ScheduledItemRowProps {
	item: ScheduledItemData;
	accountsMap: AccountsMap;
	// Scheduled transaction actions
	onEditScheduled?: (transaction: ScheduledTransaction) => void;
	onDeleteScheduled?: (transaction: ScheduledTransaction) => void;
	daysUntilNext?: number;
	monthlyTotal?: number;
	// Recurrence actions
	onEditRecurrence?: (recurrence: ItemRecurrenceInfo) => void;
	onRecordRecurrence?: (recurrence: ItemRecurrenceInfo) => void;
	onDeleteRecurrence?: (recurrence: ItemRecurrenceInfo) => void;
}
export function ScheduledItemRow({
	item,
	accountsMap,
	onEditScheduled,
	onDeleteScheduled,
	daysUntilNext,
	monthlyTotal,
	onEditRecurrence,
	onRecordRecurrence,
	onDeleteRecurrence,
}: Readonly<ScheduledItemRowProps>) {
	const { getCategoryByID, getSubCategoryByID } =
		useContext(CategoriesContext);
	const [isHovered, setIsHovered] = useState(false);

	// Extract common data from either type
	const itemData = useMemo(() => {
		if (item.type === "scheduled") {
			const t = item.data;
			return {
				name: t.name,
				operation: t.operation.type.value,
				fromSplits: t.originAccounts,
				toSplits: t.destinationAccounts,
				store: t.store,
				category: t.category,
				subcategory: t.subcategory,
				state: null,
				occurrenceIndex: null,
				date: null,
			};
		} else {
			const r = item.data;
			console.log("Recurrence data:", r);
			return {
				name: r.name,
				operation: r.operation.type.value,
				fromSplits: r.originAccounts,
				toSplits: r.destinationAccounts,
				store: r.store,
				category: r.category,
				subcategory: r.subcategory,
				state: r.state,
				occurrenceIndex: r.occurrenceIndex,
				date: r.date,
			};
		}
	}, [item]);

	const getAccountName = (accountId: string) => {
		return accountsMap.get(accountId)?.name || "Unknown Account";
	};

	const getOperationStyles = (operation: OperationType) => {
		switch (operation) {
			case "expense":
				return {
					bg: "bg-rose-50",
					text: "text-rose-600",
					border: "border-rose-100",
					icon: <ArrowUpRight className="w-5 h-5" />,
				};
			case "income":
				return {
					bg: "bg-emerald-50",
					text: "text-emerald-600",
					border: "border-emerald-100",
					icon: <ArrowDownLeft className="w-5 h-5" />,
				};
			case "transfer":
				return {
					bg: "bg-blue-50",
					text: "text-blue-600",
					border: "border-blue-100",
					icon: <RefreshCw className="w-5 h-5" />,
				};
			default:
				return {
					bg: "bg-gray-50",
					text: "text-gray-600",
					border: "border-gray-100",
					icon: <DollarSign className="w-5 h-5" />,
				};
		}
	};

	const getStateStyles = (state: RecurrenceState | null) => {
		if (!state) return null;
		switch (state) {
			case RecurrenceState.COMPLETED:
				return {
					badge: "bg-green-100 text-green-700 border-green-200",
					label: "Recorded",
				};
			case RecurrenceState.SKIPPED:
				return {
					badge: "bg-gray-100 text-gray-700 border-gray-200",
					label: "Skipped",
				};
			case RecurrenceState.DELETED:
				return {
					badge: "bg-red-100 text-red-700 border-red-200",
					label: "Deleted",
				};
			default:
				return null;
		}
	};

	const formatDaysUntil = (
		days: number,
	): {
		text: string;
		color: string;
	} => {
		if (days === 0) {
			return {
				text: "Today",
				color: "text-indigo-600 font-medium",
			};
		} else if (days === 1) {
			return {
				text: "Tomorrow",
				color: "text-gray-500",
			};
		} else if (days < 0) {
			return {
				text: `${days} days`,
				color: "text-rose-600 font-medium",
			};
		} else {
			return {
				text: `In ${days} days`,
				color: "text-gray-500",
			};
		}
	};

	const parseFrequency = (frequency?: string): string => {
		if (!frequency) return "One-time";
		const match = frequency.match(/(\d+)(d|w|mo|y)/);
		if (!match) return frequency;
		const [, num, unit] = match;
		const count = Number.parseInt(num);
		const unitMap: Record<string, string> = {
			d: count === 1 ? "day" : "days",
			w: count === 1 ? "week" : "weeks",
			mo: count === 1 ? "month" : "months",
			y: count === 1 ? "year" : "years",
		};
		return `Every ${count} ${unitMap[unit]}`;
	};

	const getRecurrenceLabel = () => {
		if (item.type !== "scheduled") return null;
		const { type, frequency, endDate, maxOccurrences } =
			item.data.recurrencePattern;
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

	const styles = getOperationStyles(itemData.operation);
	const stateStyles = getStateStyles(itemData.state);
	const totalAmount = useMemo(
		() =>
			itemData.fromSplits.reduce(
				(sum, split) => sum + split.amount.value,
				0,
			),
		[itemData.fromSplits],
	);

	// Calculate days until for recurrences
	const calculatedDaysUntil = useMemo(() => {
		if (item.type === "recurrence" && itemData.date) {
			const now = new Date();
			now.setHours(0, 0, 0, 0);
			const recurrenceDate = new Date(itemData.date);
			recurrenceDate.setHours(0, 0, 0, 0);
			const diffTime = recurrenceDate.getTime() - now.getTime();
			return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		}
		return daysUntilNext;
	}, [item.type, itemData.date, daysUntilNext]);

	const daysDisplay = useMemo(
		() => calculatedDaysUntil && formatDaysUntil(calculatedDaysUntil),
		[calculatedDaysUntil],
	);

	const isPending =
		itemData.state === null || itemData.state === RecurrenceState.PENDING;
	const isRecurrence = item.type === "recurrence";
	return (
		<div
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			className={`p-4 rounded-lg border ${styles.border} ${styles.bg} mb-3 transition-all hover:shadow-md relative group ${!isPending ? "opacity-60" : ""}`}
		>
			{/* Desktop Action Buttons */}
			{isPending && (
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
					{isRecurrence && onRecordRecurrence && (
						<button
							onClick={() =>
								onRecordRecurrence(
									item.data as ItemRecurrenceInfo,
								)
							}
							className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:text-green-600 hover:border-green-300 hover:bg-green-50 transition-all shadow-sm"
							aria-label="Record transaction"
							title="Record this transaction"
						>
							<CheckCircle size={16} />
						</button>
					)}
					{isRecurrence && onEditRecurrence ? (
						<button
							onClick={() =>
								onEditRecurrence(
									item.data as ItemRecurrenceInfo,
								)
							}
							className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm"
							aria-label="Edit recurrence"
						>
							<Pencil size={16} />
						</button>
					) : (
						onEditScheduled && (
							<button
								onClick={() =>
									onEditScheduled(
										item.data as ScheduledTransaction,
									)
								}
								className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm"
								aria-label="Edit scheduled transaction"
							>
								<Pencil size={16} />
							</button>
						)
					)}
					{isRecurrence && onDeleteRecurrence ? (
						<button
							onClick={() =>
								onDeleteRecurrence(
									item.data as ItemRecurrenceInfo,
								)
							}
							className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-all shadow-sm"
							aria-label="Delete recurrence"
						>
							<Trash2 size={16} />
						</button>
					) : (
						onDeleteScheduled && (
							<button
								onClick={() =>
									onDeleteScheduled(
										item.data as ScheduledTransaction,
									)
								}
								className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-all shadow-sm"
								aria-label="Delete scheduled transaction"
							>
								<Trash2 size={16} />
							</button>
						)
					)}
				</motion.div>
			)}

			{/* Main Row */}
			<div className="flex items-start justify-between mb-2 gap-2">
				<div className="flex items-start gap-3 flex-1 md:pr-32 min-w-0">
					<div
						className={`p-2 rounded-full bg-white ${styles.text} shadow-sm mt-1 flex-shrink-0`}
					>
						{styles.icon}
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 flex-wrap">
							<h3 className="font-semibold text-gray-900 truncate">
								{itemData.name}
							</h3>
							{stateStyles && (
								<span
									className={`text-xs px-2 py-0.5 rounded-full border font-medium ${stateStyles.badge}`}
								>
									{stateStyles.label}
								</span>
							)}
						</div>
						{!isRecurrence && itemData.category && (
							<div className="flex items-center gap-2 mt-0.5">
								<span className="text-sm text-gray-600 truncate">
									{getCategoryByID(itemData.category)?.name}
									{` • ${getSubCategoryByID(itemData.subcategory)?.name}`}
								</span>
							</div>
						)}
						<div className="flex items-center gap-2 mt-1">
							{isRecurrence ? (
								<>
									<Calendar
										size={12}
										className="text-gray-400"
									/>
									<span className="text-xs text-gray-500">
										Occurrence #
										{String(itemData.occurrenceIndex)}
									</span>
								</>
							) : (
								<>
									<Repeat
										size={12}
										className="text-gray-400"
									/>
									<span className="text-xs text-gray-500">
										{getRecurrenceLabel()}
									</span>
								</>
							)}
						</div>
						{itemData.store && (
							<div className="text-xs text-gray-500 mt-1 truncate">
								at {itemData.store}
							</div>
						)}
					</div>
				</div>
				<div className="text-right flex-shrink-0 min-w-fit">
					<div
						className={`font-bold text-lg ${styles.text} whitespace-nowrap`}
					>
						{itemData.operation === "expense" && "-"}
						{itemData.operation === "income" && "+"}
						{new TransactionAmount(totalAmount).toString()}
					</div>
					{isRecurrence && itemData.date && (
						<div className="text-xs text-gray-500 whitespace-nowrap">
							{new Date(itemData.date).toLocaleDateString(
								undefined,
								{
									month: "short",
									day: "numeric",
									year: "numeric",
								},
							)}
						</div>
					)}
					{daysDisplay && (
						<div
							className={`text-xs whitespace-nowrap ${isRecurrence ? "mt-0.5" : ""} ${daysDisplay.color}`}
						>
							{daysDisplay.text}
						</div>
					)}
					{monthlyTotal !== undefined && (
						<div className="text-xs font-medium text-indigo-600 whitespace-nowrap mt-1">
							{new TransactionAmount(monthlyTotal).toString()}/mo
						</div>
					)}
				</div>
			</div>

			{/* Mobile Action Buttons */}
			{isPending && (
				<div className="flex md:hidden items-center justify-end gap-2 pb-2 border-b border-gray-200/50">
					{isRecurrence && onRecordRecurrence && (
						<button
							onClick={() =>
								onRecordRecurrence(
									item.data as ItemRecurrenceInfo,
								)
							}
							className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-gray-700 hover:text-green-600 hover:border-green-300 hover:bg-green-50 transition-all shadow-sm active:scale-95 text-sm font-medium"
							aria-label="Record transaction"
						>
							<CheckCircle size={14} />
							<span>Record</span>
						</button>
					)}
					{isRecurrence && onEditRecurrence ? (
						<button
							onClick={() =>
								onEditRecurrence(
									item.data as ItemRecurrenceInfo,
								)
							}
							className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-gray-700 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm active:scale-95 text-sm font-medium"
							aria-label="Edit recurrence"
						>
							<Pencil size={14} />
							<span>Edit</span>
						</button>
					) : (
						onEditScheduled && (
							<button
								onClick={() =>
									onEditScheduled(
										item.data as ScheduledTransaction,
									)
								}
								className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-gray-700 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm active:scale-95 text-sm font-medium"
								aria-label="Edit scheduled transaction"
							>
								<Pencil size={14} />
								<span>Edit</span>
							</button>
						)
					)}
					{isRecurrence && onDeleteRecurrence ? (
						<button
							onClick={() =>
								onDeleteRecurrence(
									item.data as ItemRecurrenceInfo,
								)
							}
							className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-gray-700 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-all shadow-sm active:scale-95 text-sm font-medium"
							aria-label="Delete recurrence"
						>
							<Trash2 size={14} />
							<span>Delete</span>
						</button>
					) : (
						onDeleteScheduled && (
							<button
								onClick={() =>
									onDeleteScheduled(
										item.data as ScheduledTransaction,
									)
								}
								className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-gray-700 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-all shadow-sm active:scale-95 text-sm font-medium"
								aria-label="Delete scheduled transaction"
							>
								<Trash2 size={14} />
								<span>Delete</span>
							</button>
						)
					)}
				</div>
			)}

			{/* Account Details */}
			<div className="border-t border-gray-200/50 pt-2 mt-2 space-y-1">
				<div className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-8 mb-1">
					{itemData.operation === "income"
						? "Deposit To"
						: "Paid From"}
				</div>
				{itemData.fromSplits.map((split, index) => (
					<div
						key={split.accountId.value}
						className="flex items-center justify-between text-xs text-gray-500 pl-8"
					>
						<span className="font-medium text-gray-600">
							{getAccountName(split.accountId.value)}
						</span>
						<span className="font-medium text-gray-700">
							{split.amount.toString()}
						</span>
					</div>
				))}

				{itemData.operation === "transfer" &&
					itemData.toSplits.length > 0 && (
						<>
							<div className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-8 mt-2 mb-1">
								Transfer To
							</div>
							{itemData.toSplits.map((split, index) => (
								<div
									key={split.accountId.value}
									className="flex items-center justify-between text-xs text-gray-500 pl-8"
								>
									<span className="font-medium text-gray-600">
										{getAccountName(split.accountId.value)}
									</span>
									<span className="font-medium text-gray-700">
										{split.amount.toString()}
									</span>
								</div>
							))}
						</>
					)}
			</div>
		</div>
	);
}
