import { BudgetItemRecord } from "budget/BudgetItem/BugetItemRecord/BudgetItemRecord";
import { ConfirmationModal } from "./ConfirmationModal";
import { App } from "obsidian";
import { ContextMenu } from "./ContextMenu";

export const AccountingListContextMenu = ({
	record,
	app,
	onEdit,
	onDelete,
	refresh,
}: {
	record: BudgetItemRecord;
	app: App;
	onEdit: (record: BudgetItemRecord) => Promise<void>;
	onDelete: (record: BudgetItemRecord) => Promise<void>;
	refresh: () => Promise<void>;
}) => {
	return (
		<ContextMenu
			menu={
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
						style={{
							cursor: "pointer",
							borderBottom: "1px solid black",
						}}
						onClick={async () => await onEdit(record)}
					>
						Edit
					</li>
					<li
						style={{
							cursor: "pointer",
							borderBottom: "1px solid black",
						}}
						onClick={async () => {
							new ConfirmationModal(app, async (confirm) => {
								if (confirm) {
									await onDelete(record);
								}
							}).open();
							await refresh();
						}}
					>
						Delete
					</li>
				</ul>
			}
		/>
	);
};
