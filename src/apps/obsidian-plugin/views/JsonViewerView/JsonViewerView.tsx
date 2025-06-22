import React, { useState, useEffect } from "react";
import {
	Box,
	Typography,
	TextField,
	Button,
	Paper,
	Alert,
	CircularProgress,
	IconButton,
	Tooltip,
	Chip,
	Divider,
} from "@mui/material";
import {
	Refresh as RefreshIcon,
	Download as DownloadIcon,
	ContentCopy as CopyIcon,
	ExpandMore as ExpandMoreIcon,
	ExpandLess as ExpandLessIcon,
	Folder as FolderIcon,
} from "@mui/icons-material";
import SimpleBudgetHelperPlugin from "apps/obsidian-plugin/main";
import { TFile } from "obsidian";

interface JsonViewerViewProps {
	plugin: SimpleBudgetHelperPlugin;
	file: TFile | null;
}

interface JsonNodeProps {
	data: unknown;
	label: string;
	level?: number;
}

const JsonNode: React.FC<JsonNodeProps> = ({ data, label, level = 0 }) => {
	const [expanded, setExpanded] = useState(level < 2); // Auto-expand first 2 levels
	const indent = level * 6;

	console.log("JsonNode render:", {
		label,
		data,
		type: typeof data,
		isArray: Array.isArray(data),
	});

	if (data === null) {
		return (
			<Box
				sx={{
					ml: indent,
					display: "flex",
					alignItems: "center",
					py: 0.25,
				}}
			>
				<Typography variant="body2" color="text.secondary">
					{label}: <span style={{ color: "#6c757d" }}>null</span>
				</Typography>
			</Box>
		);
	}

	if (typeof data === "string") {
		return (
			<Box
				sx={{
					ml: indent,
					display: "flex",
					alignItems: "center",
					py: 0.25,
				}}
			>
				<Typography variant="body2" color="text.secondary">
					{label}: <span style={{ color: "#28a745" }}>"{data}"</span>
				</Typography>
			</Box>
		);
	}

	if (typeof data === "number") {
		return (
			<Box
				sx={{
					ml: indent,
					display: "flex",
					alignItems: "center",
					py: 0.25,
				}}
			>
				<Typography variant="body2" color="text.secondary">
					{label}: <span style={{ color: "#007bff" }}>{data}</span>
				</Typography>
			</Box>
		);
	}

	if (typeof data === "boolean") {
		return (
			<Box
				sx={{
					ml: indent,
					display: "flex",
					alignItems: "center",
					py: 0.25,
				}}
			>
				<Typography variant="body2" color="text.secondary">
					{label}:{" "}
					<span style={{ color: "#fd7e14" }}>{data.toString()}</span>
				</Typography>
			</Box>
		);
	}

	if (Array.isArray(data)) {
		return (
			<Box>
				<Box
					sx={{
						ml: indent,
						display: "flex",
						alignItems: "center",
						py: 0.25,
						cursor: "pointer",
						"&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
					}}
					onClick={() => setExpanded(!expanded)}
				>
					{expanded ? (
						<ExpandLessIcon fontSize="small" />
					) : (
						<ExpandMoreIcon fontSize="small" />
					)}
					<FolderIcon
						fontSize="small"
						sx={{ mr: 0.5, color: "#ffc107" }}
					/>
					<Typography variant="body2" color="text.secondary">
						{label}{" "}
						<Chip
							label={`${data.length} items`}
							size="small"
							variant="outlined"
						/>
					</Typography>
				</Box>
				{expanded && (
					<Box>
						{data.map((item, index) => (
							<JsonNode
								key={index}
								data={item}
								label={`[${index}]`}
								level={level + 1}
							/>
						))}
					</Box>
				)}
			</Box>
		);
	}

	if (typeof data === "object" && data !== null) {
		const keys = Object.keys(data as object);
		console.log("Object keys:", keys);
		return (
			<Box>
				<Box
					sx={{
						ml: indent,
						display: "flex",
						alignItems: "center",
						py: 0.25,
						cursor: "pointer",
						"&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
					}}
					onClick={() => setExpanded(!expanded)}
				>
					{expanded ? (
						<ExpandLessIcon fontSize="small" />
					) : (
						<ExpandMoreIcon fontSize="small" />
					)}
					<FolderIcon
						fontSize="small"
						sx={{ mr: 0.5, color: "#17a2b8" }}
					/>
					<Typography variant="body2" color="text.secondary">
						{label}{" "}
						<Chip
							label={`${keys.length} properties`}
							size="small"
							variant="outlined"
						/>
					</Typography>
				</Box>
				{expanded && (
					<Box>
						{keys.map((key) => (
							<JsonNode
								key={key}
								data={(data as Record<string, unknown>)[key]}
								label={key}
								level={level + 1}
							/>
						))}
					</Box>
				)}
			</Box>
		);
	}

	return null;
};

