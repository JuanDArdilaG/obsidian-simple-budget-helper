export function dateStringToDate(dateString: string): Date {
	const [year, month, day] = dateString.split("-").map(Number);
	return new Date(year, month - 1, day);
}

export function getLastDayOfMonth(year: number, monthIndex: number): number {
	return new Date(year, monthIndex + 1, 0).getDate();
}

const months = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

export function monthAbbrToIndex(monthAbbr: string): number {
	return months.indexOf(monthAbbr);
}

export function monthIndexToAbbr(monthIndex: number): string {
	return months[monthIndex];
}
