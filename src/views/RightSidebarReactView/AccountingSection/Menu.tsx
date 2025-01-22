import { BudgetItemRecord } from "budget/BudgetItem/BugetItemRecord/BudgetItemRecord";

export const Menu = ({
	record,
	onEdit,
	onDelete,
}: {
	record: BudgetItemRecord;
	onEdit: (record: BudgetItemRecord) => Promise<void>;
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
				onClick={async () => await onEdit(record)}
			>
				Edit
			</li>
			<li
				style={{ cursor: "pointer", borderBottom: "1px solid black" }}
				onClick={async () => await onDelete(record)}
			>
				Delete
			</li>
		</ul>
	);
};
