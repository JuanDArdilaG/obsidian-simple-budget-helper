import { MainSidebarSections } from "./components/SectionButtons";
import { ScheduledItemsSectionSelection } from "./views";

export type SimpleBudgetHelperSettings = {
	dbId: string;
	rootFolder: string;
	debugMode: boolean;
	lastTab: {
		main: MainSidebarSections;
		scheduled: ScheduledItemsSectionSelection;
	};
};

export const DEFAULT_SETTINGS: SimpleBudgetHelperSettings = {
	dbId: "",
	rootFolder: "Budget",
	debugMode: false,
	lastTab: {
		main: "accounting",
		scheduled: "calendar",
	},
};
