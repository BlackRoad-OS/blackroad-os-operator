# Railway Cleanup - Action Required

Railway requires 2FA for API deletions, so you'll need to delete via the dashboard.

## Quick Access

**Dashboard**: https://railway.app/dashboard

---

## DELETE THESE (22 random-name projects)

Click each link, then: **Settings → Danger Zone → Delete Project**

1. secure-grace
2. wonderful-celebration
3. fabulous-connection
4. noble-gentleness
5. sincere-recreation
6. gregarious-wonder
7. merry-warmth
8. fulfilling-spirit
9. discerning-expression
10. steadfast-delight
11. intuitive-endurance
12. impartial-vision
13. loyal-tranquility
14. innovative-cooperation
15. gentle-reprieve
16. alert-enjoyment
17. thriving-blessing
18. terrific-truth
19. NA-6 (first one)
20. NA-6 (second one)
21. NA-4
22. NA-3

---

## ALSO DELETE THESE (superseded projects)

- railway-blackroad-os
- BlackRoad Portal
- Operator Engine (both copies)
- Orchestrator
- blackroad-os-core
- blackroad-os-api
- blackroad-login
- BlackRoad API
- blackroad-operating-system
- blackroad-os-prism-console

---

## KEEP THESE

| Project | Purpose |
|---------|---------|
| **blackroad-cece-operator** | ✅ Primary Cece backend |
| blackroad-os-operator | Legacy (consider consolidating) |
| blackroad-os-docs | Documentation (if needed) |
| Prism Console | UI (if using) |
| Lucidia Core | Lucidia (if using) |
| lucidia-platform | Lucidia (if using) |
| Docusaurus Documentation Hub | Docs (if using) |

---

## After Cleanup

Once deleted, your Railway should have only 2-5 active projects instead of 40+.

The main endpoint will be:
```
https://blackroad-cece-operator-production.up.railway.app
```

---

## Prevent Future Mess

1. **Disable auto-deploy** on projects you don't actively use
2. **Always use `railway link`** before deploying
3. **Use explicit service names**: `railway up --service blackroad-operator`
4. **Deploy via GitHub Actions**, not manual `railway up`

---

*Generated: 2025-12-02*
*Owner: Alexa Louise Amundson*
