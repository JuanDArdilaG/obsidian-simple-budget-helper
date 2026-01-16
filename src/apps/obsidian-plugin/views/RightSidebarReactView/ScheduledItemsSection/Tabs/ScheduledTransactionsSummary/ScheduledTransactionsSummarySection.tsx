import { PriceValueObject } from "@juandardilag/value-objects";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Typography from "@mui/material/Typography";
import { ChevronDown } from "lucide-react";

export const ScheduledTransactionsSummarySection = ({
	id,
	title,
	color,
	items,
}: {
	id?: string;
	title: string;
	color?: "blue" | "green" | "red";
	items: { name: string; amount: PriceValueObject }[];
}) => {
	return (
		<div>
			<Accordion
				style={{
					background: "var(--background-secondary)",
					borderRadius: "8px",
					marginBottom: "10px",
					border: `2px solid var(--color-${color ?? "base-100"})`,
				}}
			>
				<AccordionSummary
					id={`${id}-header`}
					expandIcon={<ChevronDown />}
				>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							width: "100%",
						}}
					>
						<Typography component="span">{title}</Typography>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "8px",
							}}
						>
							<span
								style={{
									fontSize: "1.3em",
									fontWeight: "bold",
									color: color
										? `var(--color-${color})`
										: undefined,
								}}
							>
								{items
									.reduce((total, rec) => {
										return total.plus(rec.amount);
									}, PriceValueObject.zero())
									.toString()}
							</span>
						</div>
					</div>
				</AccordionSummary>
				<AccordionDetails>
					{items
						.toSorted((a, b) =>
							b.amount.abs().compareTo(a.amount.abs())
						)
						.map((item, index) => (
							<div
								key={item.name}
								style={{
									display: "flex",
									justifyContent: "space-between",
									marginBottom:
										index < items.length - 1
											? "8px"
											: "0px",
								}}
							>
								<span>{item.name}</span>
								<span
									style={{
										fontWeight: "bold",
										minWidth: "80px",
										textAlign: "right",
									}}
								>
									{item.amount.toString()}
								</span>
							</div>
						))}
				</AccordionDetails>
			</Accordion>
		</div>
	);
};
