import { useContext, useState } from "react";
import { CategoriesContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { Category, CategoryName } from "contexts/Categories/domain";
import { SubCategory, SubCategoryName } from "contexts/Subcategories/domain";
import { useCategorySelect } from "../components/Select/useCategorySelect";
import { Input } from "apps/obsidian-plugin/components/Input/Input";

export const CreateCategoryPanel = ({ onCreate }: { onCreate: () => void }) => {
	const {
		useCases: { createCategory, createSubCategory },
		updateCategoriesWithSubcategories,
	} = useContext(CategoriesContext);

	const [name, setName] = useState("");
	const { CategorySelect, category } = useCategorySelect({});

	const handleSubmit = () => async () => {
		if (!category) {
			await createCategory.execute(
				Category.create(new CategoryName(name))
			);
		} else {
			await createSubCategory.execute(
				SubCategory.create(category.id, new SubCategoryName(name))
			);
		}

		updateCategoriesWithSubcategories();
		onCreate();
		setName("");
	};

	return (
		<div className="create-budget-item-modal">
			<h1>Create {category ? "SubCategory" : "Category"}</h1>
			{CategorySelect}
			<Input
				id="name"
				label="Name"
				value={name}
				onChange={(name) => setName(name)}
			/>
			<button onClick={handleSubmit()}>Create</button>
		</div>
	);
};
