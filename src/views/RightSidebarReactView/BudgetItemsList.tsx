import { PriceValueObject } from "@juandardilag/value-objects/dist/PriceValueObject";
import { Forward } from "lucide-react";
import { Budget } from "src/Budget";
import { BudgetItem } from "src/BudgetItem";

export const BudgetItemsList = ({
	budgetItems,
}: {
	budgetItems: BudgetItem[];
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
									onClick={() => {}}
								/>
							</span>
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
					new Budget(budgetItems).getTotal()
				).toString()}
			</h3>
		</div>
	);
};
