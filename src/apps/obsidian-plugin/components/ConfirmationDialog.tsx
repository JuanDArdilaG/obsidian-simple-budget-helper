import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Typography,
} from "@mui/material";
import { Trash2 } from "lucide-react";

interface ConfirmationDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	severity?: "warning" | "error" | "info";
}

export const ConfirmationDialog = ({
	open,
	onClose,
	onConfirm,
	title,
	message,
	confirmText = "Delete",
	cancelText = "Cancel",
	severity = "warning",
}: ConfirmationDialogProps) => {
	const handleConfirm = () => {
		onConfirm();
		onClose();
	};

	const getSeverityColor = () => {
		switch (severity) {
			case "error":
				return "error";
			case "warning":
				return "warning";
			case "info":
				return "info";
			default:
				return "warning";
		}
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			aria-labelledby="confirmation-dialog-title"
			aria-describedby="confirmation-dialog-description"
			maxWidth="sm"
			fullWidth
		>
			<DialogTitle
				id="confirmation-dialog-title"
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 1,
					color: `var(--text-${getSeverityColor()})`,
				}}
			>
				<Trash2 size={20} />
				{title}
			</DialogTitle>
			<DialogContent>
				<Typography id="confirmation-dialog-description">
					{message}
				</Typography>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} color="inherit">
					{cancelText}
				</Button>
				<Button
					onClick={handleConfirm}
					color={getSeverityColor()}
					variant="contained"
					autoFocus
				>
					{confirmText}
				</Button>
			</DialogActions>
		</Dialog>
	);
};
