import { MainSections } from "./views";

export type SimpleBudgetHelperSettings = {
	dbId: string;
	defaultCurrency: string;
	debugMode: boolean;
	lastTab: {
		main: MainSections;
		// scheduled: ScheduledItemsSectionSelection;
	};
};

export const DEFAULT_SETTINGS: SimpleBudgetHelperSettings = {
	dbId: "",
	defaultCurrency: "USD",
	debugMode: false,
	lastTab: {
		main: "transactions",
		// scheduled: "calendar",
	},
};
