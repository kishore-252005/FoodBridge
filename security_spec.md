# Security Specification: FoodBridge

This document specifies data invariants, potential attack vector payloads (the "Dirty Dozen"), and validation criteria to ensure 100% Zero-Trust secure rules on Firebase Firestore.

## 1. Data Invariants

- **User Hierarchy**: A user profile is private; read is restricted to the owner of the UID or an Admin. Privilege escalation (changing one's own role package or claiming admin status) is strictly blocked.
- **Donation Creation**: Only verified users under the role of `Donor` can create a donation, and their user id must match the donor's ID on the field.
- **Donation Modification**: A donation status can be updated to `Accepted`, `Collected`, or `Distributed` by registered NGOs or Volunteers, but other fields remain closed for them.
- **Atomicity**: Requests are created to capture active interaction between donations and claimants.

## 2. The "Dirty Dozen" Poison Payloads

The rules block these 12 distinct attack vectors:

1. **Self-Promoted Admin**: Registering/Updating profile with `role: "Admin"`.
2. **Anonymous Creation**: Attempting to post a donation without passing auth validation.
3. **Ghost Spoofing**: Attempting to register another user's `uid` (uid mismatch).
4. **ID Poisoning Attack**: Injecting a 1MB corrupted string as standard document ID variables.
5. **No-Size Shell Field**: Posting empty string variables to exhaust firestore index memory.
6. **Fake Donor ID**: Posting resource with `donorId: "victim_user_123"` while logged in as `attacker_user_456`.
7. **Privilege Over-Write**: Volunteer trying to rewrite a donation's `foodName` or `expiryTime` during pickup status update.
8. **Double-Spend Status**: Changing an already `Distributed` donation back to `Available`.
9. **Fake Email Attack**: Auth token claiming registered email but with `email_verified: false` bypasses verification checks.
10. **Query Scraper Attack**: Querying the full `/users` or `/requests` structures without strict owner ID boundaries in list rules.
11. **Malicious Request Assignment**: NGO signing up volunteers to random pickups without volunteer consent (`requests` document cross-claims).
12. **PII Leakage**: Authenticated guest trying to scrap details of private user records using blanket read queries.

## 3. Test Verification Criteria

- All mock payloads listed above return `PERMISSION_DENIED`.
- Test suite validates CRUD restrictions successfully in compliance with security directives.
