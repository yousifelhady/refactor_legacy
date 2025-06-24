# Fullstack Interview Challenge

## Context

This exercise aims to refactor legacy endpoints under path `src/legacy/routes` written in Javascript to a well structured modern endpoints under path `src/modern/..` written in Typescript to ensure type safety.


## Task 1 - Modernization of the membership codebase (backend only)
### Assumptions & Decisions
- **Decision**: In `memberships.json`, `membership` with `id=3` has `paymentMethod = null`. I can changed it to one of the valid payment methods as the `paymentMethod` should be a valid string and not nullable (as per the data model provided).
- **Assumption**: Valid payment methods are "cash" and "credit card" (as per the provided local data in the JSON file).
- **Decision**: Add a new custom error message for invalid `paymentMethod` "invalidPaymentMethod" as there was no check for the `paymentMethod` provided in the request body.
- In the legacy code, when invalid `billingInterval` is provided, the error message returned is "invalidBillingPeriods". **Decision**: Renaming "invalidBillingPeriods" error message to "invalidBillingInterval" as the if condition check for the `billingInterval` not the `billingPeriods`.
- **Decision**: Added [Zod](https://zod.dev/) as a validation library for the Request Body.
- **Assumption & Decision**: All parsed fields from the request body are mandatory fields, therefore I add a validation check using Zod for the mandatory fields (`name`, `recurringPrice`, `paymentMethod`, `billingInterval`, `billingPeriods`).
- **Fix**: In the legacy code, error message "billingPeriodsLessThan3Years" is implemented incorrect. I fixed it.
- **Assumption & Decision**: I noticed that for the legacy endpoints, `GET /memberships` return key fields `membership` and `periods`, while `POST /memberships` return key fields `membership` and `membershipPeriods` when listing the membership and its periods (therefore inconsistency). Since the requirement is to maintain exact same response, I will maintain the key fields naming in the modern endponts as they are in the legacy.
- **Assumption & Decision**: The loaded `memberships` from the static json have its nested fields ordered differently from how I ordered them in my code. I ordered them alplabeticaly to make reading (and also adding new keys) easier. But when displaying the result of memberships after adding a new membership, some memberships will have different order of its nested fields. For real database it won't happen because the database will return the keys sorted the same way every time.
- **Note**: There is inconsistency between the returned nested field name `membershipId` when using the legacy `POST /legacy/memberships` endpoint and returned nested field name `membership` when using the modern `POST /memberships` endpoint when listing the `membershipPeriods` (because there is no defined type in the legacy endpoint).

### Future Work
- Cover all functions in `src/modern/modules/membership/membership.service.ts` with unit tests.
- Cover all functions in `src/modern/modules/membershipPeriod/membershipPeriod.service.ts` with unit tests.
- Cover endpoints with unit tests to ensure valid responses to the client side.
- Add eslint config to the repo to lint the code before pushing to remote.


## Task 2 - Design an architecture to provide a membership export (conception only)
Please check the architecture PDF, Notes are written in the PDF itself.


## Repository Description
It is backend server which consists of a plain express.js server that exposes API endpoints to consumers.
For this exercise, the API endpoints are not protected.

### Installation (prerequisite step before running the app)

```sh
npm install
```

### Start the app

```sh
npm run start
```

### Start the app in dev mode

```sh
npm run dev
```

### Run tests
```sh
npm run test
```

## Domain: Memberships

A `Membership` allows a user to participate at any class the a specific sport venue within a specific timespan. Within this timespan, the membership is divided into `MembershipPeriods`. The MembershipPeriods represent billing periods that the user has to pay for.

For the scope of this exercise, the domain model was reduced to a reasonable size. 

#### Entity: Membership
```ts
interface Membership {
    name: string // name of the membership
    userId: number // the user that the membership is assigned to
    recurringPrice: number // price the user has to pay for every period
    validFrom: Date // start of the validity
    validUntil: Date // end of the validity
    state: string // indicates the state of the membership
    assignedBy: string // user who created the membership
    paymentMethod: string // which payment method will be used to pay for the periods
    billingInterval: string // the interval unit of the periods
    billingPeriods: number // the number of periods the membership has
}
```

#### Entity: MembershipPeriod
```ts
interface MembershipPeriod {
    membership: number // membership the period is attached to
    start: Date // indicates the start of the period
    end: Date // indicates the end of the period
    state: string
}
```
