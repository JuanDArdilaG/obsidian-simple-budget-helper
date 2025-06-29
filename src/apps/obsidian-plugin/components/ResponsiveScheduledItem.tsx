import { PriceValueObject } from "@juandardilag/value-objects";
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { PriceLabel } from "apps/obsidian-plugin/components/PriceLabel";
import {
	AccountBalance,
	AccountID,
	AccountName,
	AccountType,
} from "contexts/Accounts/domain";
import { ItemRecurrenceInfo, ScheduledItem } from "contexts/Items/domain";
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
	onClick,
	onContextMenu,
	showBalanceInfo = true,
	accountTypeLookup,
	remainingDays,
}: {
	item: ScheduledItem;
	recurrence: ItemRecurrenceInfo;
	accountName: AccountName;
	accountBalance?: AccountBalance;
	accountPrevBalance?: AccountBalance;
	price: PriceValueObject;
	isSelected: boolean;
	onClick: () => void;
	onContextMenu: (e: React.MouseEvent) => void;
	showBalanceInfo?: boolean;
	accountTypeLookup: (id: AccountID) => AccountType;
	remainingDays?: number;
}) => {
	const theme = useTheme();
	const isWideScreen = useMediaQuery(theme.breakpoints.up("lg")); // ≥1200px
	const isMediumScreen = useMediaQuery(theme.breakpoints.up("md")); // ≥900px

	// --- AllItemsList style ---
	const totalRecurrences = item.recurrence?.totalRecurrences ?? 1;
	const frequency = item.recurrence?.frequency;
	const prettyDate = recurrence.date.toPrettyFormatDate();

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
				onClick={onClick}
				onContextMenu={onContextMenu}
			>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
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
							}}
						>
							{frequency && `${frequency.toString()} • `}
							{totalRecurrences > 0
								? `x${totalRecurrences}`
								: "∞"}
						</div>
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
				onClick={onClick}
				onContextMenu={onContextMenu}
			>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "2fr 1fr 1fr",
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
							}}
						>
							{frequency && `${frequency.toString()} • `}
							{totalRecurrences > 0
								? `x${totalRecurrences}`
								: "∞"}
						</div>
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
			onClick={onClick}
			onContextMenu={onContextMenu}
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
				</span>
				<span style={{ textAlign: "right" }}>
					<PriceLabel price={price} operation={item.operation.type} />
					<Forward
						style={{
							cursor: "pointer",
							color: "var(--color-green)",
						}}
						size={19}
					/>
					<br />
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
