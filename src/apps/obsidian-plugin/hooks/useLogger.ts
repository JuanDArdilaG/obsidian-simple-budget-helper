import { Logger } from "contexts/Shared";

export const useLogger = (name: string) => {
	return new Logger(name);
};
