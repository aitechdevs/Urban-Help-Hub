# CA$100 Sandbox booking verification

Verified on November 24, 2026 (WAT) against the deployed Urban Help Hub test site using PayPal Sandbox.

| Check | Observed result |
| --- | --- |
| Fixed quote | CA$100.00 accepted |
| Commitment | CA$50.00 completed |
| Balance after customer confirmation | CA$50.00 completed |
| Customer payment overall | Paid |
| Super Admin payout flow | Authorized, submitted, and refreshed |
| Helper payout | CA$60.00, shown as Paid and Settled after PayPal status refresh |
| Gross platform share | CA$40.00 |
| Platform net | CA$36.18 after recorded fees and tax |

The customer dashboard showed both instalments completed. The admin dashboard showed the payout progress from Processing to Paid and Settled after refreshing the provider status. The full local Laravel suite passed 84 tests with 571 assertions when the payout audit hotfix was built.

The evidence covers the Sandbox transaction and the app's provider reconciliation. The recipient's separate Sandbox Activity view and production payment processing were not independently verified. The deployed API's cached checkout return URL was checked after correction. A fresh checkout return after that correction was not independently tested.
