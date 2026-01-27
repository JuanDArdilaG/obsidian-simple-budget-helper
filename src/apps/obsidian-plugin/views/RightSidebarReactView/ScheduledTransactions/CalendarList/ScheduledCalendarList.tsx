import { motion } from "framer-motion";
import { Calendar, ChevronDown } from "lucide-react";
import { useContext, useEffect, useMemo, useState } from "react";
import { AccountsMap } from "../../../../../../contexts/Accounts/application/get-all-accounts.usecase";
import { CategoriesWithSubcategoriesMap } from "../../../../../../contexts/Categories/application/get-all-categories-with-subcategories.usecase";
import {
	ItemRecurrenceInfo,
	ScheduledTransaction,
} from "../../../../../../contexts/ScheduledTransactions/domain";
import { AccountSplit } from "../../../../../../contexts/Transactions/domain";
import { ScheduledTransactionsContext } from "../../Contexts";
import { EditScheduledTransactionModal } from "../EditScheduledTransactionModal";
import { ScheduledItemRow } from "../ScheduledItemRow";
import { DeleteRecurrenceModal } from "./DeleteRecurrenceModal";
import { FinancialSummary } from "./FinancialSummary";
import { RecordRecurrenceModal } from "./RecordRecurrenceModal";

// Helper function to get the end of current week (Sunday)
const getEndOfWeek = (): Date => {
	const now = new Date();
	const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
	const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
	const endOfWeek = new Date(now);
	endOfWeek.setDate(now.getDate() + daysUntilSunday);
	endOfWeek.setHours(23, 59, 59, 999);
	return endOfWeek;
};

// Helper function to get the last day of current month
const getEndOfMonth = (): Date => {
	const now = new Date();
	const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
	endOfMonth.setHours(23, 59, 59, 999);
	return endOfMonth;
};

// Quick filter options
const QUICK_FILTERS = [
	{
		label: "3 Days",
		days: 3,
		type: "days" as const,
	},
	{
		label: "This Week",
		days: 0,
		type: "week" as const,
	},
	{
		label: "1 Week",
		days: 7,
		type: "days" as const,
	},
	{
		label: "2 Weeks",
		days: 14,
		type: "days" as const,
	},
	{
		label: "This Month",
		days: 0,
		type: "month" as const,
	},
	{
		label: "1 Month",
		days: 30,
		type: "days" as const,
	},
	{
		label: "3 Months",
		days: 90,
		type: "days" as const,
	},
];

interface ScheduledCalendarPageProps {
	accountsMap: AccountsMap;
	isRefreshing: boolean;
	onRefresh: () => void;
	onSaveAll: (transaction: ScheduledTransaction) => Promise<void>;
	onSaveSingle: (
		recurrence: ItemRecurrenceInfo,
		updates: {
			date: Date;
			fromSplits: AccountSplit[];
			toSplits: AccountSplit[];
		},
	) => Promise<void>;
	categories: CategoriesWithSubcategoriesMap;
}

