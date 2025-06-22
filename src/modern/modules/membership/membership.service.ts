import * as z from "zod";
import { v4 as uuidv4 } from "uuid";
import membershipsData from "../../../data/memberships.json";
import { CreateMembershipRequestBodyError } from './membership.errors';
import { constructMembershipPeriods, getAllMembershipPeriods, MembershipPeriod } from "../membershipPeriod/membershipPeriod.service";

type Membership = {
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

const CreateMembershipRequestBodySchema = z.object({
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
	name: z.string({
		required_error: "missingMandatoryFields"
	}),
	paymentMethod: z.enum(["cash", "credit card"], {
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

type CreateMembershipRequestBody = z.infer<typeof CreateMembershipRequestBodySchema>;

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

/**
 * Returns all memberships from the db (or local JSON file)
 */
const getAllMemberships = (): Membership[] => {
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
	if (recurringPrice > 100 && paymentMethod === 'cash') {
		throw new CreateMembershipRequestBodyError("cashPriceBelow100")
	}
}

const validateBillingIntervalAndPeriods = (billingInterval: string, billingPeriods: number) => {
	if (billingInterval === 'monthly') {
		validateMonthlyBillingInterval(billingPeriods);
	} else if (billingInterval === 'yearly') {
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

const calculateMembershipValidity = (inputValidFrom: Date | undefined, billingInterval: string, billingPeriods: number): { validFrom: Date, validUntil: Date } => {
	const validFrom = inputValidFrom ? new Date(inputValidFrom) : new Date();
  const validUntil = new Date(validFrom);
  if (billingInterval === 'monthly') {
    validUntil.setMonth(validFrom.getMonth() + billingPeriods);
  } else if (billingInterval === 'yearly') {
    validUntil.setMonth(validFrom.getMonth() + billingPeriods * 12);
  } else if (billingInterval === 'weekly') {
    validUntil.setDate(validFrom.getDate() + billingPeriods * 7);
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
