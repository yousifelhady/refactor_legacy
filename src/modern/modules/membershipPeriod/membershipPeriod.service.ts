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

/**
 * Returns all membership periods available in the db (local JSON).
 * @returns MembershipPeriod[]
 */
export const getAllMembershipPeriods = (): MembershipPeriod[] => {
	return membershipPeriodsData;
};

/**
 * Creates membership periods for a specific membership knowing its id.
 * @param membership membershipId
 * @param validFrom membership validFrom date
 * @param billingInterval the interval at which the bills are paid
 * @param billingPeriods a number indicating billing periods
 * @returns 
 */
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
