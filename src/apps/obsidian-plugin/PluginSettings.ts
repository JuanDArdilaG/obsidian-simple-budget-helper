import { MainSidebarSections } from "./components/SectionButtons";
import { ScheduledItemsSectionSelection } from "./views";

export type SimpleBudgetHelperSettings = {
	dbId: string;
	defaultCurrency: string;
	debugMode: boolean;
	lastTab: {
		main: MainSidebarSections;
		scheduled: ScheduledItemsSectionSelection;
	};
};

export const DEFAULT_SETTINGS: SimpleBudgetHelperSettings = {
	dbId: "",
	defaultCurrency: "COP",
	debugMode: false,
	lastTab: {
		main: "accounting",
		scheduled: "calendar",
	},
};
