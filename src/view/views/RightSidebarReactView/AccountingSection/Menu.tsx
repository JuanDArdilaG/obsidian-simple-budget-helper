import { BudgetItemRecord } from "budget/BudgetItem/BugetItemRecord/BudgetItemRecord";
import { ConfirmationModal } from "./ConfirmationModal";
import { App } from "obsidian";

export const Menu = ({
	record,
	app,
	onEdit,
	onDelete,
}: {
	record: BudgetItemRecord;
	app: App;
	onEdit: (record: BudgetItemRecord) => Promise<void>;
	onDelete: (record: BudgetItemRecord) => Promise<void>;
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
			<li style={{ marginBottom: "10px" }}>{record.name}</li>
			<li
				style={{ cursor: "pointer", borderBottom: "1px solid black" }}
				onClick={async () => await onEdit(record)}
			>
				Edit
			</li>
			<li
				style={{ cursor: "pointer", borderBottom: "1px solid black" }}
				onClick={async () => {
					new ConfirmationModal(app, async (result) => {
						if (result) {
							await onDelete(record);
						}
					}).open();
				}}
			>
				Delete
			</li>
		</ul>
	);
};