export const JsonViewerView: React.FC<JsonViewerViewProps> = ({
	plugin,
	file,
}) => {
	const [jsonContent, setJsonContent] = useState<string>("");
	const [parsedJson, setParsedJson] = useState<unknown>(null);
	const [error, setError] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(false);
	const [activeFile, setActiveFile] = useState<string>("");
	const [activeTab, setActiveTab] = useState<"raw" | "tree">("raw");

	// Load JSON content from the file prop
	const loadJsonFromFile = async () => {
		if (!file) {
			setError("No file provided to view");
			return;
		}
		if (!file.path.endsWith(".json")) {
			setError("File is not a JSON file");
			return;
		}
		setLoading(true);
		setError("");
		setActiveFile(file.path);
		try {
			const content = await plugin.app.vault.read(file);
			setJsonContent(content);
			parseJson(content);
		} catch (err) {
			setError(`Error reading file: ${err}`);
		} finally {
			setLoading(false);
		}
	};

	// Parse JSON content
	const parseJson = (content: string) => {
		try {
			const parsed = JSON.parse(content);
			setParsedJson(parsed);
			setError("");
		} catch (err) {
			setError(`Invalid JSON: ${err}`);
			setParsedJson(null);
		}
	};

	// Format JSON content
	const formatJson = () => {
		if (parsedJson) {
			const formatted = JSON.stringify(parsedJson, null, 2);
			setJsonContent(formatted);
		}
	};

	// Copy JSON to clipboard
	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(jsonContent);
		} catch {
			setError("Failed to copy to clipboard");
		}
	};

	// Download JSON file
	const downloadJson = () => {
		const blob = new Blob([jsonContent], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = activeFile
			? activeFile.split("/").pop() || "data.json"
			: "data.json";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	// Handle manual JSON input
	const handleJsonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const content = event.target.value;
		setJsonContent(content);
		parseJson(content);
	};

	// Load JSON when component mounts or file changes
	useEffect(() => {
		loadJsonFromFile();
	}, [file]);

	// Debug effect for tree view
	useEffect(() => {
		if (activeTab === "tree" && parsedJson !== null) {
			console.log("Tree view rendering with:", parsedJson);
		}
	}, [activeTab, parsedJson]);

	return (
		<Box
			sx={{
				p: 2,
				height: "100%",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<Typography variant="h5" gutterBottom>
				JSON Viewer
			</Typography>

			{activeFile && (
				<Typography variant="body2" color="text.secondary" gutterBottom>
					Active file: {activeFile}
				</Typography>
			)}

			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}

			<Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
				<Button
					variant="outlined"
					startIcon={<RefreshIcon />}
					onClick={loadJsonFromFile}
					disabled={loading}
				>
					Refresh
				</Button>
				<Button
					variant="outlined"
					onClick={formatJson}
					disabled={!parsedJson}
				>
					Format JSON
				</Button>
				<Tooltip title="Copy to clipboard">
					<IconButton
						onClick={copyToClipboard}
						disabled={!jsonContent}
					>
						<CopyIcon />
					</IconButton>
				</Tooltip>
				<Tooltip title="Download JSON">
					<IconButton onClick={downloadJson} disabled={!jsonContent}>
						<DownloadIcon />
					</IconButton>
				</Tooltip>
			</Box>

			{loading ? (
				<Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
					<CircularProgress />
				</Box>
			) : (
				<Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
					{/* Tab Navigation */}
					<Box
						sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
					>
						<Button
							variant={activeTab === "raw" ? "contained" : "text"}
							onClick={() => setActiveTab("raw")}
							sx={{ mr: 1 }}
						>
							Raw JSON
						</Button>
						<Button
							variant={
								activeTab === "tree" ? "contained" : "text"
							}
							onClick={() => setActiveTab("tree")}
							disabled={!parsedJson}
						>
							Tree View
						</Button>
					</Box>

					{/* Content Area */}
					<Paper sx={{ flex: 1, p: 2, overflow: "auto" }}>
						{activeTab === "raw" ? (
							<TextField
								fullWidth
								multiline
								rows={20}
								value={jsonContent}
								onChange={handleJsonChange}
								variant="outlined"
								placeholder="Enter or paste JSON content here..."
								sx={{
									"& .MuiInputBase-root": {
										fontFamily: "monospace",
										fontSize: "0.875rem",
									},
								}}
							/>
						) : (
							<Box
								sx={{
									fontFamily: "monospace",
									fontSize: "0.8rem",
									p: 1,
								}}
							>
								{parsedJson !== null && (
									<>
										<JsonNode
											data={parsedJson}
											label="root"
										/>
									</>
								)}
							</Box>
						)}
					</Paper>
				</Box>
			)}

			{/* File Info */}
			{parsedJson !== null && (
				<Box sx={{ mt: 2 }}>
					<Divider sx={{ mb: 1 }} />
					<Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
						<Typography variant="body2" color="text.secondary">
							File size: {formatFileSize(jsonContent.length)}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Last modified:{" "}
							{file?.stat?.mtime
								? new Date(file.stat.mtime).toLocaleString()
								: "Unknown"}
						</Typography>
					</Box>
				</Box>
			)}
		</Box>
	);
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
