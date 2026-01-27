import SimpleBudgetHelperPlugin from "apps/obsidian-plugin/main";
import { AppProviders } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import {
	BarChart3,
	CalendarClock,
	LayoutDashboard,
	LayoutList,
	Receipt,
	Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import { LocalPersistenceSettings } from "../../components/LocalPersistenceSettings";
import { AccountsDashboard } from "./AccountsDashboard/AccountsDashboard";
import { CategoriesPage } from "./CategoriesPage/CategoriesPage";
import { ReportsPage } from "./Reports/ReportsPage";
import { ScheduledTransactionsList } from "./ScheduledTransactions/AllList/ScheduledTransactionsList";
import { TransactionsList } from "./TransactionsList/TransactionsList";

export type MainSections =
	| "transactions"
	| "scheduled"
	| "accounts"
	| "categories"
	| "reports"
	| "settings";

export const AppView = ({ plugin }: { plugin: SimpleBudgetHelperPlugin }) => {
	const [currentPage, setCurrentPage] = useState<MainSections>(
		plugin.settings.lastTab.main,
	);

	useEffect(() => {
		if (plugin.settings.lastTab.main !== currentPage) {
			plugin.settings.lastTab.main = currentPage;
			plugin.saveSettings();
		}
	}, [currentPage]);

	const renderPage = () => {
		switch (currentPage) {
			case "transactions":
				return <TransactionsList />;
			case "accounts":
				return <AccountsDashboard />;
			case "scheduled":
				return <ScheduledTransactionsList />;
			case "categories":
				return <CategoriesPage />;
			case "reports":
				return <ReportsPage />;
			case "settings":
				return <LocalPersistenceSettings />;
			default:
				return <TransactionsList />;
		}
	};
	return (
		<AppProviders container={plugin.container} plugin={plugin}>
			<div className="min-h-screen bg-gray-50">
				<Navigation
					currentPage={currentPage}
					onPageChange={setCurrentPage}
				/>
				{renderPage()}
			</div>
		</AppProviders>
	);
};

function NavButton({
	page,
	currentPage,
	onClick,
	icon: Icon,
	children,
	disabled = false,
}: Readonly<{
	page: MainSections;
	currentPage: MainSections;
	onClick: (page: MainSections) => void;
	icon: React.ComponentType<{ size: number }>;
	children: React.ReactNode;
	disabled?: boolean;
}>) {
	const isActive = currentPage === page;
	if (disabled) {
		return (
			<div className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 cursor-not-allowed font-medium text-sm">
				<Icon size={18} />
				<span>{children}</span>
			</div>
		);
	}
	return (
		<button
			onClick={() => onClick(page)}
			className={`flex! items-center! gap-2! px-3! py-2! rounded-lg! transition-all! font-medium! text-sm! whitespace-nowrap! ${isActive ? "bg-indigo-600! text-white! shadow-sm!" : "text-gray-700! hover:bg-gray-100! hover:text-gray-900!"}`}
		>
			<Icon size={18} />
			<span>{children}</span>
		</button>
	);
}

function Navigation({
	currentPage,
	onPageChange,
}: Readonly<{
	currentPage: MainSections;
	onPageChange: (page: MainSections) => void;
}>) {
	return (
		<nav className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16 gap-4">
					{/* Logo */}
					<div className="flex items-center gap-2 flex-shrink-0">
						<div className="w-12 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
							SBH
						</div>
						<h1 className="text-xl! font-bold! text-gray-900! tracking-tight! hidden! sm:block!">
							Accountability
						</h1>
					</div>

					{/* Navigation Buttons */}
					<div className="flex! items-center! gap-1! overflow-x-auto! scrollbar-hide! min-w-0! flex-1! [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
						<NavButton
							page="transactions"
							currentPage={currentPage}
							onClick={onPageChange}
							icon={Receipt}
						>
							Transactions
						</NavButton>
						<NavButton
							page="accounts"
							currentPage={currentPage}
							onClick={onPageChange}
							icon={LayoutDashboard}
						>
							Accounts
						</NavButton>
						<NavButton
							page="scheduled"
							currentPage={currentPage}
							onClick={onPageChange}
							icon={CalendarClock}
						>
							Scheduled
						</NavButton>
						<NavButton
							page="categories"
							currentPage={currentPage}
							onClick={onPageChange}
							icon={LayoutList}
						>
							Categories
						</NavButton>
						<NavButton
							page="reports"
							currentPage={currentPage}
							onClick={onPageChange}
							icon={BarChart3}
						>
							Reports
						</NavButton>
						<NavButton
							page="settings"
							currentPage={currentPage}
							onClick={onPageChange}
							icon={Settings}
						>
							Settings
						</NavButton>
					</div>
				</div>
			</div>
		</nav>
	);
}
