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
