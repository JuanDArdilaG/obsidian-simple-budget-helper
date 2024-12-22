import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { Forward } from "lucide-react";
import { Budget } from "src/budget/Budget";
import { BudgetItem } from "src/budget/BudgetItem";

export const BudgetItemsList = ({
	budgetItems,
	onRecord,
	totalPerMonth,
}: {
	budgetItems: BudgetItem[];
	onRecord: (item: BudgetItem) => void;
	totalPerMonth?: boolean;
}) => {
	return (
		<div>
			<ul>
				{budgetItems.map((item, index) => (
					<li key={index}>
						<span>
							{item.name}
							<br />
							{new Date(item.nextDate).toDateString()}
						</span>
						<span style={{ textAlign: "right" }}>
							{PriceValueObject.fromString(
								item.amount.toString()
							).toString()}
							<span
								style={{
									marginLeft: "8px",
									paddingTop: "20px",
								}}
							>
								<Forward
									style={{
										cursor: "pointer",
									}}
									size={19}
									color="mediumspringgreen"
									onClick={() => {
										item.record();
										onRecord(item);
									}}
								/>
							</span>
							{totalPerMonth ? <br /> : ""}
							{totalPerMonth
								? `Per month ≈ ${new PriceValueObject(
										item.perMonthAmount
								  )}`
								: ""}
							<br />
							<span
								style={{
									color: item.remainingDays.color,
									fontSize: "0.9em",
									marginLeft: "8px",
								}}
							>
								{item.remainingDays.str}
							</span>
						</span>
					</li>
				))}
			</ul>
			<h3>
				Total:{" "}
				{new PriceValueObject(
					totalPerMonth
						? new Budget(budgetItems).getTotalPerMonth()
						: new Budget(budgetItems).getTotal()
				).toString()}
			</h3>
		</div>
	);
};
