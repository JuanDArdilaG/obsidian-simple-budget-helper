import { CalendarDays, Filter, X } from "lucide-react";
import { memo, useContext, useMemo } from "react";
import { AccountsMap } from "../../../../../contexts/Accounts/application/get-all-accounts.usecase";
import { Nanoid } from "../../../../../contexts/Shared/domain";
import { CategoriesContext } from "../Contexts";

interface TransactionFiltersProps {
	accountsMap: AccountsMap;
	selectedAccounts: Nanoid[];
	onAccountChange: (accountId: Nanoid) => void;
	selectedCategory: string;
	onCategoryChange: (category: string) => void;
	selectedSubcategory: string;
	onSubcategoryChange: (subcategory: string) => void;
	onClearFilters: () => void;
	dateFrom: string;
	dateTo: string;
	onDateFromChange: (date: string) => void;
	onDateToChange: (date: string) => void;
}

const TransactionFiltersComponent = ({
	accountsMap,
	selectedAccounts,
	onAccountChange,
	selectedCategory,
	onCategoryChange,
	selectedSubcategory,
	onSubcategoryChange,
	dateFrom,
	dateTo,
	onDateFromChange,
	onDateToChange,
	onClearFilters,
}: Readonly<TransactionFiltersProps>) => {
	const { categoriesMap, categoriesWithSubcategories } =
		useContext(CategoriesContext);

	const hasActiveFilters = useMemo<boolean>(
		() =>
			selectedAccounts.length > 0 ||
			selectedCategory !== "" ||
			selectedSubcategory !== "" ||
			dateFrom !== "" ||
			dateTo !== "",
		[selectedAccounts, selectedCategory, selectedSubcategory],
	);

	return (
		<div className="bg-white! border-b! border-gray-200! py-4! px-4! sm:px-6! lg:px-8! sticky! top-16! z-10! shadow-sm!">
			<div className="max-w-7xl! mx-auto! flex! flex-wrap! items-center! gap-4!">
				<div className="flex! items-center! gap-2! text-gray-500! text-sm! font-medium! mr-2!">
					<Filter size={16} />
					<span>Filters:</span>
				</div>

				{/* Date Range Filter */}
				<div className="flex items-center gap-1.5">
					<CalendarDays size={14} className="text-gray-400" />
					<input
						type="date"
						value={dateFrom}
						onChange={(e) => onDateFromChange(e.target.value)}
						max={dateTo || undefined}
						className="appearance-none bg-gray-50 border border-gray-300 text-gray-700 py-1.5 px-2.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
					/>
					<span className="text-xs text-gray-400">to</span>
					<input
						type="date"
						value={dateTo}
						onChange={(e) => onDateToChange(e.target.value)}
						min={dateFrom || undefined}
						className="appearance-none bg-gray-50 border border-gray-300 text-gray-700 py-1.5 px-2.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
					/>
				</div>
				{/* Date Tags */}
				{(dateFrom || dateTo) && (
					<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
						{dateFrom && dateTo
							? `${new Date(
									dateFrom + "T00:00",
								).toLocaleDateString(undefined, {
									month: "short",
									day: "numeric",
								})} – ${new Date(
									dateTo + "T00:00",
								).toLocaleDateString(undefined, {
									month: "short",
									day: "numeric",
								})}`
							: dateFrom
								? `From ${new Date(
										dateFrom + "T00:00",
									).toLocaleDateString(undefined, {
										month: "short",
										day: "numeric",
									})}`
								: `Until ${new Date(
										dateTo + "T00:00",
									).toLocaleDateString(undefined, {
										month: "short",
										day: "numeric",
									})}`}
						<button
							onClick={() => {
								onDateFromChange("");
								onDateToChange("");
							}}
							className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-amber-400 hover:bg-amber-200 hover:text-amber-600 focus:outline-none"
						>
							<span className="sr-only">Remove date filter</span>
							<X size={10} />
						</button>
					</span>
				)}

				{/* Account Filter */}
				<div className="relative!">
					<select
						value=""
						onChange={(e) =>
							onAccountChange(new Nanoid(e.target.value))
						}
						className="appearance-none! bg-gray-50! border! border-gray-300! text-gray-700! py-1.5! pl-3! pr-8! rounded-md! text-sm! focus:outline-none! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500!"
					>
						<option value="" disabled>
							Select Account
						</option>
						{Array.from(accountsMap)
							.map(([_, account]) => account)
							.toSorted((a, b) =>
								a.name.value.localeCompare(b.name.value),
							)
							.map((account) => (
								<option key={account.id} value={account.id}>
									{account.name}
								</option>
							))}
					</select>
					<div className="pointer-events-none! absolute! inset-y-0! right-0! flex! items-center! px-2! text-gray-500!">
						<svg
							className="h-4! w-4!"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</div>
				</div>

				{/* Selected Accounts Tags */}
				{selectedAccounts.map((accountId) => {
					const account = accountsMap.get(accountId.value);
					if (!account) return null;
					return (
						<span
							key={accountId.value}
							className="inline-flex! items-center! px-2.5! py-0.5! rounded-full! text-xs! font-medium! bg-indigo-100! text-indigo-800!"
						>
							{account.name.value}
							<button
								onClick={() => onAccountChange(accountId)}
								className="ml-1.5! inline-flex! items-center! justify-center! w-4! h-4! rounded-full! text-indigo-400! hover:bg-indigo-200! hover:text-indigo-600! focus:outline-none!"
							>
								<span className="sr-only!">Remove filter</span>
								<X size={10} />
							</button>
						</span>
					);
				})}

				{/* Category Filter */}
				<div className="relative!">
					<select
						value={selectedCategory}
						onChange={(e) => onCategoryChange(e.target.value)}
						className="appearance-none! bg-gray-50! border! border-gray-300! text-gray-700! py-1.5! pl-3! pr-8! rounded-md! text-sm! focus:outline-none! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500!"
					>
						<option value="">All Categories</option>
						{Array.from(categoriesMap)
							.map(([_, category]) => category)
							.toSorted((a, b) =>
								a.name.value.localeCompare(b.name.value),
							)
							.map((category) => (
								<option key={category.id} value={category.id}>
									{category.name}
								</option>
							))}
					</select>
					<div className="pointer-events-none! absolute! inset-y-0! right-0! flex! items-center! px-2! text-gray-500!">
						<svg
							className="h-4! w-4!"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</div>
				</div>

				{/* Subcategory Filter */}
				{selectedCategory && (
					<div className="relative!">
						<select
							value={selectedSubcategory}
							onChange={(e) =>
								onSubcategoryChange(e.target.value)
							}
							className="appearance-none! bg-gray-50! border! border-gray-300! text-gray-700! py-1.5! pl-3! pr-8! rounded-md! text-sm! focus:outline-none! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500!"
						>
							<option value="">All Subcategories</option>
							{Array.from(
								categoriesWithSubcategories.get(
									selectedCategory,
								)?.subcategories || [],
							)
								.map(([_, subcategory]) => subcategory)
								.toSorted((a, b) =>
									a.name.value.localeCompare(b.name.value),
								)
								.map((subcategory) => (
									<option
										key={subcategory.id}
										value={subcategory.id}
									>
										{subcategory.name}
									</option>
								))}
						</select>
						<div className="pointer-events-none! absolute! inset-y-0! right-0! flex! items-center! px-2! text-gray-500!">
							<svg
								className="h-4! w-4!"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</div>
					</div>
				)}

				{/* Clear Filters */}
				{hasActiveFilters && (
					<button
						onClick={onClearFilters}
						className="text-sm! text-gray-500! hover:text-gray-700! underline! decoration-dotted! underline-offset-2!"
					>
						Clear all filters
					</button>
				)}
			</div>
		</div>
	);
};

export const TransactionFilters = memo(TransactionFiltersComponent);
