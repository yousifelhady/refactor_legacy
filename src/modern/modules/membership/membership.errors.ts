export abstract class MembershipError extends Error {
	constructor(message: string) {
		super(message);
	}
}

export class CreateMembershipRequestBodyError extends MembershipError {
	constructor(message: string) {
		super(message);
	}
}

export class TerminateMembershipError extends MembershipError {
	constructor(message: string) {
		super(message);
	}
}

export class MembershipNotFoundError extends MembershipError {
	constructor(membershipId: number) {
		const message = `membership with id: ${membershipId} could not be found.`
		super(message);
	}
}
