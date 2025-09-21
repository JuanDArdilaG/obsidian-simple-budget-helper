import { createContext } from "react";
import { AwilixContainer } from "awilix";
import { GetTotalPerMonthUseCase } from "contexts/Reports/application/get-total-per-month.usecase";
import { GetTotalUseCase } from "contexts/Reports/application/get-total.usecase";

export type ItemReportContextType = {
	useCases: {
		getTotalPerMonth: GetTotalPerMonthUseCase;
		getTotal: GetTotalUseCase;
	};
};

export const ItemReportContext = createContext<ItemReportContextType>({
	useCases: {
		getTotalPerMonth: {} as GetTotalPerMonthUseCase,
		getTotal: {} as GetTotalUseCase,
	},
});

export const getItemReportContextValues = (
	container: AwilixContainer
): ItemReportContextType => {
	const getTotalPerMonth = container.resolve<GetTotalPerMonthUseCase>(
		"getTotalPerMonthUseCase"
	);
	const getTotal = container.resolve<GetTotalUseCase>("getTotalUseCase");

	return {
		useCases: {
			getTotalPerMonth,
			getTotal,
		},
	};
};
