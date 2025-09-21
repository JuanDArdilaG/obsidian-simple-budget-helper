import { Button } from "@mui/material";
import { Notice } from "obsidian";
import { useContext } from "react";
import { AppContext } from "./Contexts";

export const DBSection = () => {
	const { plugin } = useContext(AppContext);
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
			<Button
				onClick={async () => {
					await plugin.exportDBBackup();
					const _ = new Notice("Backup exported");
				}}
			>
				Export Backup
			</Button>
			<Button
				onClick={async () => {
					await plugin.importDBBackup();
					const _ = new Notice("Backup imported");
				}}
			>
				Import Backup
			</Button>
		</div>
	);
};
