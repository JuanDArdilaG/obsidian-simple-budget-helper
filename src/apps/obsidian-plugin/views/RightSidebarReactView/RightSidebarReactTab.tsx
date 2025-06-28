import { Box, Typography } from "@mui/material";
import { ActionButtons } from "apps/obsidian-plugin/components/ActionButtons";

export const RightSidebarReactTab = ({
	title,
	subtitle,
	children,
	handleCreate,
	handleRefresh,
	isCreating,
	total,
}: {
	title: string;
	subtitle?: boolean;
	children: React.ReactNode;
	handleCreate?: () => Promise<void>;
	handleRefresh?: () => Promise<void>;
	isCreating?: boolean;
	total?: number;
}) => {
	return (
		<Box
			sx={{
				padding: "10px",
				height: "100%",
				backgroundColor: "var(--background-primary)",
			}}
		>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 2,
				}}
			>
				<Typography
					variant={subtitle ? "h3" : "h2"}
					sx={{
						color: "var(--text-normal)",
						fontWeight: 600,
					}}
				>
					{title}{" "}
					{total !== undefined && (
						<Box
							component="span"
							sx={{
								fontSize: "0.5em",
								fontWeight: "normal",
								paddingLeft: "5px",
								color: "var(--text-muted)",
							}}
						>
							Total: {total}
						</Box>
					)}
				</Typography>
				<ActionButtons
					handleCreate={handleCreate}
					handleRefresh={handleRefresh}
					isCreating={isCreating}
				/>
			</Box>
			{children}
		</Box>
	);
};
