import { LucideMinus, LucidePlus, RefreshCcw } from "lucide-react";
import { useContext } from "react";
import { BudgetContext } from "./RightSidebarReactView";

export type SidebarSections = "recurrentItems" | "accounting";

export const ActionButtons = ({
	refresh,
	create,
	isCreating,
}: {
	refresh: () => Promise<void>;
	create: () => Promise<void>;
	isCreating: boolean;
}) => {
	const { updateBudget } = useContext(BudgetContext);

	return (
		<div>
			<button
				style={{ float: "left" }}
				onClick={async () => {
					await refresh();
					await updateBudget();
				}}
			>
				<RefreshCcw size={16} />
			</button>
			<button
				style={{ float: "right" }}
				onClick={async () => {
					await create();
				}}
			>
				{isCreating ? (
					<LucideMinus size={16} />
				) : (
					<LucidePlus size={16} />
				)}
			</button>
		</div>
	);
};
