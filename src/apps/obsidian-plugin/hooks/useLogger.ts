import { Logger } from "contexts/Shared/infrastructure/logger";
import { useCallback, useMemo } from "react";

export const useLogger = (name: string) => {
	const logger = useMemo(() => new Logger(name), [name]);
	const debug = useCallback(
		(title: string, body?: Record<string, any>) =>
			logger.debug(title, body),
		[logger]
	);
	return { logger, debug };
};
