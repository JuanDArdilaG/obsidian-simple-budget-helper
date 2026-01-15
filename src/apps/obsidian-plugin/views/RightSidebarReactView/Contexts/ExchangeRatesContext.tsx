import { AwilixContainer } from "awilix";
import { createContext } from "react";
import { GetExchangeRateUseCase } from "../../../../../contexts/Currencies/application/get-exchange-rate.usecase";

export type ExchangeRatesContextType = {
	useCases: {
		getExchangeRate: GetExchangeRateUseCase;
	};
};

export const ExchangeRatesContext = createContext<ExchangeRatesContextType>({
	useCases: {
		getExchangeRate: {} as GetExchangeRateUseCase,
	},
});

export const getExchangeRatesContext = (
	container: AwilixContainer
): ExchangeRatesContextType => {
	return {
		useCases: {
			getExchangeRate: container.resolve<GetExchangeRateUseCase>(
				"getExchangeRateUseCase"
			),
		},
	};
};
