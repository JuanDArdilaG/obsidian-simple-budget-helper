import { NumberValueObject } from "@juandardilag/value-objects";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Box, IconButton } from "@mui/material";
import { BanknoteArrowDown } from "lucide-react";
import {
	ItemRecurrenceInfo,
	ScheduledTransaction,
} from "../../../../../contexts/ScheduledTransactions/domain";

export const BudgetItemsListActionsMenu = ({
	recurrent,
	setAction,
	setSelectedItem,
	currentAction,
	handleEdit,
	handleDelete,
}: {
	handleEdit?: (e: React.MouseEvent) => Promise<void>;
	handleDelete?: (e: React.MouseEvent) => Promise<void>;
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
			<IconButton
				onClick={handleRecord}
				size="small"
				color={currentAction === "record" ? "primary" : "default"}
			>
				<BanknoteArrowDown fontSize="small" />
			</IconButton>
			{handleEdit !== undefined && (
				<IconButton
					onClick={handleEdit}
					size="small"
					color={currentAction === "edit" ? "primary" : "default"}
				>
					<EditIcon fontSize="small" />
				</IconButton>
			)}
			{handleDelete !== undefined && (
				<IconButton onClick={handleDelete} size="small">
					<DeleteIcon fontSize="small" />
				</IconButton>
			)}
		</Box>
	);
};
