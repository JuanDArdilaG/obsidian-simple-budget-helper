import SimpleBudgetHelperPlugin from "apps/obsidian-plugin/main";
import { AwilixContainer } from "awilix";
import { createContext } from "react";

export type AppContextType = {
	plugin: SimpleBudgetHelperPlugin;
	container: AwilixContainer;
};

export const AppContext = createContext<AppContextType>({
	plugin: {} as SimpleBudgetHelperPlugin,
	container: {} as AwilixContainer,
});

export const getAppContextDefault = (
	container: AwilixContainer,
	plugin: SimpleBudgetHelperPlugin
): AppContextType => ({
	plugin,
	container,
});
