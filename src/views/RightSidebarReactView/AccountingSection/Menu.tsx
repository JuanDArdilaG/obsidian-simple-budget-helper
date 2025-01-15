import { BudgetItemRecord } from "budget/BudgetItem/BudgetItemRecord";

export const Menu = ({
	record,
	onDelete,
}: {
	record: BudgetItemRecord;
	onDelete: (record: BudgetItemRecord) => Promise<void>;
}) => {
	return (
		<ul
			style={{
				listStyle: "none",
				backgroundColor: "white",
				color: "black",
				padding: "15px",
			}}
		>
			<li style={{ marginBottom: "10px" }}>{record.name}</li>
			<li
				style={{ cursor: "pointer", borderBottom: "1px solid black" }}
				onClick={async () => await onDelete(record)}
			>
				Eliminar
			</li>
		</ul>
	);
};
