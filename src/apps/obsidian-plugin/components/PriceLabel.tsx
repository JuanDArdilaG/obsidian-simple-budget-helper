import { PriceValueObject } from "@juandardilag/value-objects";
import { Operation } from "contexts/Shared/domain";
import { useMemo } from "react";

export const PriceLabel = ({
	price,
	operation,
	style,
	className,
}: {
	price: PriceValueObject;
	operation?: Operation;
	style?: React.CSSProperties;
	className?: string;
}) => {
	const color = useMemo(() => {
		if (operation?.isIncome() ?? price.isPositive())
			return "var(--color-green)";
		if (operation?.isExpense() ?? price.isNegative())
			return "var(--color-red)";
		return price.isZero() ? "var(--text-normal)" : "var(--color-blue)";
	}, [price]);

	return (
		<span className={className} style={{ ...style, color }}>
			{price.toString()}
		</span>
	);
};
