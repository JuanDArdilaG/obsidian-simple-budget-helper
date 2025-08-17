import { Box, List, ListItem, Paper, Typography } from "@mui/material";
import { useState } from "react";
import { SearchInput } from "./SearchInput";

interface DemoItem {
	id: string;
	name: string;
	description: string;
	category: string;
}

const demoItems: DemoItem[] = [
	{
		id: "1",
		name: "Grocery Shopping",
		description: "Weekly groceries",
		category: "Food",
	},
	{
		id: "2",
		name: "Gas Station",
		description: "Fuel for car",
		category: "Transportation",
	},
	{
		id: "3",
		name: "Netflix Subscription",
		description: "Monthly streaming",
		category: "Entertainment",
	},
	{
		id: "4",
		name: "Electric Bill",
		description: "Monthly electricity",
		category: "Utilities",
	},
	{
		id: "5",
		name: "Restaurant",
		description: "Dinner out",
		category: "Food",
	},
];

export const SearchDemo = () => {
	const [searchTerm, setSearchTerm] = useState("");

	const filteredItems = demoItems.filter((item) => {
		if (!searchTerm.trim()) return true;

		const searchLower = searchTerm.toLowerCase();
		return (
			item.name.toLowerCase().includes(searchLower) ||
			item.description.toLowerCase().includes(searchLower) ||
			item.category.toLowerCase().includes(searchLower)
		);
	});

	return (
		<Box sx={{ p: 2, maxWidth: 600 }}>
			<Typography variant="h6" gutterBottom>
				Search Demo
			</Typography>
			<Typography variant="body2" color="text.secondary" gutterBottom>
				This demonstrates how the SearchInput component can be used in
				other parts of the application.
			</Typography>

			<Box sx={{ mb: 2 }}>
				<SearchInput
					placeholder="Search items by name, description, or category..."
					onSearch={setSearchTerm}
					debounceMs={300}
				/>
			</Box>

			<Paper sx={{ p: 2 }}>
				<Typography variant="subtitle2" gutterBottom>
					Results ({filteredItems.length} of {demoItems.length})
				</Typography>

				<List>
					{filteredItems.map((item) => (
						<ListItem
							key={item.id}
							sx={{
								flexDirection: "column",
								alignItems: "flex-start",
							}}
						>
							<Typography variant="body1" fontWeight="medium">
								{item.name}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{item.description}
							</Typography>
							<Typography variant="caption" color="text.muted">
								Category: {item.category}
							</Typography>
						</ListItem>
					))}
				</List>

				{filteredItems.length === 0 && searchTerm && (
					<Typography
						variant="body2"
						color="text.secondary"
						textAlign="center"
					>
						No items found matching "{searchTerm}"
					</Typography>
				)}
			</Paper>
		</Box>
	);
};
