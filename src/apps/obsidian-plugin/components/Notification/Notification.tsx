import { Alert, AlertColor, Snackbar } from "@mui/material";
import { useState } from "react";

interface NotificationProps {
	open: boolean;
	message: string;
	severity: AlertColor;
	onClose: () => void;
	autoHideDuration?: number;
}

export const Notification = ({
	open,
	message,
	severity,
	onClose,
	autoHideDuration = 6000,
}: NotificationProps) => {
	const getSeverityStyles = (severity: AlertColor) => {
		switch (severity) {
			case "error":
				return {
					backgroundColor: "var(--background-modifier-error)",
					color: "var(--text-error)",
					border: "1px solid var(--text-error)",
					"& .MuiAlert-icon": {
						color: "var(--text-error)",
					},
				};
			case "warning":
				return {
					backgroundColor: "var(--background-modifier-error)",
					color: "var(--text-error)",
					border: "1px solid var(--text-error)",
					"& .MuiAlert-icon": {
						color: "var(--text-error)",
					},
				};
			case "success":
				return {
					backgroundColor: "var(--background-modifier-cover)",
					color: "var(--text-success)",
					border: "1px solid var(--text-success)",
					"& .MuiAlert-icon": {
						color: "var(--text-success)",
					},
				};
			default: // info
				return {
					backgroundColor: "var(--background-modifier-cover)",
					color: "var(--text-normal)",
					border: "1px solid var(--background-modifier-border)",
					"& .MuiAlert-icon": {
						color: "var(--text-muted)",
					},
				};
		}
	};

	return (
		<Snackbar
			open={open}
			autoHideDuration={autoHideDuration}
			onClose={onClose}
			anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
		>
			<Alert
				onClose={onClose}
				severity={severity}
				sx={{
					width: "100%",
					...getSeverityStyles(severity),
				}}
			>
				{message}
			</Alert>
		</Snackbar>
	);
};

// Hook for managing notifications
export const useNotification = () => {
	const [notification, setNotification] = useState<{
		open: boolean;
		message: string;
		severity: AlertColor;
	}>({
		open: false,
		message: "",
		severity: "info",
	});

	const showNotification = (
		message: string,
		severity: AlertColor = "info"
	) => {
		setNotification({
			open: true,
			message,
			severity,
		});
	};

	const hideNotification = () => {
		setNotification((prev) => ({ ...prev, open: false }));
	};

	return {
		notification,
		showNotification,
		hideNotification,
	};
};
