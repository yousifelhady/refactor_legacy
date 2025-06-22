import * as z from "zod";
import { v4 as uuidv4 } from "uuid";
import membershipsData from "../../../data/memberships.json";
import { MembershipRequestBodyError } from './membership.errors';
import { constructMembershipPeriods, getAllMembershipPeriods, MembershipPeriod } from "../membershipPeriod/membershipPeriod.service";

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
	paymentMethod: string,
	billingInterval: string,
	billingPeriods: number
};

type MembershipWithPeriods = {
	membership: Membership,
	periods: MembershipPeriod[]
};

const CreateMembershipRequestBodySchema = z.object({
	name: z.string({
		required_error: "missingMandatoryFields"
	}),
	recurringPrice: z.number({
		required_error: "missingMandatoryFields"
	}).positive({
		message: "negativeRecurringPrice"
	}),
	paymentMethod: z.enum(["cash", "credit card"], {
		errorMap: (issue) => {
			if (issue.code === "invalid_enum_value") {
				return { message: "invalidPaymentMethod" }
			}
			return { message: "missingPaymentMethod" }
		}
	}),
	billingInterval: z.enum(["weekly", "monthly", "yearly"], {
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
	validFrom: z.coerce.date().optional()
});

type CreateMembershipRequestBody = z.infer<typeof CreateMembershipRequestBodySchema>;

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

export const createMembership = (requestBody: CreateMembershipRequestBody): MembershipWithPeriods => {
	const userId = 2000;
	validateRequestBody(requestBody);
	const { name, paymentMethod, recurringPrice, billingInterval, billingPeriods} = requestBody;
	const { validFrom, validUntil } = calculateMembershipValidity(requestBody);
	const state = getMembershipState(validFrom, validUntil);
	const newMembership: Membership = {
    id: getAllMemberships().length + 1,
    uuid: uuidv4(),
		assignedBy: "Admin",
		userId,
    name,
    state,
    validFrom: validFrom.toISOString(),
    validUntil: validUntil.toISOString(),
    paymentMethod,
    recurringPrice,
    billingPeriods,
    billingInterval,
  };
	saveMembership(newMembership);
	const membershipPeriods = constructMembershipPeriods(newMembership.id, validFrom, billingInterval, billingPeriods);
	return { membership: newMembership, periods: membershipPeriods};
};

const validateRequestBody = (requestBody: CreateMembershipRequestBody) => {
	CreateMembershipRequestBodySchema.parse(requestBody);
	validateRecurringPriceAndPaymentMethod(requestBody.recurringPrice, requestBody.paymentMethod);
	validateBillingIntervalAndPeriods(requestBody.billingInterval, requestBody.billingPeriods);
};

const validateRecurringPriceAndPaymentMethod = (recurringPrice: number, paymentMethod: string) => {
	if (recurringPrice > 100 && paymentMethod === 'cash') {
		throw new MembershipRequestBodyError("cashPriceBelow100")
	}
}

const validateBillingIntervalAndPeriods = (billingInterval: string, billingPeriods: number) => {
	if (billingInterval === 'monthly') {
		if (billingPeriods > 12) {
			throw new MembershipRequestBodyError("billingPeriodsMoreThan12Months")
		}
		if (billingPeriods < 6) {
			throw new MembershipRequestBodyError("billingPeriodsLessThan6Months")
		}
	} else if (billingInterval === 'yearly') {
		if (billingPeriods > 10) {
			throw new MembershipRequestBodyError("billingPeriodsMoreThan10Years")
		}
		if (billingPeriods < 3) {
			throw new MembershipRequestBodyError("billingPeriodsLessThan3Years")
		}
	}
}

const calculateMembershipValidity = (requestBody: CreateMembershipRequestBody): { validFrom: Date, validUntil: Date } => {
	const validFrom = requestBody.validFrom ? new Date(requestBody.validFrom) : new Date();
  const validUntil = new Date(validFrom);
  if (requestBody.billingInterval === 'monthly') {
    validUntil.setMonth(validFrom.getMonth() + requestBody.billingPeriods);
  } else if (requestBody.billingInterval === 'yearly') {
    validUntil.setMonth(validFrom.getMonth() + requestBody.billingPeriods * 12);
  } else if (requestBody.billingInterval === 'weekly') {
    validUntil.setDate(validFrom.getDate() + requestBody.billingPeriods * 7);
  }
	return { validFrom, validUntil };
}

const getMembershipState = (validFrom: Date, validUntil: Date): string => {
	let state = 'active'
	const now = new Date();
	if (validFrom > now) {
		state = 'pending'
	}
	if (validUntil < now) {
		state = 'expired'
	}
	return state;
}

const saveMembership = (membership: Membership) => {
	membershipsData.push(membership);
}
