import SimpleBudgetHelperPlugin from "apps/obsidian-plugin/main";

export const useCommands = ({
	plugin,
}: {
	plugin: SimpleBudgetHelperPlugin;
}) => {
	// useEffect(() => {
	// 	plugin.addCommand({
	// 		id: "display-create-budget-item-modal",
	// 		name: "Create budget item",
	// 		callback: async () => {
	// 			new CreateBudgetItemModalRoot(
	// 				plugin.app,
	// 				budget,
	// 				async (item) => {
	// 					await updateFiles(item, "add");
	// 				}
	// 			).open();
	// 		},
	// 	});
	// }, [plugin, budget, updateFiles]);
};
