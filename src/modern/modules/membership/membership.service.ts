import * as z from "zod";
import { v4 as uuidv4 } from "uuid";
import membershipsData from "../../../data/memberships.json";
import { CreateMembershipRequestBodyError, MembershipNotFoundError, TerminateMembershipError } from './membership.errors';
import { constructMembershipPeriods, getAllMembershipPeriods, MembershipPeriod, checkPendingMembershipPeriods, temrinateMembershipPeriods } from "../membershipPeriod/membershipPeriod.service";
import { BillingInterval } from "../../shared/types";

export type Membership = {
	assignedBy: string,
	billingInterval: string,
	billingPeriods: number
	id: number,
	name: string,
	paymentMethod: string,
	recurringPrice: number,
	state: string,
	userId: number,
	uuid: string,
	validFrom: string,
	validUntil: string,
};

type MembershipWithPeriods = {
	membership: Membership,
	periods: MembershipPeriod[]
};

export enum PaymentMethod {
	CASH = 'cash',
	CREDITCARD = 'credit card'
};

export enum MembershipState {
	ACTIVE = 'active',
	PENDING = 'pending',
	EXPIRED = 'expired',
	TERMINATED = 'terminated',
};

const CreateMembershipRequestBodySchema = z.object({
	billingInterval: z.nativeEnum(BillingInterval, {
		errorMap: (issue) => {
			if (issue.code === "invalid_enum_value") {
				return { message: "invalidBillingInterval" }
			}
			return { message: "missingBillingInterval" }
		}
	}),
	billingPeriods: z.number({
			required_error: "missingBillingPeriods"
	}),
	name: z.string({
		required_error: "missingMandatoryFields"
	}),
	paymentMethod: z.nativeEnum(PaymentMethod, {
		errorMap: (issue) => {
			if (issue.code === "invalid_enum_value") {
				return { message: "invalidPaymentMethod" }
			}
			return { message: "missingPaymentMethod" }
		}
	}),
	recurringPrice: z.number({
		required_error: "missingMandatoryFields"
	}).positive({
		message: "negativeRecurringPrice"
	}),
	validFrom: z.coerce.date().optional()
});

const TerminateMembershipRequestBodySchema = z.object({
	membershipId: z.number({
		required_error: "missing membershipId",
	}),
});

type CreateMembershipRequestBody = z.infer<typeof CreateMembershipRequestBodySchema>;

type TerminateMembershipRequestBody = z.infer<typeof TerminateMembershipRequestBodySchema>;

/**
 * Returns all memberships with their periods
 * @returns MembershipWithPeriods[]
 */
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

const getMembershipWithPeriods = (membershipId: number): MembershipWithPeriods => {
	const allMemberships = getAllMemberships();
	const allMembershipPeriods = getAllMembershipPeriods();
	const membership: Membership | undefined = allMemberships.filter(m => m.id === membershipId).at(0);
	if (!membership) {
		throw new MembershipNotFoundError(membershipId);
	};
	const periods = allMembershipPeriods.filter(p => p.membership === membershipId);
	return {
		membership,
		periods,
	};
}

/**
 * Returns all memberships from the db (or local JSON file)
 */
export const getAllMemberships = (): Membership[] => {
	return membershipsData;
};

/**
 * Creates a new membership with its periods depending on the membership data from the request body.
 * Throws Zod validation errors when request body fields are missing or invalid.
 * Throws custom CreateMembershipRequestBodyError when request body fields have incorrect data.
 * @param requestBody
 * @returns MembershipWithPeriods
 */
export const createMembershipWithPeriods = (requestBody: CreateMembershipRequestBody): MembershipWithPeriods => {
	validateRequestBody(requestBody);
	const assignedBy = "Admin";
	const userId = 2000;
	const { billingInterval, billingPeriods, name, paymentMethod, recurringPrice, validFrom : inputValidFrom } = requestBody;
	const { validFrom, validUntil } = calculateMembershipValidity(inputValidFrom, billingInterval, billingPeriods);
	const state = getMembershipState(validFrom, validUntil);
	const membership: Membership = {
		assignedBy,
		billingInterval,
		billingPeriods,
		id: getAllMemberships().length + 1,
		name,
		paymentMethod,
		recurringPrice,
		state,
		userId,
		uuid: uuidv4(),
		validFrom: validFrom.toISOString(),
		validUntil: validUntil.toISOString(),
  };
	saveMembership(membership);
	const periods = constructMembershipPeriods(membership.id, validFrom, billingInterval, billingPeriods);
	return { membership, periods };
};

