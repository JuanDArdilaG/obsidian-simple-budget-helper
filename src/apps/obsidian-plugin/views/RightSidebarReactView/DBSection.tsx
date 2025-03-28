import { Button } from "@mui/material";
import { useContext } from "react";
import { AppContext } from ".";

export const DBSection = () => {
	const { plugin } = useContext(AppContext);
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
			<Button onClick={async () => await plugin.exportDBBackup()}>
				Export Backup
			</Button>
			<Button onClick={async () => await plugin.importDBBackup()}>
				Import Backup
			</Button>
		</div>
	);
};
