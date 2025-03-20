import { createContext, useMemo, useState } from "react";
import { SectionButtons, SidebarSections } from "./SectionButtons";
import { AccountingSection } from "./AccountingSection/AccountingSection";
import { DEFAULT_SETTINGS } from "apps/obsidian-plugin/SettingTab";
import SimpleBudgetHelperPlugin from "apps/obsidian-plugin/main";
import { ActionButtons } from "./ActionButtons";
import { CreateBudgetItemPanel } from "apps/obsidian-plugin/modals";
import { useAsyncCallback } from "apps/obsidian-plugin/view/hooks";
import {
	GetAllCategoriesWithSubCategoriesUseCase,
	GetAllCategoriesWithSubCategoriesUseCaseOutput,
	Category,
} from "contexts/Categories";
import {
	GetAllUniqueItemBrandsUseCase,
	GetAllUniqueItemBrandsUseCaseOutput,
	GetAllUniqueItemStoresUseCase,
	GetAllUniqueItemStoresUseCaseOutput,
} from "contexts/Items/application";
import {
	GetAllAccountsUseCase,
	GetAllAccountsUseCaseOutput,
} from "contexts/Accounts/application";
import { AwilixContainer } from "awilix";
import { Logger } from "contexts";

export const SettingsContext = createContext(DEFAULT_SETTINGS);

export const AppContext = createContext({
	container: {} as AwilixContainer,
	refresh: async () => {},
	categoriesWithSubcategories:
		{} as GetAllCategoriesWithSubCategoriesUseCaseOutput,
	brands: {} as GetAllUniqueItemBrandsUseCaseOutput,
	stores: {} as GetAllUniqueItemStoresUseCaseOutput,
	accounts: {} as GetAllAccountsUseCaseOutput,
	categories: [] as Category[],
});

export const RightSidebarReactView = ({
	container,
	refresh,
	statusBarAddText,
	plugin,
}: {
	container: AwilixContainer<any>;
	plugin: SimpleBudgetHelperPlugin;
	refresh: () => Promise<void>;
	statusBarAddText: (val: string | DocumentFragment) => void;
}) => {
	const [sectionSelection, setSectionSelection] =
		useState<SidebarSections>("accounting");
	const [showCreateForm, setShowCreateForm] = useState(false);

	const getAllCategoriesWithSubCategoriesUseCase = useMemo(
		() =>
			container.resolve(
				"getAllCategoriesWithSubCategoriesUseCase"
			) as GetAllCategoriesWithSubCategoriesUseCase,
		[container]
	);
	const getAllUniqueItemBrandsUseCase = useMemo(
		() =>
			container.resolve(
				"getAllUniqueItemBrandsUseCase"
			) as GetAllUniqueItemBrandsUseCase,
		[container]
	);
	const getAllUniqueItemStoresUseCase = useMemo(
		() =>
			container.resolve(
				"getAllUniqueItemStoresUseCase"
			) as GetAllUniqueItemStoresUseCase,
		[container]
	);
	const getAllAccountsUseCase = useMemo(
		() =>
			container.resolve("getAllAccountsUseCase") as GetAllAccountsUseCase,
		[container]
	);

	const accounts =
		useAsyncCallback<GetAllAccountsUseCaseOutput>(
			getAllAccountsUseCase,
			getAllAccountsUseCase.execute
		) ?? [];
	Logger.debug("accounts initialization", { accounts });
	const categoriesWithSubcategories =
		useAsyncCallback<GetAllCategoriesWithSubCategoriesUseCaseOutput>(
			getAllCategoriesWithSubCategoriesUseCase,
			getAllCategoriesWithSubCategoriesUseCase.execute
		) ?? [];
	const categories = categoriesWithSubcategories.map(
		(catWithSubs) => catWithSubs.category
	);

	const brands =
		useAsyncCallback<GetAllUniqueItemBrandsUseCaseOutput>(
			getAllUniqueItemBrandsUseCase,
			getAllUniqueItemBrandsUseCase.execute
		) ?? [];
	const stores =
		useAsyncCallback<GetAllUniqueItemStoresUseCaseOutput>(
			getAllUniqueItemStoresUseCase,
			getAllUniqueItemStoresUseCase.execute
		) ?? [];

	return (
		<SettingsContext.Provider value={plugin.settings}>
			<AppContext.Provider
				value={{
					container,
					refresh,
					categoriesWithSubcategories,
					brands,
					stores,
					accounts,
					categories,
				}}
			>
				<ActionButtons
					create={async () => setShowCreateForm(!showCreateForm)}
					isCreating={showCreateForm}
				/>
				{showCreateForm && (
					<CreateBudgetItemPanel
						createSimpleItemUseCase={container.resolve(
							"createSimpleItemUseCase"
						)}
						getAllUniqueItemsByNameUseCase={container.resolve(
							"getAllUniqueItemsByNameUseCase"
						)}
						close={() => setShowCreateForm(false)}
					/>
				)}
				<SectionButtons
					selected={sectionSelection}
					setSelected={setSectionSelection}
				/>

				{/* {sectionSelection === "recurrentItems" && (
					<RecurrentItemsSection
						onRecord={() => {}}
						app={plugin.app}
					/>
				)} */}
				{sectionSelection === "accounting" && (
					<AccountingSection
						app={plugin.app}
						statusBarAddText={statusBarAddText}
					/>
				)}
			</AppContext.Provider>
		</SettingsContext.Provider>
	);
};
