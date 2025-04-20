import { Typography } from "@mui/material";
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
		<div style={{ padding: "10px", height: "100%" }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<Typography variant={subtitle ? "h3" : "h2"}>
					{title}{" "}
					{total !== undefined && (
						<span
							style={{
								fontSize: "0.5em",
								fontWeight: "normal",
								paddingLeft: "5px",
							}}
						>
							Total: {total}
						</span>
					)}
				</Typography>
				<ActionButtons
					handleCreate={handleCreate}
					handleRefresh={handleRefresh}
					isCreating={isCreating}
				/>
			</div>
			{children}
		</div>
	);
};
