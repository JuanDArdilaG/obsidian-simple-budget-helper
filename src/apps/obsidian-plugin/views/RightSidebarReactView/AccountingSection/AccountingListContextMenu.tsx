import { App } from "obsidian";
import { ContextMenu } from "apps/obsidian-plugin/components/ContextMenu";
import { Pencil, Trash2 } from "lucide-react";
import { Transaction } from "contexts/Transactions/domain";
import { ConfirmationModal } from "apps/obsidian-plugin/components/ConfirmationModal";

export const AccountingListContextMenu = ({
	transaction,
	app,
	onEdit,
	onDelete,
}: {
	transaction: Transaction;
	app: App;
	onEdit: (_: Transaction) => Promise<void>;
	onDelete: (_: Transaction) => Promise<void>;
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
					<li style={{ marginBottom: "10px" }}>
						{transaction.name.toString()}
					</li>
					<li
						style={{
							cursor: "pointer",
							borderBottom: "1px solid black",
						}}
						onClick={async () => await onEdit(transaction)}
						onKeyDown={async (e) =>
							e.key === "e" && (await onEdit(transaction))
						}
					>
						<Pencil size={16} /> Edit
					</li>
					<li
						style={{
							cursor: "pointer",
							borderBottom: "1px solid black",
						}}
						onClick={async () => {
							new ConfirmationModal(app, async (confirm) => {
								if (confirm) {
									await onDelete(transaction);
								}
							}).open();
						}}
						onKeyDown={async (e) =>
							e.key === "d" &&
							new ConfirmationModal(app, async (confirm) => {
								if (confirm) {
									await onDelete(transaction);
								}
							}).open()
						}
					>
						<Trash2 size={16} /> Delete
					</li>
				</ul>
			}
		/>
	);
};
