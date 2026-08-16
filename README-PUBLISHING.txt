ACCURAO REVIEWER — ATTIO-STYLE STATIC SITE
===========================================

This version keeps the approved Accurao Reviewer information and technical constraints,
but restyles the presentation around the clean, product-led visual language requested by
Shahrukh: centered editorial hero, restrained navigation, crisp hairline borders, large
interface-led product mock-up, dense whitespace, and minimal decoration.

HOSTINGER
---------
Upload the CONTENTS of this folder to the public_html directory for accurao.com.
The site is plain static HTML/CSS/JS and requires no Node.js, PHP, database, CMS, or .env.

BEFORE PUBLISHING — REQUIRED VALUES
-----------------------------------
Do not guess these. Replace only with values Momina has confirmed:

{{DISCLOSURE_COUNT}}
{{TB_FORMATS}}
{{FAR_FORMATS}}
{{DATA_REGION}}
{{RETENTION}}
{{SUBPROCESSORS}}
{{BETA_TERMS}}
{{ENTITY}}

ALSO REQUIRED BEFORE LIVE USE
-----------------------------
1. Add the approved existing Accurao wordmark at images/acc-plain-300.png.
2. Add Momina's approved photograph at images/momina-athar.jpg.
3. Add the approved self-hosted Space Grotesk and Manrope .woff2 files in /fonts/.
4. Momina must provide the concrete first-person example for the About page.
5. Momina must provide final Privacy and Terms wording.
6. The beta page lazy-loads the approved Cal.com URL: cal.eu/momina.athar/free-consultation.
   Keep third-party booking code confined to the beta page.
7. Verify Security wording against the live product configuration.
8. Keep the social-proof region empty until real beta participants consent in writing.

LOCAL CHECK
-----------
Double-click index.html, or open the folder in VS Code and use Live Server.

The product visual on the homepage is an illustrative static HTML/CSS mock-up. It does
not claim to be a screenshot of the live product and contains no real client data.

ENHANCED INTERACTIONS
- Product preview rows are interactive and rotate gently on the homepage.
- FAQ becomes an accessible accordion when JavaScript is available; all content remains readable without JavaScript.
- Motion respects prefers-reduced-motion.
- No framework, build process, server runtime, or third-party animation library is used.

Design refinement: v3 adds directional on-scroll reveals, corporate section highlighting, and a reading-progress rule.

Refinement v7: contextual diagrams replace generic repeated ornaments; each visual is tied to the adjacent copy.

V13: widened homepage copy, enlarged interactive illustration, corrected trial-balance card geometry/icon.
