import { LucideMinus, LucidePlus, RefreshCcw } from "lucide-react";
import { useContext } from "react";
import { AppContext } from "./RightSidebarReactView";

export type SidebarSections = "recurrentItems" | "accounting";

export const ActionButtons = ({
	create,
	isCreating,
}: {
	create: () => Promise<void>;
	isCreating: boolean;
}) => {
	const { refresh } = useContext(AppContext);

	return (
		<div>
			<button
				style={{ float: "left" }}
				onClick={async () => {
					await refresh();
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
