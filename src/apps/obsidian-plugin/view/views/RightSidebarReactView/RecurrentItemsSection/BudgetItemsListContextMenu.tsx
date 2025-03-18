import { BudgetItemRecurrent } from "budget/BudgetItem/BudgetItemRecurrent";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { ContextMenu } from "../AccountingSection/ContextMenu";
import { Pencil, SquareArrowOutUpLeft } from "lucide-react";

export const BudgetItemsListContextMenu = ({
	item,
	openFile,
	setEditionIsActive,
}: {
	item: BudgetItemRecurrent;
	setEditionIsActive: React.Dispatch<React.SetStateAction<boolean>>;
	openFile: (item: BudgetItem) => Promise<void>;
}) => {
	return (
		<ContextMenu
			// hookProps={{
			// 	invalidClickChecker: (e) => {
			// 		Logger.debug(
			// 			"invalidClickChecker",
			// 			{
			// 				innerText: (e.target as HTMLElement)?.innerText,
			// 			},
			// 			{ on: false }
			// 		);
			// 		return (e.target as HTMLElement)?.innerText === "Adjust";
			// 	},
			// }}
			menu={
				<ul
					style={{
						listStyle: "none",
						backgroundColor: "white",
						color: "black",
						padding: "15px",
					}}
				>
					<li style={{ marginBottom: "10px" }}>{item.name}</li>
					<li
						style={{
							cursor: "pointer",
							borderBottom: "1px solid black",
						}}
						onClick={async () => await openFile(item)}
					>
						<SquareArrowOutUpLeft size={16} /> Go to file
					</li>
					<li
						style={{
							cursor: "pointer",
							borderBottom: "1px solid black",
						}}
						onClick={() => setEditionIsActive(true)}
					>
						<Pencil size={16} /> Edit
					</li>

					{/*
		// 	<li
		// 		style={{ cursor: "pointer", borderBottom: "1px solid black" }}
		// 		onClick={async () => {
		// 			new ConfirmationModal(app, async (result) => {
		// 				if (result) {
		// 					await onDelete(item);
		// 				}
		// 			}).open();
		// 		}}
		// 	>
		// 		Delete
		// 	</li> */}
				</ul>
			}
		/>
	);
};