export function ScheduledCalendarList({
	accountsMap,
	onSaveAll,
	onSaveSingle,
	categories,
	isRefreshing,
	onRefresh,
}: Readonly<ScheduledCalendarPageProps>) {
	const {
		scheduledItems,
		useCases: {
			deleteItemRecurrence,
			recordItemRecurrence,
			getScheduledTransactionsUntilDate,
		},
	} = useContext(ScheduledTransactionsContext);

	const [searchQuery, setSearchQuery] = useState("");
	const [selectedQuickFilter, setSelectedQuickFilter] = useState(
		QUICK_FILTERS[0],
	); // 3 Days default
	const [customUntilDate, setCustomUntilDate] = useState("");
	const [showCustomDate, setShowCustomDate] = useState(false);
	// Modal states
	const [recordingRecurrence, setRecordingRecurrence] =
		useState<ItemRecurrenceInfo | null>(null);
	const [editingRecurrence, setEditingRecurrence] =
		useState<ItemRecurrenceInfo | null>(null);
	const [deletingRecurrence, setDeletingRecurrence] =
		useState<ItemRecurrenceInfo | null>(null);

	const handleRecord = async (
		recurrence: ItemRecurrenceInfo,
		date: Date,
		amount: number,
		fromSplits: AccountSplit[],
		toSplits: AccountSplit[],
	) => {
		console.log("Recording transaction:", {
			recurrence,
			date,
			amount,
			fromSplits,
			toSplits,
		});

		await recordItemRecurrence.execute({
			scheduledTransactionID: recurrence.scheduledTransactionId,
			occurrenceIndex: recurrence.occurrenceIndex,
			date,
			fromSplits,
			toSplits,
		});

		setRecordingRecurrence(null);
	};

	const handleDelete = async () => {
		if (deletingRecurrence) {
			console.log("Deleting recurrence:", deletingRecurrence);
			await deleteItemRecurrence.execute({
				id: deletingRecurrence.scheduledTransactionId,
				n: deletingRecurrence.occurrenceIndex,
			});
			setDeletingRecurrence(null);
		}
	};

	// Calculate until date based on filter
	const untilDate = useMemo(() => {
		if (showCustomDate && customUntilDate) {
			return new Date(customUntilDate);
		}
		// Handle special filter types
		if (selectedQuickFilter.type === "week") {
			return getEndOfWeek();
		} else if (selectedQuickFilter.type === "month") {
			return getEndOfMonth();
		}
		// Default: add days to current date
		const date = new Date();
		date.setDate(date.getDate() + selectedQuickFilter.days);
		date.setHours(23, 59, 59, 999);
		return date;
	}, [selectedQuickFilter, showCustomDate, customUntilDate]);

	const [recurrences, setRecurrences] = useState<ItemRecurrenceInfo[]>([]);

	useEffect(() => {
		getScheduledTransactionsUntilDate
			.execute(untilDate)
			.then(setRecurrences);
	}, [untilDate, getScheduledTransactionsUntilDate]);

	// Filter and sort recurrences
	const filteredAndSortedRecurrences = useMemo(() => {
		const filtered = recurrences.filter((r) => {
			const matchesSearch =
				r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				r.store?.toLowerCase().includes(searchQuery.toLowerCase());
			return matchesSearch;
		});
		// Sort by date (earliest first)
		return filtered.sort((a, b) => a.date.getTime() - b.date.getTime());
	}, [recurrences, searchQuery]);
	// Group by date
	const groupedRecurrences = useMemo(() => {
		const groups: {
			date: string;
			recurrences: ItemRecurrenceInfo[];
		}[] = [];
		let currentDate = "";
		filteredAndSortedRecurrences.forEach((r) => {
			const dateStr = new Date(r.date).toLocaleDateString(undefined, {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
			});
			if (dateStr !== currentDate) {
				groups.push({
					date: dateStr,
					recurrences: [],
				});
				currentDate = dateStr;
			}
			groups[groups.length - 1].recurrences.push(r);
		});
		return groups;
	}, [filteredAndSortedRecurrences]);
	return (
		<>
			{/* Filters */}
			<div className="bg-white! border-b! border-gray-200! py-4! px-4! sm:px-6! lg:px-8!">
				<div className="max-w-7xl! mx-auto!">
					<div className="flex! flex-col! sm:flex-row! gap-4!">
						{/* Quick Filters */}
						<div className="flex-1!">
							<label className="block! text-xs! font-medium! text-gray-600! mb-2!">
								Time Range
							</label>
							<div className="flex! flex-wrap! gap-2!">
								{QUICK_FILTERS.map((filter) => (
									<button
										key={filter.label}
										onClick={() => {
											setSelectedQuickFilter(filter);
											setShowCustomDate(false);
										}}
										className={`px-3! py-1.5! text-sm! rounded-lg! border! transition-all! ${selectedQuickFilter === filter && !showCustomDate ? "bg-indigo-600! text-white! border-indigo-600!" : "bg-white! text-gray-700! border-gray-300! hover:bg-gray-50!"}`}
									>
										{filter.label}
									</button>
								))}
								<button
									onClick={() =>
										setShowCustomDate(!showCustomDate)
									}
									className={`px-3! py-1.5! text-sm! rounded-lg! border! transition-all! flex! items-center! gap-1! ${showCustomDate ? "bg-indigo-600! text-white! border-indigo-600!" : "bg-white! text-gray-700! border-gray-300! hover:bg-gray-50!"}`}
								>
									<Calendar size={14} />
									Custom
									<ChevronDown size={14} />
								</button>
							</div>
						</div>

						{/* Custom Date Picker */}
						{showCustomDate && (
							<motion.div
								initial={{
									opacity: 0,
									height: 0,
								}}
								animate={{
									opacity: 1,
									height: "auto",
								}}
								exit={{
									opacity: 0,
									height: 0,
								}}
								className="sm:w-48!"
							>
								<label className="block! text-xs! font-medium! text-gray-600! mb-2!">
									Until Date
								</label>
								<input
									type="date"
									value={customUntilDate}
									onChange={(e) =>
										setCustomUntilDate(e.target.value)
									}
									min={new Date().toISOString().split("T")[0]}
									className="w-full! px-3! py-1.5! text-sm! border! border-gray-300! rounded-lg! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500!"
								/>
							</motion.div>
						)}
					</div>

					<div className="mt-3! text-xs! text-gray-500!">
						Showing occurrences until{" "}
						<span className="font-medium! text-gray-700!">
							{untilDate.toLocaleDateString(undefined, {
								month: "long",
								day: "numeric",
								year: "numeric",
							})}
						</span>
					</div>
				</div>
			</div>

			{/* Financial Summary */}
			<FinancialSummary untilDate={untilDate} recurrences={recurrences} />

			{/* List */}
			<main className="max-w-7xl mx-auto px-4! sm:px-6! lg:px-8! py-6!">
				{groupedRecurrences.length > 0 ? (
					<>
						<div className="mb-4! text-sm! text-gray-600!">
							{filteredAndSortedRecurrences.length} upcoming
							occurrence
							{filteredAndSortedRecurrences.length !== 1
								? "s"
								: ""}
						</div>

						<div className="space-y-6!">
							{groupedRecurrences.map((group, groupIndex) => (
								<motion.div
									key={group.date}
									initial={{
										opacity: 0,
										y: 20,
									}}
									animate={{
										opacity: 1,
										y: 0,
									}}
									transition={{
										delay: groupIndex * 0.05,
									}}
								>
									<h3 className="text-sm! font-semibold! text-gray-500! uppercase! tracking-wider! mb-3! sticky! top-32! bg-gray-50/95! backdrop-blur-sm! py-2! z-10!">
										{group.date}
									</h3>
									<div className="space-y-2!">
										{group.recurrences.map((recurrence) => (
											<ScheduledItemRow
												key={`${recurrence.scheduledTransactionId}-${recurrence.occurrenceIndex}`}
												item={{
													type: "recurrence",
													data: recurrence,
												}}
												accountsMap={accountsMap}
												onEditRecurrence={(r) =>
													setEditingRecurrence(r)
												}
												onRecordRecurrence={(r) =>
													setRecordingRecurrence(r)
												}
												onDeleteRecurrence={(r) =>
													setDeletingRecurrence(r)
												}
											/>
										))}
									</div>
								</motion.div>
							))}
						</div>
					</>
				) : (
					<div className="flex! flex-col! items-center! justify-center! h-64! text-gray-500!">
						<Calendar size={48} className="mb-4! text-gray-300!" />
						<p className="text-lg! font-medium!">
							No upcoming occurrences found
						</p>
						<p className="text-sm!">
							{searchQuery
								? "Try adjusting your search query"
								: "No scheduled transactions in this time range"}
						</p>
					</div>
				)}
			</main>

			{/* Modals */}
			<RecordRecurrenceModal
				isOpen={!!recordingRecurrence}
				onClose={() => setRecordingRecurrence(null)}
				onRecord={handleRecord}
				recurrence={recordingRecurrence}
			/>

			<EditScheduledTransactionModal
				isOpen={!!editingRecurrence}
				onClose={() => setEditingRecurrence(null)}
				onSaveSingle={onSaveSingle}
				onSaveAll={onSaveAll}
				recurrence={editingRecurrence}
				accountsMap={accountsMap}
				categories={categories}
				scheduledTransaction={
					editingRecurrence
						? scheduledItems.find(
								(item) =>
									item.id.toString() ===
									editingRecurrence.scheduledTransactionId
										.value,
							) || null
						: null
				}
			/>

			<DeleteRecurrenceModal
				isOpen={!!deletingRecurrence}
				onClose={() => setDeletingRecurrence(null)}
				onConfirm={handleDelete}
				recurrence={deletingRecurrence}
			/>
		</>
	);
}
