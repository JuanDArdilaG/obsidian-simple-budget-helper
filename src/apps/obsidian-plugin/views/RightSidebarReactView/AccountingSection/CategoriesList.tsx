import {
	Category as CategoryIcon,
	Delete as DeleteIcon,
	ExpandMore,
	MoreVert as MoreVertIcon,
	SubdirectoryArrowRight as SubCategoryIcon,
} from "@mui/icons-material";
import {
	Box,
	Card,
	CardContent,
	Collapse,
	Divider,
	IconButton,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem as MenuItemComponent,
	Tooltip,
	Typography,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import {
	CreateCategoryPanel,
	CreateSubCategoryPanel,
} from "apps/obsidian-plugin/Category";
import { DeleteConfirmationDialog } from "apps/obsidian-plugin/components/DeleteConfirmationDialog/DeleteConfirmationDialog";
import {
	Notification,
	useNotification,
} from "apps/obsidian-plugin/components/Notification";
import { CategoryID } from "contexts/Categories/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { useContext, useState } from "react";
import { CategoriesContext } from "../Contexts";
import { AppContext } from "../Contexts/AppContext";
import { RightSidebarReactTab } from "../RightSidebarReactTab";

interface TransactionSummary {
	id: string;
	name: string;
	amount: number;
	date: string;
	operation: "income" | "expense" | "transfer";
	account?: string;
}

export const CategoriesList = () => {
	const { categoriesWithSubcategories, updateCategoriesWithSubcategories } =
		useContext(CategoriesContext);
	const { container } = useContext(AppContext);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const { notification, showNotification, hideNotification } =
		useNotification();

	const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
		new Set()
	);

	// Delete dialog states
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deleteItem, setDeleteItem] = useState<{
		id: string;
		name: string;
		type: "category" | "subcategory";
	} | null>(null);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [selectedItem, setSelectedItem] = useState<{
		id: string;
		name: string;
		type: "category" | "subcategory";
	} | null>(null);
	const [relatedTransactions, setRelatedTransactions] = useState<
		TransactionSummary[]
	>([]);

	const handleCategoryToggle = (categoryId: string) => {
		const newExpanded = new Set(expandedCategories);
		if (newExpanded.has(categoryId)) {
			newExpanded.delete(categoryId);
		} else {
			newExpanded.add(categoryId);
		}
		setExpandedCategories(newExpanded);
	};

	const handleMenuOpen = (
		event: React.MouseEvent<HTMLElement>,
		item: {
			id: string;
			name: string;
			type: "category" | "subcategory";
		}
	) => {
		setAnchorEl(event.currentTarget);
		setSelectedItem(item);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
		setSelectedItem(null);
	};

	const getTransactionSummaries = async (
		itemId: string,
		itemType: "category" | "subcategory"
	): Promise<TransactionSummary[]> => {
		try {
			const transactionsService = container.resolve(
				"transactionsService"
			);

			if (itemType === "category") {
				const categoryId = new CategoryID(itemId);
				return await transactionsService.getTransactionSummariesByCategory(
					categoryId
				);
			} else {
				const subCategoryId = new SubCategoryID(itemId);
				return await transactionsService.getTransactionSummariesBySubCategory(
					subCategoryId
				);
			}
		} catch (error) {
			console.error("Error fetching related transactions:", error);
			return [];
		}
	};

	const handleDeleteClick = async () => {
		if (selectedItem) {
			// Fetch related transactions before showing dialog
			const transactions = await getTransactionSummaries(
				selectedItem.id,
				selectedItem.type
			);
			setRelatedTransactions(transactions);

			setDeleteItem(selectedItem);
			setDeleteDialogOpen(true);
		}
		handleMenuClose();
	};

	const handleDeleteConfirm = async (reassignToId?: string) => {
		if (!deleteItem) return;
		try {
			if (deleteItem.type === "category") {
				const deleteCategoryUseCase = container.resolve(
					"deleteCategoryUseCase"
				);
				await deleteCategoryUseCase.execute(
					new CategoryID(deleteItem.id),
					reassignToId ? new CategoryID(reassignToId) : undefined
				);
			} else if (deleteItem.type === "subcategory") {
				const deleteSubCategoryUseCase = container.resolve(
					"deleteSubCategoryUseCase"
				);
				await deleteSubCategoryUseCase.execute(
					new SubCategoryID(deleteItem.id),
					reassignToId ? new SubCategoryID(reassignToId) : undefined
				);
			}
			await updateCategoriesWithSubcategories();
			showNotification(
				`${
					deleteItem.type.charAt(0).toUpperCase() +
					deleteItem.type.slice(1)
				} "${deleteItem.name}" deleted successfully${
					reassignToId ? " and related items reassigned" : ""
				}`,
				"success"
			);
		} catch (error) {
			console.error("Error deleting item:", error);
			showNotification(
				`Failed to delete ${deleteItem.type}: ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
				"error"
			);
		}
	};

	const handleDeleteDialogClose = () => {
		setDeleteDialogOpen(false);
		setDeleteItem(null);
		setRelatedTransactions([]);
	};

	const sortedCategories = categoriesWithSubcategories.toSorted(
		(catA, catB) => catA.category.name.compareTo(catB.category.name)
	);

	// Prepare available reassignments for the delete dialog
	const getAvailableReassignments = () => {
		const reassignments: Array<{
			id: string;
			name: string;
			type: "category" | "subcategory";
		}> = [];

		if (!deleteItem) {
			return reassignments;
		}

		if (deleteItem.type === "category") {
			// When deleting a category, show all other categories as options
			sortedCategories.forEach((cat) => {
				if (cat.category.id.value !== deleteItem.id) {
					reassignments.push({
						id: cat.category.id.value,
						name: cat.category.name.toString(),
						type: "category" as const,
					});
				}
			});
		} else if (deleteItem.type === "subcategory") {
			// When deleting a subcategory, show all categories and all other subcategories

			// Add all categories as options
			sortedCategories.forEach((cat) => {
				reassignments.push({
					id: cat.category.id.value,
					name: cat.category.name.toString(),
					type: "category" as const,
				});
			});

			// Add all subcategories (excluding the one being deleted)
			sortedCategories.forEach((cat) => {
				cat.subCategories.forEach((subCat) => {
					if (subCat.id.value !== deleteItem.id) {
						reassignments.push({
							id: subCat.id.value,
							name: `${cat.category.name.toString()} > ${subCat.name.toString()}`,
							type: "subcategory" as const,
						});
					}
				});
			});
		}

		return reassignments;
	};

	return (
		<>
			<RightSidebarReactTab
				title="Categories"
				total={categoriesWithSubcategories.length}
				handleRefresh={async () => updateCategoriesWithSubcategories()}
			>
				{/* Creation panels section */}
				<Box
					sx={{
						display: "flex",
						flexDirection: { xs: "column", md: "row" },
						gap: 2,
						mb: 4,
						p: 1,
					}}
				>
					<Box sx={{ flex: { xs: "none", md: 1 } }}>
						<CreateCategoryPanel
							onCreate={() => {
								updateCategoriesWithSubcategories();
							}}
						/>
					</Box>

					<Box sx={{ flex: { xs: "none", md: 1 } }}>
						<CreateSubCategoryPanel
							onCreate={() => {
								updateCategoriesWithSubcategories();
							}}
						/>
					</Box>
				</Box>

				{/* Categories list section */}
				<Box
					sx={{
						maxHeight: "calc(100vh - 200px)",
						overflowY: "auto",
						mt: 2,
						"&::-webkit-scrollbar": {
							width: "6px",
						},
						"&::-webkit-scrollbar-track": {
							background: "var(--background-secondary)",
							borderRadius: "3px",
						},
						"&::-webkit-scrollbar-thumb": {
							background: "var(--background-modifier-border)",
							borderRadius: "3px",
							"&:hover": {
								background: "var(--text-muted)",
							},
						},
					}}
				>
					{sortedCategories.map((categoryWithSubCategories) => {
						const categoryId =
							categoryWithSubCategories.category.id.value;
						const isExpanded = expandedCategories.has(categoryId);
						const hasSubCategories =
							categoryWithSubCategories.subCategories.length > 0;

						return (
							<Card
								key={categoryId}
								sx={{
									mb: 1.5,
									borderRadius: 2,
									backgroundColor:
										"var(--background-primary)",
									border: "1px solid var(--background-modifier-border)",
									boxShadow: "none",
									"&:hover": {
										borderColor: "var(--text-muted)",
										transition:
											"border-color 0.2s ease-in-out",
									},
								}}
							>
								<CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
									<ListItem
										sx={{
											p: 0,
											cursor: hasSubCategories
												? "pointer"
												: "default",
										}}
										onClick={() =>
											hasSubCategories &&
											handleCategoryToggle(categoryId)
										}
									>
										<ListItemIcon sx={{ minWidth: 40 }}>
											<CategoryIcon
												sx={{
													fontSize: isMobile
														? 20
														: 24,
													color: "var(--interactive-accent)",
												}}
											/>
										</ListItemIcon>
										<ListItemText
											primary={
												<Typography
													variant={
														isMobile ? "h6" : "h5"
													}
													sx={{
														fontWeight: 600,
														color: "var(--text-normal)",
													}}
												>
													{categoryWithSubCategories.category.name.toString()}
												</Typography>
											}
											secondary={
												<Typography
													variant="body2"
													sx={{
														mt: 0.5,
														color: "var(--text-muted)",
													}}
												>
													{
														categoryWithSubCategories
															.subCategories
															.length
													}{" "}
													subcategor
													{categoryWithSubCategories
														.subCategories
														.length !== 1
														? "ies"
														: "y"}
												</Typography>
											}
										/>
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												gap: 1,
											}}
										>
											{hasSubCategories && (
												<IconButton
													size="small"
													sx={{
														transform: isExpanded
															? "rotate(180deg)"
															: "rotate(0deg)",
														transition:
															"transform 0.2s ease-in-out",
														color: "var(--text-muted)",
														"&:hover": {
															backgroundColor:
																"var(--background-modifier-hover)",
														},
													}}
												>
													<ExpandMore />
												</IconButton>
											)}
											<Tooltip title="More options">
												<IconButton
													size="small"
													onClick={(e) => {
														e.stopPropagation();
														handleMenuOpen(e, {
															id: categoryId,
															name: categoryWithSubCategories.category.name.toString(),
															type: "category",
														});
													}}
													sx={{
														color: "var(--text-muted)",
														"&:hover": {
															backgroundColor:
																"var(--background-modifier-hover)",
														},
													}}
												>
													<MoreVertIcon />
												</IconButton>
											</Tooltip>
										</Box>
									</ListItem>

									{hasSubCategories && (
										<>
											<Divider
												sx={{
													my: 1.5,
													borderColor:
														"var(--background-modifier-border)",
												}}
											/>
											<Collapse
												in={isExpanded}
												timeout="auto"
												unmountOnExit
											>
												<List
													sx={{
														pl: isMobile ? 2 : 3,
													}}
												>
													{categoryWithSubCategories.subCategories
														.toSorted((a, b) =>
															a.name.compareTo(
																b.name
															)
														)
														.map((subCategory) => (
															<ListItem
																key={
																	subCategory
																		.id
																		.value
																}
																sx={{
																	p: isMobile
																		? "8px 0"
																		: "12px 0",
																	borderRadius: 1,
																	"&:hover": {
																		backgroundColor:
																			"var(--background-modifier-hover)",
																	},
																}}
															>
																<ListItemIcon
																	sx={{
																		minWidth: 32,
																	}}
																>
																	<SubCategoryIcon
																		sx={{
																			fontSize:
																				isMobile
																					? 16
																					: 18,
																			color: "var(--text-muted)",
																		}}
																	/>
																</ListItemIcon>
																<ListItemText
																	primary={
																		<Typography
																			variant={
																				isMobile
																					? "body2"
																					: "body1"
																			}
																			sx={{
																				fontWeight: 500,
																				color: "var(--text-normal)",
																			}}
																		>
																			{subCategory.name.toString()}
																		</Typography>
																	}
																/>
																<Tooltip title="More options">
																	<IconButton
																		size="small"
																		onClick={(
																			e
																		) => {
																			e.stopPropagation();
																			handleMenuOpen(
																				e,
																				{
																					id: subCategory
																						.id
																						.value,
																					name: subCategory.name.toString(),
																					type: "subcategory",
																				}
																			);
																		}}
																		sx={{
																			color: "var(--text-muted)",
																			"&:hover":
																				{
																					backgroundColor:
																						"var(--background-modifier-hover)",
																				},
																		}}
																	>
																		<MoreVertIcon />
																	</IconButton>
																</Tooltip>
															</ListItem>
														))}
												</List>
											</Collapse>
										</>
									)}
								</CardContent>
							</Card>
						);
					})}

					{sortedCategories.length === 0 && (
						<Box
							sx={{
								textAlign: "center",
								py: 4,
								color: "var(--text-muted)",
							}}
						>
							<CategoryIcon
								sx={{
									fontSize: 48,
									mb: 2,
									opacity: 0.5,
									color: "var(--text-muted)",
								}}
							/>
							<Typography
								variant="h6"
								gutterBottom
								sx={{ color: "var(--text-normal)" }}
							>
								No categories yet
							</Typography>
							<Typography
								variant="body2"
								sx={{ color: "var(--text-muted)" }}
							>
								Create your first category to get started
							</Typography>
						</Box>
					)}
				</Box>

				{/* More options menu */}
				<Menu
					anchorEl={anchorEl}
					open={Boolean(anchorEl)}
					onClose={handleMenuClose}
					anchorOrigin={{
						vertical: "bottom",
						horizontal: "right",
					}}
					transformOrigin={{
						vertical: "top",
						horizontal: "right",
					}}
					sx={{
						"& .MuiPaper-root": {
							backgroundColor: "var(--background-primary)",
							border: "1px solid var(--background-modifier-border)",
							color: "var(--text-normal)",
						},
					}}
				>
					<MenuItemComponent
						onClick={handleDeleteClick}
						sx={{
							color: "var(--text-error)",
							"&:hover": {
								backgroundColor:
									"var(--background-modifier-error)",
								color: "var(--text-on-accent)",
							},
						}}
					>
						<DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
						Delete {selectedItem?.type}
					</MenuItemComponent>
				</Menu>

				{/* Delete confirmation dialog */}
				<DeleteConfirmationDialog
					open={deleteDialogOpen}
					onClose={handleDeleteDialogClose}
					onConfirm={handleDeleteConfirm}
					title={`Delete ${deleteItem?.type}`}
					message={`Are you sure you want to delete this ${deleteItem?.type}?`}
					itemName={deleteItem?.name || ""}
					itemType={deleteItem?.type || "category"}
					availableReassignments={getAvailableReassignments()}
					hasRelatedItems={relatedTransactions.length > 0}
					relatedTransactions={relatedTransactions}
				/>
			</RightSidebarReactTab>

			{/* Notification */}
			<Notification
				open={notification.open}
				message={notification.message}
				severity={notification.severity}
				onClose={hideNotification}
			/>
		</>
	);
};
