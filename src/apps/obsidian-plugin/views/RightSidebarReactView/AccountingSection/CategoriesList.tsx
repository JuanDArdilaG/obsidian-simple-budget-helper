import { useContext, useState } from "react";
import { ActionButtons } from "apps/obsidian-plugin/components/ActionButtons";
import { RightSidebarReactTab } from "../RightSidebarReactTab";
import { CategoriesContext } from "../Contexts";
import { CreateCategoryPanel } from "apps/obsidian-plugin/panels/CreateCategoryPanel";
import { Category } from "contexts/Categories/domain";

export const CategoriesList = () => {
	const { categoriesWithSubcategories, updateCategoriesWithSubcategories } =
		useContext(CategoriesContext);

	const [selectedCategory, setSelectedCategory] = useState<Category>();
	const [showCreateForm, setShowCreateForm] = useState(false);

	return (
		<RightSidebarReactTab title="Accounts" subtitle>
			{/* {selectedCategory && (
				<AccountsListContextMenu
					account={selectedCategory}
					onAdjust={async () => {
						updateCategoriesWithSubcategories()
					}}
				/>
			)} */}

			<ActionButtons
				handleCreateClick={async () =>
					setShowCreateForm(!showCreateForm)
				}
				isCreating={showCreateForm}
			/>
			{showCreateForm && (
				<CreateCategoryPanel
					onCreate={() => {
						updateCategoriesWithSubcategories();
						setShowCreateForm(false);
					}}
				/>
			)}
			<h3>
				Categories
				<span
					style={{
						fontSize: "0.7em",
						fontWeight: "normal",
						paddingLeft: "5px",
					}}
				>
					Total: {categoriesWithSubcategories.length}
				</span>
			</h3>
			<ul>
				{categoriesWithSubcategories
					.sort((catA, catB) =>
						catA.category.name.compare(catB.category.name)
					)
					.map((categoryWithSubCategories, i) => (
						<li
							key={i}
							onContextMenu={() =>
								setSelectedCategory(
									categoryWithSubCategories.category
								)
							}
						>
							<h4>
								{categoryWithSubCategories.category.name.toString()}
							</h4>
							{categoryWithSubCategories.subCategories.map(
								(subCategory, i) => (
									<div key={i}>
										{subCategory.name.toString()}
									</div>
								)
							)}
						</li>
					))}
			</ul>
		</RightSidebarReactTab>
	);
};
