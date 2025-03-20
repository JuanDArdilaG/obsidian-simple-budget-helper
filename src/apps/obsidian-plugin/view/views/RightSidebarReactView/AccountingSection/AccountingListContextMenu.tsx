import { ConfirmationModal } from "./ConfirmationModal";
import { App } from "obsidian";
import { ContextMenu } from "./ContextMenu";
import { Pencil, Trash2 } from "lucide-react";
import { Transaction } from "contexts/Transactions/domain";
import { useContext } from "react";
import { AppContext } from "../RightSidebarReactView";

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
	const { refresh } = useContext(AppContext);

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
							await refresh();
						}}
					>
						<Trash2 size={16} /> Delete
					</li>
				</ul>
			}
		/>
	);
};
