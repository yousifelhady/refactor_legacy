# Fullstack Interview Challenge

## Context

This exercise aims to refactor legacy endpoints under path `src/legacy/routes` written in Javascript to a well structured modern endpoints under path `src/modern/..` written in Typescript to ensure type safety.


## Task 1 - Modernization of the membership codebase (backend only)
notes here


## Task 2 - Design an architecture to provide a membership export (conception only)
notes here


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
    user: number // the user that the membership is assigned to
    recurringPrice: number // price the user has to pay for every period
    validFrom: Date // start of the validity
    validUntil: Date // end of the validity
    state: string // indicates the state of the membership
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
