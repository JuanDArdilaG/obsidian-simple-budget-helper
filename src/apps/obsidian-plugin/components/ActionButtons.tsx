import { IconButton } from "@mui/material";
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
			<div
				style={{
					display: "flex",
					justifyContent: "end",
					marginBottom: "10px",
					gap: "10px",
				}}
			>
				{handleRefresh && (
					<IconButton
						style={{
							backgroundColor: "rgba(var(--color-blue-rgb), 0.7)",
							color: "var(--color-base-00)",
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
						style={{
							backgroundColor:
								"rgba(var(--color-green-rgb), 0.7)",
							color: "var(--color-base-00)",
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
			</div>
		)
	);
};
