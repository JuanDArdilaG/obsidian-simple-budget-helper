import { Button } from "@mui/material";
import { useContext } from "react";
import { AppContext } from "./Contexts";
import { Notice } from "obsidian";

export const DBSection = () => {
	const { plugin } = useContext(AppContext);
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
			<Button
				onClick={async () => {
					await plugin.exportDBBackup();
					new Notice("Backup exported");
				}}
			>
				Export Backup
			</Button>
			<Button
				onClick={async () => {
					await plugin.importDBBackup();
					new Notice("Backup imported");
				}}
			>
				Import Backup
			</Button>
		</div>
	);
};
