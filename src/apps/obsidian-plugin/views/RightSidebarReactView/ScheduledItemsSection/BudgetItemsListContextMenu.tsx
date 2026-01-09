import { NumberValueObject } from "@juandardilag/value-objects";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Box, IconButton } from "@mui/material";
import { useContext } from "react";
import {
	ItemRecurrenceInfo,
	ScheduledTransaction,
} from "../../../../../contexts/ScheduledTransactions/domain";
import { ConfirmationModal } from "../../../components/ConfirmationModal";
import { AppContext } from "../Contexts";

export const BudgetItemsListContextMenu = ({
	recurrent,
	setAction,
	setSelectedItem,
	currentAction,
	handleDelete,
}: {
	handleDelete?: () => Promise<void>;
	recurrent:
		| {
				recurrence: ItemRecurrenceInfo;
				n?: NumberValueObject;
		  }
		| ScheduledTransaction;
	setAction: React.Dispatch<
		React.SetStateAction<"edit" | "record" | undefined>
	>;
	setSelectedItem: React.Dispatch<
		React.SetStateAction<
			| {
					recurrence: ItemRecurrenceInfo;
					n?: NumberValueObject;
			  }
			| ScheduledTransaction
			| undefined
		>
	>;
	currentAction?: "edit" | "record";
}) => {
	const { plugin } = useContext(AppContext);
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

	return (
		<Box sx={{ display: "flex", gap: "4px" }}>
			{!(recurrent instanceof ScheduledTransaction) && (
				<>
					<IconButton
						onClick={handleRecord}
						size="small"
						color={
							currentAction === "record" ? "primary" : "default"
						}
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
				</>
			)}
			{handleDelete !== undefined && (
				<IconButton
					onClick={() => {
						console.log("Deleting scheduled item", recurrent);
						new ConfirmationModal(plugin.app, async (confirm) => {
							if (confirm) await handleDelete();
						}).open();
					}}
					size="small"
				>
					<DeleteIcon fontSize="small" />
				</IconButton>
			)}
		</Box>
	);
};
