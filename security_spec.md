# Security Spec: DalciosPay

## Data Invariants
- A user can only read and write their own data under `/users/{userId}`.
- Month data must have a valid salary (number >= 0).
- Document IDs for months must follow the format `YYYY-MM`.

## The Dirty Dozen Payloads (Rejection Targets)
1. Write to another user's month data.
2. Update `salary` with a negative number.
3. Update `salary` with a string.
4. Create a month document with an invalid ID (not YYYY-MM).
5. Inject a 2MB string into a description field.
6. Delete another user's document.
7. Read all users' data via collection group query.
8. Update an immutable field (if any were defined, but here mostly ownership).
9. Add an extra income without an amount.
10. Add a piggy bank entry without a description.
11. Spoof `userId` in the document path while authenticated as a different user.
12. Modify data without being authenticated.

## Test Runner
See `firestore.rules.test.ts` (conceptual for now, implemented via rules logic).
