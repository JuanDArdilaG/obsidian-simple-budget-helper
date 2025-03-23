import { RecurrentItem } from "contexts/Items";
import { ContextMenu } from "apps/obsidian-plugin/components";
import { Pencil } from "lucide-react";

export const BudgetItemsListContextMenu = ({
	item,
	setEditionIsActive,
}: {
	item: RecurrentItem;
	setEditionIsActive: React.Dispatch<React.SetStateAction<boolean>>;
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
					<li style={{ marginBottom: "10px" }}>
						{item.name.toString()}
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
