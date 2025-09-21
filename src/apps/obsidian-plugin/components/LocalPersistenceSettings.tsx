import {
	Backup as BackupIcon,
	CleaningServices as CleanupIcon,
	Delete as DeleteIcon,
	Download as DownloadIcon,
	Info as InfoIcon,
	Restore as RestoreIcon,
	Storage as StorageIcon,
	Sync as SyncIcon,
	Upload as UploadIcon,
	Warning as WarningIcon,
} from "@mui/icons-material";
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControl,
	IconButton,
	InputLabel,
	List,
	ListItem,
	ListItemSecondaryAction,
	ListItemText,
	MenuItem,
	Select,
	TextField,
	Typography,
} from "@mui/material";
import { BackupInfo } from "contexts/Shared/infrastructure/persistence/local/backup-manager";
import { Notice } from "obsidian";
import React, { useEffect, useState } from "react";
import SimpleBudgetHelperPlugin from "../main";

interface LocalPersistenceSettingsProps {
	plugin: SimpleBudgetHelperPlugin; // Obsidian plugin instance
}

export const LocalPersistenceSettings: React.FC<
	LocalPersistenceSettingsProps
> = ({ plugin }) => {
	const [backups, setBackups] = useState<BackupInfo[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [createBackupDialog, setCreateBackupDialog] = useState(false);
	const [restoreBackupDialog, setRestoreBackupDialog] = useState(false);
	const [backupName, setBackupName] = useState("");
	const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(
		null
	);
	const [dataInfo, setDataInfo] = useState<{
		exists: boolean;
		size?: number;
		lastModified?: Date;
	} | null>(null);

	// New state for database operations
	const [exportBackupDialog, setExportBackupDialog] = useState(false);
	const [importBackupDialog, setImportBackupDialog] = useState(false);
	const [exportBackupName, setExportBackupName] = useState("");
	const [selectedImportBackup, setSelectedImportBackup] =
		useState<string>("");
	const [maxBackups, setMaxBackups] = useState<number>(10);
	const [cleanupDialog, setCleanupDialog] = useState(false);

	useEffect(() => {
		loadBackups();
		loadDataInfo();
	}, []);

	const loadBackups = async () => {
		try {
			setLoading(true);
			const backupList = await plugin.db.getBackupList();
			setBackups(backupList);
		} catch (err) {
			setError("Failed to load backups");
			console.error("Failed to load backups:", err);
		} finally {
			setLoading(false);
		}
	};

	const loadDataInfo = async () => {
		try {
			const info = await plugin.db.fileManager.getDataInfo();
			setDataInfo(info);
		} catch (err) {
			console.error("Failed to load data info:", err);
		}
	};

	const handleCreateBackup = async () => {
		try {
			setLoading(true);
			setError(null);

			const name = backupName.trim() || undefined;
			const backupInfo = await plugin.db.createBackup(name);

			if (!backupInfo) {
				setError("No data to backup. Please add some data first.");
				setCreateBackupDialog(false);
				setBackupName("");
				return;
			}

			// Automatically cleanup old backups after creating a new one
			await handleCleanupOldBackups();

			setSuccess("Backup created successfully");
			setCreateBackupDialog(false);
			setBackupName("");
			await loadBackups();
		} catch (err) {
			setError("Failed to create backup");
			console.error("Failed to create backup:", err);
		} finally {
			setLoading(false);
		}
	};

	const handleRestoreBackup = async () => {
		if (!selectedBackup) return;

		try {
			setLoading(true);
			setError(null);

			await plugin.db.restoreFromBackup(selectedBackup.name);

			setSuccess("Backup restored successfully");
			setRestoreBackupDialog(false);
			setSelectedBackup(null);
			await loadDataInfo();
		} catch (err) {
			setError("Failed to restore backup");
			console.error("Failed to restore backup:", err);
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteBackup = async (backup: BackupInfo) => {
		if (
			!confirm(`Are you sure you want to delete backup "${backup.name}"?`)
		) {
			return;
		}

		try {
			setLoading(true);
			setError(null);

			await plugin.db.backupManager.deleteBackup(backup.name);

			setSuccess("Backup deleted successfully");
			await loadBackups();
		} catch (err) {
			setError("Failed to delete backup");
			console.error("Failed to delete backup:", err);
		} finally {
			setLoading(false);
		}
	};

	const handleSync = async () => {
		try {
			setLoading(true);
			setError(null);

			await plugin.db.sync();

			setSuccess("Data synced successfully");
			await loadDataInfo();
		} catch (err) {
			setError("Failed to sync data");
			console.error("Failed to sync data:", err);
		} finally {
			setLoading(false);
		}
	};

	// New handlers for database operations
	const handleExportBackup = async () => {
		try {
			setLoading(true);
			setError(null);

			const name = exportBackupName.trim() || "db.backup";
			const backupInfo = await plugin.exportDBBackup(name);

			if (!backupInfo) {
				setError("No data to export. Please add some data first.");
				setExportBackupDialog(false);
				setExportBackupName("");
				return;
			}

			// Automatically cleanup old backups after exporting
			await handleCleanupOldBackups();

			setSuccess("Database backup exported successfully");
			setExportBackupDialog(false);
			setExportBackupName("");
			await loadBackups();
			const _ = new Notice("Backup exported");
		} catch (err) {
			setError("Failed to export database backup");
			console.error("Failed to export database backup:", err);
		} finally {
			setLoading(false);
		}
	};

	const handleImportBackup = async () => {
		if (!selectedImportBackup) {
			setError("Please select a backup to import");
			return;
		}

		try {
			setLoading(true);
			setError(null);

			await plugin.importDBBackup(selectedImportBackup);

			setSuccess("Database backup imported successfully");
			setImportBackupDialog(false);
			setSelectedImportBackup("");
			await loadDataInfo();
			const _ = new Notice("Backup imported");
		} catch (err) {
			setError("Failed to import database backup");
			console.error("Failed to import database backup:", err);
		} finally {
			setLoading(false);
		}
	};

	// New handler for cleanup
	const handleCleanupOldBackups = async () => {
		try {
			await plugin.db.backupManager.cleanupOldBackups(maxBackups);
		} catch (err) {
			console.error("Failed to cleanup old backups:", err);
		}
	};

	const handleManualCleanup = async () => {
		try {
			setLoading(true);
			setError(null);

			await plugin.db.backupManager.cleanupOldBackups(maxBackups);

			setSuccess(
				`Old backups cleaned up. Keeping ${maxBackups} most recent backups.`
			);
			setCleanupDialog(false);
			await loadBackups();
		} catch (err) {
			setError("Failed to cleanup old backups");
			console.error("Failed to cleanup old backups:", err);
		} finally {
			setLoading(false);
		}
	};

	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	const formatDate = (date: Date): string => {
		return date.toLocaleString();
	};

	return (
		<Box sx={{ p: 2 }}>
			<Typography variant="h5" gutterBottom>
				Local Persistence Settings
			</Typography>

			{error && (
				<Alert
					severity="error"
					sx={{ mb: 2 }}
					onClose={() => setError(null)}
				>
					{error}
				</Alert>
			)}

			{success && (
				<Alert
					severity="success"
					sx={{ mb: 2 }}
					onClose={() => setSuccess(null)}
				>
					{success}
				</Alert>
			)}

			{/* Data Information */}
			<Card sx={{ mb: 2 }}>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						<InfoIcon sx={{ mr: 1, verticalAlign: "middle" }} />
						Data Information
					</Typography>
					{dataInfo && (
						<Box>
							<Box
								display="flex"
								alignItems="center"
								mb={dataInfo.exists ? 0.5 : 0}
							>
								<Typography variant="body2" component="span">
									<strong>Status:</strong>
								</Typography>
								<Chip
									label={
										dataInfo.exists
											? "Available"
											: "Not Found"
									}
									color={
										dataInfo.exists ? "success" : "warning"
									}
									size="small"
									sx={{ ml: 1 }}
								/>
							</Box>
							{dataInfo.exists && (
								<>
									<Typography variant="body2" component="div">
										<strong>Size:</strong>{" "}
										{formatFileSize(dataInfo.size || 0)}
									</Typography>
									<Typography variant="body2" component="div">
										<strong>Last Modified:</strong>{" "}
										{formatDate(
											dataInfo.lastModified || new Date()
										)}
									</Typography>
								</>
							)}
						</Box>
					)}
				</CardContent>
			</Card>

			{/* Database Operations */}
			<Card sx={{ mb: 2 }}>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						<StorageIcon sx={{ mr: 1, verticalAlign: "middle" }} />
						Database Operations
					</Typography>
					<Box sx={{ display: "flex", gap: 2, mb: 2 }}>
						<Button
							variant="contained"
							startIcon={<DownloadIcon />}
							onClick={() => setExportBackupDialog(true)}
							disabled={loading}
						>
							Export Database
						</Button>
						<Button
							variant="contained"
							startIcon={<UploadIcon />}
							onClick={() => setImportBackupDialog(true)}
							disabled={loading}
						>
							Import Database
						</Button>
					</Box>
					<Typography variant="body2" color="text.secondary">
						Export/Import the entire database to/from backup files
					</Typography>
				</CardContent>
			</Card>

			{/* Sync Controls */}
			<Card sx={{ mb: 2 }}>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						<SyncIcon sx={{ mr: 1, verticalAlign: "middle" }} />
						Sync Controls
					</Typography>
					<Button
						variant="contained"
						startIcon={<SyncIcon />}
						onClick={handleSync}
						disabled={loading}
						sx={{ mr: 1 }}
					>
						Sync Data
					</Button>
					<Typography
						variant="body2"
						color="text.secondary"
						sx={{ mt: 1 }}
					>
						Manually sync data between IndexedDB and local files
					</Typography>
				</CardContent>
			</Card>

			{/* Backup Management */}
			<Card>
				<CardContent>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							mb: 2,
						}}
					>
						<Typography variant="h6">
							<BackupIcon
								sx={{ mr: 1, verticalAlign: "middle" }}
							/>
							Backup Management
						</Typography>
						<Box sx={{ display: "flex", gap: 1 }}>
							<Button
								variant="outlined"
								startIcon={<CleanupIcon />}
								onClick={() => setCleanupDialog(true)}
								disabled={loading}
							>
								Cleanup
							</Button>
							<Button
								variant="contained"
								startIcon={<BackupIcon />}
								onClick={() => setCreateBackupDialog(true)}
								disabled={loading}
							>
								Create Backup
							</Button>
						</Box>
					</Box>

					{loading ? (
						<Typography>Loading backups...</Typography>
					) : backups.length === 0 ? (
						<Alert severity="info">
							No backups found. Create your first backup to get
							started.
						</Alert>
					) : (
						<List>
							{backups.map((backup, index) => (
								<React.Fragment key={backup.name}>
									<ListItem>
										<ListItemText
											primary={backup.name}
											secondary={
												<>
													{backup.description && (
														<span
															style={{
																color: "rgba(0, 0, 0, 0.6)",
																fontSize:
																	"0.875rem",
																display:
																	"block",
																marginBottom:
																	"4px",
															}}
														>
															{backup.description}
														</span>
													)}
													<span
														style={{
															color: "rgba(0, 0, 0, 0.6)",
															fontSize:
																"0.875rem",
														}}
													>
														Size:{" "}
														{formatFileSize(
															backup.size
														)}{" "}
														| Created:{" "}
														{formatDate(
															backup.createdAt
														)}
													</span>
												</>
											}
										/>
										<ListItemSecondaryAction>
											<IconButton
												edge="end"
												aria-label="restore"
												onClick={() => {
													setSelectedBackup(backup);
													setRestoreBackupDialog(
														true
													);
												}}
												disabled={loading}
												color="primary"
											>
												<RestoreIcon />
											</IconButton>
											<IconButton
												edge="end"
												aria-label="delete"
												onClick={() =>
													handleDeleteBackup(backup)
												}
												disabled={loading}
												color="error"
											>
												<DeleteIcon />
											</IconButton>
										</ListItemSecondaryAction>
									</ListItem>
									{index < backups.length - 1 && <Divider />}
								</React.Fragment>
							))}
						</List>
					)}
				</CardContent>
			</Card>

			{/* Create Backup Dialog */}
			<Dialog
				open={createBackupDialog}
				onClose={() => setCreateBackupDialog(false)}
			>
				<DialogTitle>Create Backup</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						margin="dense"
						label="Backup Name (optional)"
						fullWidth
						variant="outlined"
						value={backupName}
						onChange={(e) => setBackupName(e.target.value)}
						placeholder="Enter a name for this backup"
					/>
					<Typography
						variant="body2"
						color="text.secondary"
						sx={{ mt: 1 }}
					>
						Leave empty for automatic naming with timestamp
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setCreateBackupDialog(false)}>
						Cancel
					</Button>
					<Button
						onClick={handleCreateBackup}
						variant="contained"
						disabled={loading}
					>
						Create
					</Button>
				</DialogActions>
			</Dialog>

			{/* Restore Backup Dialog */}
			<Dialog
				open={restoreBackupDialog}
				onClose={() => setRestoreBackupDialog(false)}
			>
				<DialogTitle>Restore Backup</DialogTitle>
				<DialogContent>
					<Alert severity="warning" sx={{ mb: 2 }}>
						<WarningIcon sx={{ mr: 1 }} />
						This will replace all current data with the backup data.
						This action cannot be undone.
					</Alert>
					{selectedBackup && (
						<Typography>
							Are you sure you want to restore backup "
							{selectedBackup.name}"?
						</Typography>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setRestoreBackupDialog(false)}>
						Cancel
					</Button>
					<Button
						onClick={handleRestoreBackup}
						variant="contained"
						color="warning"
						disabled={loading}
					>
						Restore
					</Button>
				</DialogActions>
			</Dialog>

			{/* Export Database Dialog */}
			<Dialog
				open={exportBackupDialog}
				onClose={() => setExportBackupDialog(false)}
			>
				<DialogTitle>Export Database</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						margin="dense"
						label="Backup Name"
						fullWidth
						variant="outlined"
						value={exportBackupName}
						onChange={(e) => setExportBackupName(e.target.value)}
						placeholder="Enter a name for the export (e.g., db.backup)"
					/>
					<Typography
						variant="body2"
						color="text.secondary"
						sx={{ mt: 1 }}
					>
						This will export the entire database to a backup file
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setExportBackupDialog(false)}>
						Cancel
					</Button>
					<Button
						onClick={handleExportBackup}
						variant="contained"
						disabled={loading}
					>
						Export
					</Button>
				</DialogActions>
			</Dialog>

			{/* Import Database Dialog */}
			<Dialog
				open={importBackupDialog}
				onClose={() => setImportBackupDialog(false)}
			>
				<DialogTitle>Import Database</DialogTitle>
				<DialogContent>
					<Alert severity="warning" sx={{ mb: 2 }}>
						<WarningIcon sx={{ mr: 1 }} />
						This will replace all current data with the imported
						data. This action cannot be undone.
					</Alert>
					<FormControl fullWidth sx={{ mt: 1 }}>
						<InputLabel>Select Backup to Import</InputLabel>
						<Select
							value={selectedImportBackup}
							label="Select Backup to Import"
							onChange={(e) =>
								setSelectedImportBackup(e.target.value)
							}
						>
							{backups.map((backup) => (
								<MenuItem key={backup.name} value={backup.name}>
									{backup.name} ({formatFileSize(backup.size)}
									)
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<Typography
						variant="body2"
						color="text.secondary"
						sx={{ mt: 1 }}
					>
						Select a backup file to import into the database
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setImportBackupDialog(false)}>
						Cancel
					</Button>
					<Button
						onClick={handleImportBackup}
						variant="contained"
						color="warning"
						disabled={loading || !selectedImportBackup}
					>
						Import
					</Button>
				</DialogActions>
			</Dialog>

			{/* Cleanup Backups Dialog */}
			<Dialog
				open={cleanupDialog}
				onClose={() => setCleanupDialog(false)}
			>
				<DialogTitle>Cleanup Old Backups</DialogTitle>
				<DialogContent>
					<Alert severity="info" sx={{ mb: 2 }}>
						<InfoIcon sx={{ mr: 1 }} />
						This will delete old backups, keeping only the most
						recent ones.
					</Alert>
					<TextField
						margin="dense"
						label="Maximum Backups to Keep"
						type="number"
						fullWidth
						variant="outlined"
						value={maxBackups}
						onChange={(e) =>
							setMaxBackups(parseInt(e.target.value) || 10)
						}
						slotProps={{
							htmlInput: {
								min: 1,
								max: 100,
							},
						}}
						helperText="Oldest backups will be deleted automatically"
					/>
					<Typography
						variant="body2"
						color="text.secondary"
						sx={{ mt: 1 }}
					>
						Currently have {backups.length} backups. Will keep{" "}
						{maxBackups} most recent.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setCleanupDialog(false)}>
						Cancel
					</Button>
					<Button
						onClick={handleManualCleanup}
						variant="contained"
						color="warning"
						disabled={loading || backups.length <= maxBackups}
					>
						Cleanup
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};
