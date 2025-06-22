import membershipsData from "../../../data/memberships.json";
import { getAllMembershipPeriods, MembershipPeriod } from "../membershipPeriod/membershipPeriod.service";

type Membership = {
    id: number,
    uuid: string,
    name: string,
    userId: number,
    recurringPrice: number,
    validFrom: string,
    validUntil: string,
    state: string,
    assignedBy: string,
    paymentMethod: string | null,
    billingInterval: string,
    billingPeriods: number
};

type MembershipWithPeriods = {
    membership: Membership,
    periods: MembershipPeriod[]
};

export const getMembershipsWithPeriods = (): MembershipWithPeriods[] => {
    const allMemberships = getAllMemberships();
    const allMembershipPeriods = getAllMembershipPeriods();
    const membershipsWithPeriods = [];
    for (const membership of allMemberships) {
        const periods = allMembershipPeriods.filter(p => p.membership === membership.id);
        membershipsWithPeriods.push({ membership, periods });
    }
    return membershipsWithPeriods;
};

const getAllMemberships = (): Membership[] => {
    return membershipsData;
};
