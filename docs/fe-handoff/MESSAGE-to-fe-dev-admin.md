# Message to the FE developer: Admin Portal and Super Admin Portal

Hi! Two more pages are ready: **Admin Portal** and **Super Admin Portal**. They work the same way as Team, Journal and Notifications: same process, same rules in `docs/fe-handoff/MESSAGE-to-fe-dev.md`. Please finish those three first.

## Order

1. **Admin Portal** (`docs/fe-handoff/admin-portal.md`), branch `feature/admin-portal-fe`
2. **Super Admin Portal** (`docs/fe-handoff/super-admin.md`), branch `feature/super-admin-fe`

## What's different here

- **Access is hidden, not refused.** Someone who isn't staff gets a plain 404 and goes to `/dashboard` with no message. Read "Who gets in" in each brief first.
- **Every staff action needs a reason and a fresh authenticator code.** A wrong code is a 403 and must never sign anyone out. Build the dialog once, in the Admin Portal, and reuse it.
- **Tell us when you need a test staff account.** It needs an account with an authenticator app on, and we create it for you.
- **Parts are missing on purpose.** Feature flags, Billing overrides and Danger zone aren't in these briefs. A later brief adds them. Remove those mock sections, with no "coming soon".

Same as before: PR to `develop` only, don't merge your own PR, list each acceptance row as passed or not at 1440 and 375.

Thanks!
