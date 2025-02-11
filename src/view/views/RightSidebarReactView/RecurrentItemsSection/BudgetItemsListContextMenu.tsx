import { BudgetItemRecurrent } from "budget/BudgetItem/BudgetItemRecurrent";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";

export const BudgetItemsListContextMenu = ({
	item,
	openFile,
}: {
	item: BudgetItemRecurrent;
	// app: App;
	// onEdit: (record: BudgetItemRecord) => Promise<void>;
	// onDelete: (record: BudgetItemRecord) => Promise<void>;
	openFile: (item: BudgetItem) => Promise<void>;
}) => {
	return (
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
				style={{ cursor: "pointer", borderBottom: "1px solid black" }}
				onClick={async () => await openFile(item)}
			>
				Go to file
			</li>
			{/* <li
				style={{ cursor: "pointer", borderBottom: "1px solid black" }}
				onClick={async () => await onEdit(item)}
			>
				Edit
			</li>
			<li
				style={{ cursor: "pointer", borderBottom: "1px solid black" }}
				onClick={async () => {
					new ConfirmationModal(app, async (result) => {
						if (result) {
							await onDelete(item);
						}
					}).open();
				}}
			>
				Delete
			</li> */}
		</ul>
	);
};
