import { useContext, useState } from "react";
import { RightSidebarReactTab } from "../RightSidebarReactTab";
import { CategoriesContext } from "../Contexts";
import { CreateCategoryPanel } from "apps/obsidian-plugin/Category/CreateCategoryPanel";
import { List, ListItem, Typography } from "@mui/material";

export const CategoriesList = () => {
	const { categoriesWithSubcategories, updateCategoriesWithSubcategories } =
		useContext(CategoriesContext);

	const [showCreateForm, setShowCreateForm] = useState(false);

	return (
		<RightSidebarReactTab
			title="Categories"
			total={categoriesWithSubcategories.length}
			handleCreate={async () => setShowCreateForm(!showCreateForm)}
			handleRefresh={async () => updateCategoriesWithSubcategories()}
			isCreating={showCreateForm}
		>
			{showCreateForm && (
				<CreateCategoryPanel
					onCreate={() => {
						updateCategoriesWithSubcategories();
						setShowCreateForm(false);
					}}
				/>
			)}
			<List>
				{categoriesWithSubcategories
					.toSorted((catA, catB) =>
						catA.category.name.compareTo(catB.category.name)
					)
					.map((categoryWithSubCategories) => (
						<ListItem
							key={categoryWithSubCategories.category.id.value}
						>
							<Typography variant="h4">
								{categoryWithSubCategories.category.name.toString()}
							</Typography>
							<List>
								{categoryWithSubCategories.subCategories.map(
									(subCategory, i) => (
										<ListItem key={subCategory.id.value}>
											{subCategory.name.toString()}
										</ListItem>
									)
								)}
							</List>
						</ListItem>
					))}
			</List>
		</RightSidebarReactTab>
	);
};
