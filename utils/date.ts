export function dateStringToDate(dateString: string): Date {
	const [year, month, day] = dateString.split("-").map(Number);
	return new Date(year, month - 1, day);
}

export function monthAbbrToIndex(monthAbbr: string): number {
	return 0;
	// return months.indexOf(monthAbbr);
}
