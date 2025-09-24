import _, { isEqual } from "lodash";
import { v4 as uuidv4 } from "uuid";
import * as membershipPeriodService from "../membershipPeriod/membershipPeriod.service";
import * as membershipService from "./membership.service";
import { getMembershipsWithPeriods, Membership, PaymentMethod, MembershipState } from "./membership.service";
import { MembershipPeriod, MembershipPeriodState } from "../membershipPeriod/membershipPeriod.service";
import { BillingInterval } from "../../shared/types";

describe('membershipService', () => {
	describe('getMembershipsWithPeriods', () => {
		const constructMembership = (id: number): Membership => {
			return {
				assignedBy: "Admin",
				billingInterval: BillingInterval.MONTHLY,
				billingPeriods: 12,
				id,
				name: uuidv4(),
				paymentMethod: PaymentMethod.CASH,
				recurringPrice: 150,
				state: MembershipState.ACTIVE,
				userId: id,
				uuid: uuidv4(),
				validFrom: new Date().toISOString(),
				validUntil: new Date().toISOString()
			}
		};
		const constructMemberships = (count: number): Membership[] => {
			const memberships: Membership[] = [];
			for(let i = 0; i < count; i++) {
				const membershipId = Math.ceil(Math.random() * 100);
				memberships.push(constructMembership(membershipId));
			}
			return memberships;
		};
		const constructMembershipPeriod = (membership: number): MembershipPeriod => {
			return {
				id: Math.ceil(Math.random() * 12),
				uuid: uuidv4(),
				membership,
				start: new Date().toISOString(),
				end: new Date().toISOString(),
				state: MembershipPeriodState.PLANNED,
			}
		};
		const constructMembershipPeriods = (count: number, membership: number | undefined = undefined): MembershipPeriod[] => {
			const membershipPeriods: MembershipPeriod[] = [];
			const membershipId = membership ?? Math.ceil(Math.random() * 100);
			for(let i = 0; i < count; i++) {
				membershipPeriods.push(constructMembershipPeriod(membershipId));
			}
			return membershipPeriods;
		};

		afterEach(() => {
			jest.clearAllMocks();
		})

		it('should return correct count of memberships and their corresponding periods', () => {
			const membershipsCount = 2;
			const memberships: Membership[] = constructMemberships(membershipsCount);
			const periodsCount = 12;
			let membershipPeriods: MembershipPeriod[] = [];
			memberships.forEach(membership => {
				membershipPeriods = membershipPeriods.concat(constructMembershipPeriods(periodsCount, membership.id));
			})
			const getAllMembershipsSpy = jest.spyOn(membershipService, 'getAllMemberships').mockReturnValueOnce(memberships);
			const getAllMembershipPeriodsSpy = jest.spyOn(membershipPeriodService, 'getAllMembershipPeriods').mockReturnValueOnce(membershipPeriods);
			const membershipsWithPeriods = getMembershipsWithPeriods();
			expect(membershipsWithPeriods.length).toEqual(membershipsCount);
			membershipsWithPeriods.forEach(item => {
				expect(item.periods.length).toEqual(periodsCount);
			});
			expect(getAllMembershipsSpy).toHaveBeenCalledTimes(1);
			expect(getAllMembershipPeriodsSpy).toHaveBeenCalledTimes(1);
		});

		it('should validate that membership fields returned are equal and same to the membership object fields', () => {
			const membershipsCount = 2;
			const memberships: Membership[] = constructMemberships(membershipsCount);
			const periodsCount = 1;
			let membershipPeriods: MembershipPeriod[] = [];
			memberships.forEach(membership => {
				membershipPeriods = membershipPeriods.concat(constructMembershipPeriods(periodsCount, membership.id));
			})
			const getAllMembershipsSpy = jest.spyOn(membershipService, 'getAllMemberships').mockReturnValueOnce(memberships);
			const getAllMembershipPeriodsSpy = jest.spyOn(membershipPeriodService, 'getAllMembershipPeriods').mockReturnValueOnce(membershipPeriods);
			const membershipsWithPeriods = getMembershipsWithPeriods();
			membershipsWithPeriods.forEach(item => {
				const actualMembership = memberships.find(m => m.id === item.membership.id);
				expect(item.membership).toStrictEqual(actualMembership);
			})
			expect(getAllMembershipsSpy).toHaveBeenCalledTimes(1);
			expect(getAllMembershipPeriodsSpy).toHaveBeenCalledTimes(1);
		});

		it('should validate that membership periods fields returned are equal and same to the original membership period object fields', () => {
			const membershipsCount = 2;
			const memberships: Membership[] = constructMemberships(membershipsCount);
			const periodsCount = 1;
			let membershipPeriods: MembershipPeriod[] = [];
			memberships.forEach(membership => {
				membershipPeriods = membershipPeriods.concat(constructMembershipPeriods(periodsCount, membership.id));
			})
			const getAllMembershipsSpy = jest.spyOn(membershipService, 'getAllMemberships').mockReturnValueOnce(memberships);
			const getAllMembershipPeriodsSpy = jest.spyOn(membershipPeriodService, 'getAllMembershipPeriods').mockReturnValueOnce(membershipPeriods);
			const membershipsWithPeriods = getMembershipsWithPeriods();
			membershipsWithPeriods.forEach(item => {
				const actualMembershipPeriods = membershipPeriods.filter(mp => {
					if(item.periods.includes(mp))
						return mp;
				})
				expect(_.isEqual(item.periods, actualMembershipPeriods)).toBeTruthy();
			})
			expect(getAllMembershipsSpy).toHaveBeenCalledTimes(1);
			expect(getAllMembershipPeriodsSpy).toHaveBeenCalledTimes(1);
		});
	});

	// future work
	// implement unit tests for the rest of the membershipService functions
});