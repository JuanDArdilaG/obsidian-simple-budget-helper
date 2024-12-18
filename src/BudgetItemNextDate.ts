export class BudgetItemNextDate extends Date {
	get remainingDays(): number {
		const now = new Date();
		const date = new Date(this.getTime());
		now.setHours(0, 0, 0, 0);
		date.setHours(0, 0, 0, 0);
		const daysToDate = Math.floor(
			(date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
		);
		return daysToDate;
	}
}