const validateRequestBody = (requestBody: CreateMembershipRequestBody) => {
	CreateMembershipRequestBodySchema.parse(requestBody); // this method throws ZodError when parsing the request body fails.
	validateRecurringPriceAndPaymentMethod(requestBody.recurringPrice, requestBody.paymentMethod);
	validateBillingIntervalAndPeriods(requestBody.billingInterval, requestBody.billingPeriods);
};

const validateRecurringPriceAndPaymentMethod = (recurringPrice: number, paymentMethod: string) => {
	if (recurringPrice > 100 && paymentMethod === PaymentMethod.CASH) {
		throw new CreateMembershipRequestBodyError("cashPriceBelow100")
	}
}

const validateBillingIntervalAndPeriods = (billingInterval: BillingInterval, billingPeriods: number) => {
	if (billingInterval === BillingInterval.MONTHLY) {
		validateMonthlyBillingInterval(billingPeriods);
	} else if (billingInterval === BillingInterval.YEARLY) {
		validateYearlyBillingInterval(billingPeriods);
	}
}

const validateMonthlyBillingInterval = (billingPeriods: number) => {
	if (billingPeriods > 12) {
		throw new CreateMembershipRequestBodyError("billingPeriodsMoreThan12Months")
	}
	if (billingPeriods < 6) {
		throw new CreateMembershipRequestBodyError("billingPeriodsLessThan6Months")
	}
}

const validateYearlyBillingInterval = (billingPeriods: number) => {
	if (billingPeriods > 10) {
		throw new CreateMembershipRequestBodyError("billingPeriodsMoreThan10Years")
	}
	if (billingPeriods < 3) {
		throw new CreateMembershipRequestBodyError("billingPeriodsLessThan3Years")
	}
}

const calculateMembershipValidity = (inputValidFrom: Date | undefined, billingInterval: BillingInterval, billingPeriods: number): { validFrom: Date, validUntil: Date } => {
	const validFrom = inputValidFrom ? new Date(inputValidFrom) : new Date();
  const validUntil = new Date(validFrom);
  if (billingInterval === BillingInterval.MONTHLY) {
    validUntil.setMonth(validFrom.getMonth() + billingPeriods);
  } else if (billingInterval === BillingInterval.YEARLY) {
    validUntil.setMonth(validFrom.getMonth() + billingPeriods * 12);
  } else if (billingInterval === BillingInterval.WEEKLY) {
    validUntil.setDate(validFrom.getDate() + billingPeriods * 7);
  }
	return { validFrom, validUntil };
}

const getMembershipState = (validFrom: Date, validUntil: Date): string => {
	let state = MembershipState.ACTIVE;
	const now = new Date();
	if (validFrom > now) {
		state = MembershipState.PENDING;
	}
	if (validUntil < now) {
		state = MembershipState.EXPIRED;
	}
	return state;
}

const saveMembership = (membership: Membership) => {
	membershipsData.push(membership);
}

export const terminateMembership = (requestBody: TerminateMembershipRequestBody) => {
	TerminateMembershipRequestBodySchema.parse(requestBody);
	const membershipWithPeriods = getMembershipWithPeriods(requestBody.membershipId);
	const membership: Membership = membershipWithPeriods.membership;
	if (membership.state === MembershipState.EXPIRED || membership.state === MembershipState.TERMINATED) {
		throw new TerminateMembershipError("membership is already expired or temrinated");
	}
	if(!checkPendingMembershipPeriods(membershipWithPeriods.periods)) {
		throw new TerminateMembershipError("membership does not have planned periods");
	}
	membership.state = MembershipState.TERMINATED;
	temrinateMembershipPeriods(membershipWithPeriods.periods);
	return true;
}
