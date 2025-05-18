import { Item, ItemID, ItemRecurrenceInfo } from "contexts/Items/domain";
import { ContextMenu } from "apps/obsidian-plugin/components/ContextMenu";
import { Pencil } from "lucide-react";
import { useContext, useMemo } from "react";
import { AppContext, ItemsContext } from "..";
import { ConfirmationModal } from "apps/obsidian-plugin/components/ConfirmationModal";

export const BudgetItemsListContextMenu = ({
	recurrent,
	setAction,
}: {
	recurrent: { recurrence: ItemRecurrenceInfo; itemID: ItemID } | Item;
	setAction: React.Dispatch<
		React.SetStateAction<"edit" | "record" | undefined>
	>;
}) => {
	const { plugin } = useContext(AppContext);
	const {
		useCases: { deleteItem },
		scheduledItems,
		updateItems,
	} = useContext(ItemsContext);

	const id = useMemo(
		() => (recurrent instanceof Item ? recurrent.id : recurrent.itemID),
		[recurrent]
	);

	const item = useMemo(() => {
		return scheduledItems.find((i) => i.id.value === id.value)!;
	}, [scheduledItems, id]);

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
										await deleteItem.execute(id);
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
