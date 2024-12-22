import { BudgetItem } from "src/budget/BudgetItem";
import { BudgetItemsList } from "../BudgetItemsList";
import { RightSidebarReactTab } from "./RightSidebarReactTab";
import { Budget } from "src/budget/Budget";

export const AllItemsRightSidebarReactTab = ({
	budget,
	onRecord,
}: {
	budget: Budget;
	onRecord: (item: BudgetItem) => void;
}) => {
	return (
		<>
			<RightSidebarReactTab title="All Items">
				<BudgetItemsList
					budgetItems={budget.items}
					onRecord={onRecord}
					totalPerMonth
				/>
			</RightSidebarReactTab>
		</>
	);
};
