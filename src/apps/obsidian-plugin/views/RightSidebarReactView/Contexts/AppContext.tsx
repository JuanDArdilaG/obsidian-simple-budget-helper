import {
	DEFAULT_SETTINGS,
	SimpleBudgetHelperSettings,
} from "apps/obsidian-plugin";
import { AwilixContainer } from "awilix";
import { createContext } from "react";

export type AppContextType = {
	settings: SimpleBudgetHelperSettings;
	container: AwilixContainer;
};

export const AppContext = createContext({
	settings: DEFAULT_SETTINGS,
	container: {} as AwilixContainer,
});

export const getAppContextDefault = (
	container: AwilixContainer
): AppContextType => ({
	settings: DEFAULT_SETTINGS,
	container,
});
