import { Logger } from "contexts/Shared";
import { useMemo } from "react";

export const useLogger = (name: string, on: boolean = true) => {
	return useMemo(
		() => new Logger(name, undefined, undefined, on),
		[name, on]
	);
};
