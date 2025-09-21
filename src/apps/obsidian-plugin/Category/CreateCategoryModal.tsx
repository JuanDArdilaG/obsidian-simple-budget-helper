import { Box, Modal } from "@mui/material";
import { CreateCategoryPanel } from "./CreateCategoryPanel";

export const CreateCategoryModal = ({
	onClose,
	onCreate,
	open,
}: {
	onClose: () => void;
	onCreate: () => void;
	open: boolean;
}) => {
	return (
		<Modal
			open={open}
			onClose={onClose}
			aria-labelledby="modal-modal-title"
			aria-describedby="modal-modal-description"
		>
			<Box
				sx={{
					position: "absolute",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					width: 400,
					bgcolor: "var(--background-primary-alt)",
					border: "2px solid #000",
					boxShadow: 24,
					p: 4,
				}}
			>
				<CreateCategoryPanel onCreate={onCreate} />
			</Box>
		</Modal>
	);
};
