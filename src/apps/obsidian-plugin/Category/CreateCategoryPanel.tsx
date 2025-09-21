import { Add as AddIcon, Category as CategoryIcon } from "@mui/icons-material";
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	CircularProgress,
	Collapse,
	Divider,
	IconButton,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { CategoriesContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { Category, CategoryName } from "contexts/Categories/domain";
import { useCallback, useContext, useState } from "react";

export const CreateCategoryPanel = ({ onCreate }: { onCreate: () => void }) => {
	const {
		useCases: { createCategory },
		updateCategoriesWithSubcategories,
		updateCategories,
	} = useContext(CategoriesContext);

	const [name, setName] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isExpanded, setIsExpanded] = useState(false);

	const handleSubmit = useCallback(async () => {
		if (!name.trim()) return;

		setIsLoading(true);
		setError(null);

		try {
			await createCategory.execute(
				Category.create(new CategoryName(name))
			);
			updateCategories();
			updateCategoriesWithSubcategories();
			onCreate();
			setName("");
			setIsExpanded(false);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to create category"
			);
		} finally {
			setIsLoading(false);
		}
	}, [
		name,
		createCategory,
		updateCategories,
		updateCategoriesWithSubcategories,
		onCreate,
	]);

	const handleKeyPress = useCallback(
		(event: React.KeyboardEvent) => {
			if (event.key === "Enter" && name.trim() && !isLoading) {
				handleSubmit();
			}
		},
		[name, isLoading, handleSubmit]
	);

	const toggleExpanded = useCallback(() => {
		setIsExpanded(!isExpanded);
		if (!isExpanded) {
			setError(null);
		}
	}, [isExpanded]);

	const isFormValid = name.trim().length > 0 && name.trim().length <= 50;

	return (
		<Card
			sx={{
				backgroundColor: "var(--background-primary)",
				border: "1px solid var(--background-modifier-border)",
				borderRadius: 2,
				boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
				transition: "all 0.2s ease-in-out",
				"&:hover": {
					boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
				},
			}}
		>
			<CardContent sx={{ p: 0 }}>
				{/* Header with toggle */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						p: 2,
						cursor: "pointer",
						"&:hover": {
							backgroundColor: "var(--background-secondary)",
						},
						borderRadius: "8px 8px 0 0",
					}}
					onClick={toggleExpanded}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<CategoryIcon
							sx={{
								color: "var(--interactive-accent)",
								fontSize: 20,
							}}
						/>
						<Typography
							variant="h6"
							sx={{
								color: "var(--text-normal)",
								fontWeight: 600,
								fontSize: { xs: "1rem", sm: "1.125rem" },
							}}
						>
							Create Category
						</Typography>
					</Box>
					<Tooltip title={isExpanded ? "Collapse" : "Expand"}>
						<IconButton
							size="small"
							sx={{
								color: "var(--text-muted)",
								transform: isExpanded
									? "rotate(45deg)"
									: "rotate(0deg)",
								transition: "transform 0.2s ease-in-out",
							}}
						>
							<AddIcon />
						</IconButton>
					</Tooltip>
				</Box>

				{/* Expandable content */}
				<Collapse in={isExpanded} timeout="auto" unmountOnExit>
					<Divider
						sx={{
							borderColor: "var(--background-modifier-border)",
						}}
					/>

					<Box sx={{ p: 2 }}>
						{/* Error message */}
						{error && (
							<Alert
								severity="error"
								sx={{
									mb: 2,
									backgroundColor:
										"var(--background-modifier-error)",
									color: "var(--text-error)",
									border: "1px solid var(--background-modifier-error)",
									"& .MuiAlert-icon": {
										color: "var(--text-error)",
									},
								}}
							>
								{error}
							</Alert>
						)}

						{/* Name input */}
						<TextField
							fullWidth
							label="Category Name"
							placeholder="Enter category name..."
							value={name}
							onChange={(e) => {
								setName(e.target.value);
								if (error) setError(null);
							}}
							onKeyPress={handleKeyPress}
							size="small"
							disabled={isLoading}
							error={name.length > 50}
							helperText={
								name.length > 50
									? "Name must be 50 characters or less"
									: `${name.length}/50 characters`
							}
							sx={{
								mb: 2,
								"& .MuiOutlinedInput-root": {
									backgroundColor:
										"var(--background-secondary)",
									color: "var(--text-normal)",
									borderRadius: 1,
									"& .MuiOutlinedInput-notchedOutline": {
										borderColor:
											"var(--background-modifier-border)",
										borderWidth: "1px",
									},
									"&:hover .MuiOutlinedInput-notchedOutline":
										{
											borderColor: "var(--text-muted)",
										},
									"&.Mui-focused .MuiOutlinedInput-notchedOutline":
										{
											borderColor:
												"var(--interactive-accent)",
											borderWidth: "2px",
										},
									"&.Mui-error .MuiOutlinedInput-notchedOutline":
										{
											borderColor: "var(--text-error)",
										},
								},
								"& .MuiInputLabel-root": {
									color: "var(--text-muted)",
									"&.Mui-focused": {
										color: "var(--interactive-accent)",
									},
									"&.Mui-error": {
										color: "var(--text-error)",
									},
								},
								"& .MuiFormHelperText-root": {
									color:
										name.length > 50
											? "var(--text-error)"
											: "var(--text-muted)",
									fontSize: "0.75rem",
								},
							}}
						/>

						{/* Action buttons */}
						<Box
							sx={{
								display: "flex",
								gap: 1,
								flexDirection: { xs: "column", sm: "row" },
							}}
						>
							<Button
								variant="contained"
								onClick={handleSubmit}
								disabled={!isFormValid || isLoading}
								startIcon={
									isLoading ? (
										<CircularProgress
											size={16}
											sx={{ color: "inherit" }}
										/>
									) : (
										<AddIcon />
									)
								}
								sx={{
									flex: 1,
									backgroundColor:
										"var(--interactive-accent)",
									color: "var(--text-on-accent)",
									borderRadius: 1,
									textTransform: "none",
									fontWeight: 600,
									py: 1,
									"&:hover": {
										backgroundColor:
											"var(--interactive-accent-hover)",
										transform: "translateY(-1px)",
										boxShadow:
											"0 4px 8px rgba(0, 0, 0, 0.2)",
									},
									"&:disabled": {
										backgroundColor:
											"var(--background-modifier-border)",
										color: "var(--text-muted)",
										transform: "none",
										boxShadow: "none",
									},
									transition: "all 0.2s ease-in-out",
								}}
							>
								{isLoading ? "Creating..." : "Create Category"}
							</Button>

							<Button
								variant="outlined"
								onClick={() => {
									setName("");
									setError(null);
								}}
								disabled={isLoading}
								sx={{
									flex: { xs: 1, sm: "none" },
									borderColor:
										"var(--background-modifier-border)",
									color: "var(--text-normal)",
									borderRadius: 1,
									textTransform: "none",
									py: 1,
									"&:hover": {
										borderColor: "var(--text-muted)",
										backgroundColor:
											"var(--background-secondary)",
									},
									"&:disabled": {
										borderColor:
											"var(--background-modifier-border)",
										color: "var(--text-muted)",
									},
								}}
							>
								Clear
							</Button>
						</Box>

						{/* Help text */}
						<Typography
							variant="caption"
							sx={{
								display: "block",
								mt: 1,
								color: "var(--text-muted)",
								fontSize: "0.75rem",
								lineHeight: 1.4,
							}}
						>
							Categories help organize your content into logical
							groups. You can create subcategories later.
						</Typography>
					</Box>
				</Collapse>
			</CardContent>
		</Card>
	);
};
