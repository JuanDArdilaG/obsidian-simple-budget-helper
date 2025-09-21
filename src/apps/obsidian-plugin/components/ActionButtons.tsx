import { Box, IconButton } from "@mui/material";
import { LucideMinus, LucidePlus, RefreshCcw } from "lucide-react";

export const ActionButtons = ({
	handleCreate,
	handleRefresh,
	isCreating,
}: {
	handleCreate?: () => Promise<void>;
	handleRefresh?: () => Promise<void>;
	isCreating?: boolean;
}) => {
	return (
		(handleCreate || handleRefresh) && (
			<Box
				sx={{
					display: "flex",
					justifyContent: "end",
					marginBottom: "10px",
					gap: "10px",
				}}
			>
				{handleRefresh && (
					<IconButton
						sx={{
							backgroundColor: "var(--interactive-accent)",
							color: "var(--text-on-accent)",
							"&:hover": {
								backgroundColor:
									"var(--interactive-accent-hover)",
							},
						}}
						aria-label="refresh"
						onClick={async () => {
							await handleRefresh();
						}}
					>
						<RefreshCcw size={16} strokeWidth={2} />
					</IconButton>
				)}
				{handleCreate && (
					<IconButton
						sx={{
							backgroundColor: "var(--text-success)",
							color: "var(--text-on-accent)",
							"&:hover": {
								backgroundColor: "var(--text-success-hover)",
							},
						}}
						aria-label="create"
						onClick={async () => {
							await handleCreate();
						}}
					>
						{isCreating ? (
							<LucideMinus size={16} strokeWidth={4} />
						) : (
							<LucidePlus size={16} strokeWidth={4} />
						)}
					</IconButton>
				)}
			</Box>
		)
	);
};
