import { Item, ItemRecurrenceModification } from "contexts/Items/domain";
import { ContextMenu } from "apps/obsidian-plugin/components/ContextMenu";
import { Pencil } from "lucide-react";
import { useLogger } from "../../../hooks/useLogger";
import { useContext, useMemo } from "react";
import { AppContext, ItemsContext } from "..";
import { ConfirmationModal } from "apps/obsidian-plugin/components/ConfirmationModal";

export const BudgetItemsListContextMenu = ({
	recurrent,
	setAction,
}: {
	recurrent: ItemRecurrenceModification | Item;
	setAction: React.Dispatch<
		React.SetStateAction<"edit" | "record" | undefined>
	>;
}) => {
	const logger = useLogger("BudgetItemsListContextMenu");
	const { plugin } = useContext(AppContext);
	const {
		useCases: { deleteItem },
		scheduledItems,
		updateItems,
	} = useContext(ItemsContext);

	const item = useMemo(() => {
		return scheduledItems.find((i) => i.id.value === recurrent.id.value)!;
	}, [scheduledItems, recurrent.id.value]);

	return (
		<ContextMenu
			hookProps={{
				invalidClickChecker: (e) => {
					return (e.target as HTMLElement)?.innerText === "Adjust";
				},
			}}
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
						onClick={() => setAction("edit")}
					>
						<Pencil size={16} /> Edit
					</li>

					<li
						style={{
							cursor: "pointer",
							borderBottom: "1px solid black",
						}}
						onClick={async () => {
							new ConfirmationModal(
								plugin.app,
								async (confirm) => {
									if (confirm) {
										await deleteItem.execute(recurrent.id);
										updateItems();
									}
								}
							).open();
						}}
					>
						Delete
					</li>
				</ul>
			}
		/>
	);
};
