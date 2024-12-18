import { DATE_RELATIONS } from "./constants";

export class FrequencyString extends String {
	toDaysNumber(): number {
		const regex =
			/(?:(\d*)y)?(?:(\d*)mo)?(?:(\d*)w)?(?:(\d*)d)?(?:(\d*)h)?(?:(\d*)m)?(?:(\d*)s)?/;
		const match = regex.exec(this.toString());
		if (!match) return 0;
		const years = Number(match[1] || 0) * 365;
		const months = Number(match[2] || 0) * DATE_RELATIONS.MONTH_DAYS;
		const weeks = Number(match[3] || 0) * 7;
		const days = Number(match[4] || 0);
		const hours = Number(match[5] || 0) * 24;
		const minutes = Number(match[6] || 0) * 60;
		const seconds = Number(match[7] || 0) * 60;
		return years + months + weeks + days + hours + minutes + seconds;
	}
}
