import { PriceValueObject } from "@juandardilag/value-objects";
import { Chip, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { PriceLabel } from "apps/obsidian-plugin/components/PriceLabel";
import { BudgetItemsListContextMenu } from "apps/obsidian-plugin/views/RightSidebarReactView/ScheduledItemsSection/BudgetItemsListContextMenu";
import {
	AccountBalance,
	AccountID,
	AccountName,
	AccountType,
} from "contexts/Accounts/domain";
import {
	ItemID,
	ItemRecurrenceInfo,
	ScheduledItem,
} from "contexts/Items/domain";
import { Forward } from "lucide-react";

// Reusable responsive scheduled item component
export const ResponsiveScheduledItem = ({
	item,
	recurrence,
	accountName,
	accountBalance,
	accountPrevBalance,
	price,
	isSelected,
	showBalanceInfo = true,
	accountTypeLookup,
	remainingDays,
	setAction,
	setSelectedItem,
	context = "calendar", // "calendar" or "all-items"
	currentAction,
}: {
	item: ScheduledItem;
	recurrence: ItemRecurrenceInfo;
	accountName: AccountName;
	accountBalance?: AccountBalance;
	accountPrevBalance?: AccountBalance;
	price: PriceValueObject;
	isSelected: boolean;
	showBalanceInfo?: boolean;
	accountTypeLookup: (id: AccountID) => AccountType;
	remainingDays?: number;
	setAction: React.Dispatch<
		React.SetStateAction<"edit" | "record" | undefined>
	>;
	setSelectedItem: React.Dispatch<
		React.SetStateAction<
			| { recurrence: ItemRecurrenceInfo; itemID: ItemID }
			| ScheduledItem
			| undefined
		>
	>;
	context?: "calendar" | "all-items";
	currentAction?: "edit" | "record";
}) => {
	const theme = useTheme();
	const isWideScreen = useMediaQuery(theme.breakpoints.up("lg")); // ≥1200px
	const isMediumScreen = useMediaQuery(theme.breakpoints.up("md")); // ≥900px

	// --- AllItemsList style ---
	const totalRecurrences = item.recurrence?.totalRecurrences ?? 1;
	const frequency = item.recurrence?.frequency;
	const prettyDate = recurrence.date.toPrettyFormatDate();
	const itemTags = item.tags?.toArray() ?? [];

	// Use provided remainingDays or calculate it
	const daysRemaining =
		remainingDays ?? recurrence.date.getRemainingDays() ?? 0;
	let remainingDaysColor = "var(--color-green)";
	if (Math.abs(daysRemaining) <= 3)
		remainingDaysColor = "var(--color-yellow)";
	else if (daysRemaining < -3) remainingDaysColor = "var(--color-red)";

	// Wide screen layout (≥1200px) - Multi-column table-like layout
	if (isWideScreen) {
		return (
			<li
				style={{
					width: "100%",
					textAlign: "left",
					padding: "12px 16px",
					cursor: "pointer",
					backgroundColor: isSelected
						? "var(--background-modifier-hover)"
						: "transparent",
					borderRadius: "6px",
					marginBottom: "4px",
					border: "1px solid var(--background-modifier-border)",
				}}
			>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto",
						gap: "16px",
						alignItems: "center",
						width: "100%",
					}}
				>
					{/* Item Name and Details */}
					<div>
						<div style={{ fontWeight: "500", marginBottom: "4px" }}>
							{item.name.toString()}
						</div>
						<div
							style={{
								fontSize: "12px",
								color: "var(--text-muted)",
								marginBottom: "4px",
							}}
						>
							{frequency && `${frequency.toString()} • `}
							{totalRecurrences > 0
								? `x${totalRecurrences}`
								: "∞"}
						</div>
						{/* Tags */}
						{itemTags.length > 0 && (
							<div
								style={{
									display: "flex",
									flexWrap: "wrap",
									gap: "4px",
								}}
							>
								{itemTags.map((tag, index) => (
									<Chip
										key={index}
										label={tag}
										size="small"
										sx={{
											height: "20px",
											fontSize: "10px",
											backgroundColor:
												"var(--background-modifier-border)",
											color: "var(--text-normal)",
											"& .MuiChip-label": {
												padding: "0 6px",
											},
										}}
									/>
								))}
							</div>
						)}
					</div>

					{/* Date and Timing */}
					<div>
						<div style={{ fontSize: "13px", fontWeight: "500" }}>
							{prettyDate}
						</div>
						<div
							style={{
								fontSize: "11px",
								color: remainingDaysColor,
								fontWeight: "500",
							}}
						>
							{recurrence.date.remainingDaysStr}
						</div>
					</div>

					{/* Amount */}
					<div style={{ textAlign: "center" }}>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								gap: "4px",
							}}
						>
							<PriceLabel
								price={price}
								operation={item.operation.type}
							/>
							<Forward
								size={16}
								style={{ color: "var(--color-green)" }}
							/>
						</div>
					</div>

					{/* Account */}
					<div style={{ textAlign: "center" }}>
						<div style={{ fontSize: "13px", fontWeight: "500" }}>
							{accountName.toString()}
						</div>
					</div>

					{/* Balance Change */}
					<div style={{ textAlign: "right" }}>
						{showBalanceInfo &&
						accountBalance &&
						accountPrevBalance ? (
							<>
								<div
									style={{
										fontSize: "12px",
										color: "var(--text-muted)",
										marginBottom: "2px",
									}}
								>
									Balance change:
								</div>
								<div
									style={{
										fontSize: "11px",
										color: "var(--text-muted)",
									}}
								>
									<PriceLabel
										price={accountPrevBalance.value}
									/>
									<span
										style={{
											margin: "0 4px",
											opacity: 0.6,
										}}
									>
										→
									</span>
									<PriceLabel price={accountBalance.value} />
								</div>
							</>
						) : (
							<div
								style={{
									fontSize: "11px",
									color: "var(--text-muted)",
								}}
							>
								Per Month ≈{" "}
								{item
									.getPricePerMonthWithAccountTypes(
										accountTypeLookup
									)
									.toString()}
							</div>
						)}
					</div>

					{/* Actions */}
					<div>
						<BudgetItemsListContextMenu
							recurrent={
								context === "calendar"
									? { recurrence, itemID: item.id }
									: item
							}
							setAction={setAction}
							setSelectedItem={setSelectedItem}
							currentAction={currentAction}
						/>
					</div>
				</div>
			</li>
		);
	}

	// Medium screen layout (≥900px) - Three-column layout
	if (isMediumScreen) {
		return (
			<li
				style={{
					width: "100%",
					textAlign: "left",
					padding: "10px 12px",
					cursor: "pointer",
					backgroundColor: isSelected
						? "var(--background-modifier-hover)"
						: "transparent",
					borderRadius: "6px",
					marginBottom: "3px",
					border: "1px solid var(--background-modifier-border)",
				}}
			>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "2fr 1fr 1fr auto",
						gap: "12px",
						alignItems: "center",
						width: "100%",
					}}
				>
					{/* Left Column - Item Name and Details */}
					<div>
						<div style={{ fontWeight: "500", marginBottom: "4px" }}>
							{item.name.toString()}
						</div>
						<div
							style={{
								fontSize: "12px",
								color: "var(--text-muted)",
								marginBottom: "4px",
							}}
						>
							{frequency && `${frequency.toString()} • `}
							{totalRecurrences > 0
								? `x${totalRecurrences}`
								: "∞"}
						</div>
						{/* Tags */}
						{itemTags.length > 0 && (
							<div
								style={{
									display: "flex",
									flexWrap: "wrap",
									gap: "3px",
								}}
							>
								{itemTags.map((tag, index) => (
									<Chip
										key={index}
										label={tag}
										size="small"
										sx={{
											height: "18px",
											fontSize: "9px",
											backgroundColor:
												"var(--background-modifier-border)",
											color: "var(--text-normal)",
											"& .MuiChip-label": {
												padding: "0 5px",
											},
										}}
									/>
								))}
							</div>
						)}
					</div>

					{/* Middle Column - Date and Timing */}
					<div>
						<div
							style={{
								fontSize: "13px",
								fontWeight: "500",
								marginBottom: "4px",
							}}
						>
							{prettyDate}
						</div>
						<div
							style={{
								fontSize: "11px",
								color: remainingDaysColor,
								fontWeight: "500",
								marginBottom: "4px",
							}}
						>
							{recurrence.date.remainingDaysStr}
						</div>
					</div>

					{/* Right Column - Account, Amount, and Balance */}
					<div style={{ textAlign: "right" }}>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "flex-end",
								gap: "4px",
								marginBottom: "4px",
							}}
						>
							<PriceLabel
								price={price}
								operation={item.operation.type}
							/>
							<Forward
								size={14}
								style={{ color: "var(--color-green)" }}
							/>
						</div>
						<div
							style={{
								fontSize: "13px",
								fontWeight: "500",
								marginBottom: "4px",
							}}
						>
							{accountName.toString()}
						</div>
						{showBalanceInfo &&
						accountBalance &&
						accountPrevBalance ? (
							<div
								style={{
									fontSize: "11px",
									color: "var(--text-muted)",
								}}
							>
								<PriceLabel price={accountPrevBalance.value} />
								<span style={{ margin: "0 2px", opacity: 0.6 }}>
									→
								</span>
								<PriceLabel price={accountBalance.value} />
							</div>
						) : (
							<div
								style={{
									fontSize: "11px",
									color: "var(--text-muted)",
								}}
							>
								Per Month ≈{" "}
								{item
									.getPricePerMonthWithAccountTypes(
										accountTypeLookup
									)
									.toString()}
							</div>
						)}
					</div>

					{/* Actions */}
					<div>
						<BudgetItemsListContextMenu
							recurrent={
								context === "calendar"
									? { recurrence, itemID: item.id }
									: item
							}
							setAction={setAction}
							setSelectedItem={setSelectedItem}
							currentAction={currentAction}
						/>
					</div>
				</div>
			</li>
		);
	}

	// Mobile layout (default) - Original two-column layout
	return (
		<li
			style={{
				width: "100%",
				textAlign: "left",
				padding: 0,
				cursor: "pointer",
				backgroundColor: isSelected
					? "var(--background-modifier-hover)"
					: "transparent",
				borderRadius: "4px",
				marginBottom: "2px",
			}}
		>
			<div className="two-columns-list">
				<span>
					{item.name.toString()}
					{frequency && (
						<span
							className="light-text"
							style={{ paddingLeft: "6px" }}
						>
							{frequency.toString()}
						</span>
					)}
					<span className="light-text" style={{ paddingLeft: "6px" }}>
						{totalRecurrences > 0 ? `x${totalRecurrences}` : "∞"}
					</span>
					<br />
					<span style={{ fontSize: "0.9em", marginLeft: "15px" }}>
						{prettyDate}
						<br />
						<span
							style={{
								marginLeft: "15px",
								color: remainingDaysColor,
							}}
						>
							{recurrence.date.remainingDaysStr}
						</span>
					</span>
					{/* Tags for mobile */}
					{itemTags.length > 0 && (
						<div style={{ marginTop: "4px", marginLeft: "15px" }}>
							<div
								style={{
									display: "flex",
									flexWrap: "wrap",
									gap: "3px",
								}}
							>
								{itemTags.map((tag, index) => (
									<Chip
										key={index}
										label={tag}
										size="small"
										sx={{
											height: "16px",
											fontSize: "8px",
											backgroundColor:
												"var(--background-modifier-border)",
											color: "var(--text-normal)",
											"& .MuiChip-label": {
												padding: "0 4px",
											},
										}}
									/>
								))}
							</div>
						</div>
					)}
				</span>
				<span style={{ textAlign: "right" }}>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "flex-end",
							gap: "4px",
						}}
					>
						<PriceLabel
							price={price}
							operation={item.operation.type}
						/>
						<Forward
							style={{
								cursor: "pointer",
								color: "var(--color-green)",
							}}
							size={19}
						/>
						<BudgetItemsListContextMenu
							recurrent={
								context === "calendar"
									? { recurrence, itemID: item.id }
									: item
							}
							setAction={setAction}
							setSelectedItem={setSelectedItem}
							currentAction={currentAction}
						/>
					</div>
					<div style={{ textAlign: "right" }} className="light-text">
						<div>{accountName.toString()}</div>
						{showBalanceInfo &&
						accountBalance &&
						accountPrevBalance ? (
							<div
								style={{
									fontSize: "11px",
									color: "var(--text-muted)",
								}}
							>
								<PriceLabel price={accountPrevBalance.value} />{" "}
								→ <PriceLabel price={accountBalance.value} />
							</div>
						) : (
							<div
								style={{
									fontSize: "11px",
									color: "var(--text-muted)",
								}}
							>
								Per Month ≈{" "}
								{item
									.getPricePerMonthWithAccountTypes(
										accountTypeLookup
									)
									.toString()}
							</div>
						)}
					</div>
				</span>
			</div>
		</li>
	);
};
