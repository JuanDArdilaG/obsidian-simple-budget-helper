export const PLUGIN_INFO = {
	name: "Simple Budget Helper",
	defaultRootFolder: "~simple-budget-helper",
	debugMode: false,
};

export const views = {
	LIST_BUDGET_ITEMS: {
		type: "list-budget-items-view",
		title: "Budget Items",
		icon: "circle-dollar-sign",
	},
	LIST_BUDGET_ITEMS_REACT: {
		type: "list-budget-items-react-view",
		title: "Simple Budget Helper",
		icon: "dice",
	},
	JSON_VIEWER: {
		type: "json-viewer-view",
		title: "JSON Viewer",
		icon: "file-code",
	},
} as const;
