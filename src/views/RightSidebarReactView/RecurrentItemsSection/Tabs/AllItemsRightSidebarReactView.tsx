import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { RightSidebarReactTab } from "../../RightSidebarReactTab";
import { Budget } from "budget/Budget/Budget";
import { BudgetItemsList } from "../BudgetItemsList";
import { App } from "obsidian";

export const AllItemsRightSidebarReactTab = ({
	budget,
	onRecord,
	app,
}: {
	budget: Budget<BudgetItem>;
	onRecord: (item: BudgetItem) => void;
	app: App;
}) => {
	return (
		<>
			<RightSidebarReactTab title="All Items">
				<BudgetItemsList
					budgetItems={budget.onlyRecurrent().items.map((item) => ({
						item,
						dates: [item.nextDate],
					}))}
					onRecord={onRecord}
					app={app}
					totalPerMonth
				/>
			</RightSidebarReactTab>
		</>
	);
};
