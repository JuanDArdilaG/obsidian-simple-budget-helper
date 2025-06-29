import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Box, IconButton } from "@mui/material";
import { ConfirmationModal } from "apps/obsidian-plugin/components/ConfirmationModal";
import {
	ItemID,
	ItemRecurrenceInfo,
	ScheduledItem,
} from "contexts/Items/domain";
import { useContext, useMemo } from "react";
import { AppContext, ItemsContext } from "..";

export const BudgetItemsListContextMenu = ({
	recurrent,
	setAction,
	setSelectedItem,
	currentAction,
}: {
	recurrent:
		| { recurrence: ItemRecurrenceInfo; itemID: ItemID }
		| ScheduledItem;
	setAction: React.Dispatch<
		React.SetStateAction<"edit" | "record" | undefined>
	>;
	setSelectedItem: React.Dispatch<
		React.SetStateAction<
			| { recurrence: ItemRecurrenceInfo; itemID: ItemID }
			| ScheduledItem
			| undefined
		>
	>;
	currentAction?: "edit" | "record";
}) => {
	const { plugin } = useContext(AppContext);
	const {
		useCases: { deleteItem },
		updateItems,
	} = useContext(ItemsContext);

	const id = useMemo(
		() =>
			recurrent instanceof ScheduledItem
				? recurrent.id
				: recurrent.itemID,
		[recurrent]
	);

	const handleEdit = () => {
		if (currentAction === "edit") {
			// If edit panel is already open, close it
			setSelectedItem(undefined);
			setAction(undefined);
		} else {
			// Open edit panel
			setSelectedItem(recurrent);
			setAction("edit");
		}
	};

	const handleRecord = () => {
		if (currentAction === "record") {
			// If record panel is already open, close it
			setSelectedItem(undefined);
			setAction(undefined);
		} else {
			// Open record panel
			setSelectedItem(recurrent);
			setAction("record");
		}
	};

	const handleDelete = async () => {
		new ConfirmationModal(plugin.app, async (confirm) => {
			if (confirm) {
				await deleteItem.execute(id);
				updateItems();
			}
		}).open();
	};

	return (
		<Box sx={{ display: "flex", gap: "4px" }}>
			<IconButton
				onClick={handleRecord}
				size="small"
				color={currentAction === "record" ? "primary" : "default"}
			>
				<PlayArrowIcon fontSize="small" />
			</IconButton>
			<IconButton
				onClick={handleEdit}
				size="small"
				color={currentAction === "edit" ? "primary" : "default"}
			>
				<EditIcon fontSize="small" />
			</IconButton>
			<IconButton onClick={handleDelete} size="small">
				<DeleteIcon fontSize="small" />
			</IconButton>
		</Box>
	);
};
