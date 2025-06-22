import { v4 as uuidv4 } from "uuid";
import membershipPeriodsData from "../../../data/membership-periods.json";

export type MembershipPeriod = {
	id: number,
	uuid: string,
	membership: number,
	start: string,
	end: string,
	state: string
};

export const getAllMembershipPeriods = (): MembershipPeriod[] => {
	return membershipPeriodsData;
};

export const constructMembershipPeriods = (membership: number, validFrom: Date, billingInterval: string, billingPeriods: number): MembershipPeriod[] => {
	const membershipPeriods: MembershipPeriod[] = [];
	let periodStart = validFrom
	for (let i = 0; i < billingPeriods; i++) {
		const validFrom = periodStart
		const validUntil = new Date(validFrom)
		if (billingInterval === 'monthly') {
			validUntil.setMonth(validFrom.getMonth() + 1);
		} else if (billingInterval === 'yearly') {
			validUntil.setMonth(validFrom.getMonth() + 12);
		} else if (billingInterval === 'weekly') {
			validUntil.setDate(validFrom.getDate() + 7);
		}
		const period: MembershipPeriod = {
			id: i + 1,
			uuid: uuidv4(),
			membership,
			start: validFrom.toISOString(),
			end: validUntil.toISOString(),
			state: 'planned'
		}
		membershipPeriods.push(period)
		saveMembershipPeriod(period);
		periodStart = validUntil
	}
	return membershipPeriods;
};

const saveMembershipPeriod = (membershipPeriod: MembershipPeriod) => {
	membershipPeriodsData.push(membershipPeriod);
};
