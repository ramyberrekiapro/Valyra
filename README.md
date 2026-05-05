# Valyra

An app for women ages 18+ to upload a selfie and preview realistic facial, skin, and beauty changes before deciding whether to try a cosmetic treatment, makeup style, or aesthetic change.

## Concept

The user uploads an image of herself, then chooses different preview options to see how she might look with changes such as a smaller nose, fuller lips, foxy eyes, Botox-style smoothing, or a different skin tone. The app should create realistic before/after previews while making it clear that the result is only a visual simulation.

After upload, the app should generate a gallery of 5 essential predefined facial-change images using the uploaded face for the free-key MVP.

## MVP Direction

Valyra will be built as a web app MVP with real AI image editing.

- AI provider: OpenRouter API
- Image model slug: `google/gemini-3.1-flash-image-preview`
- Use this exact model for fast generation speed
- One uploaded selfie per generation session
- Generate only 5 images per upload for now to control free API usage
- If the user wants different results, she uploads another photo
- No sign in for the first version
- Store session state and generated result metadata in local storage for now
- Use realistic, subtle prompts so edits look believable instead of aggressive
- Focus on realistic results, fast generation, and a beautiful Pinterest-style gallery experience

## Target Audience

Women ages 18 and older who want a private, low-pressure way to explore possible beauty changes before making real-world decisions.

## Core Features

- Selfie upload or camera capture
- Face detection and facial region mapping
- Automatic generation of 5 predefined face-change previews
- Masonry-style gallery of generated results
- Before/after comparison view
- Adjustable intensity sliders
- Ability to combine multiple changes
- Reset controls for individual changes
- Save or export preview images
- Privacy-first image handling
- OpenRouter-powered real AI image editing
- Local-storage session persistence for the MVP

## Layout Direction

The layout should follow the provided reference image: a Pinterest-style masonry grid with multiple columns, rounded image tiles, tight spacing, and mixed tile heights.

After the user uploads her face, the primary screen should become a browsable gallery of generated facial variations. Each tile should show a different predefined transformation, such as smaller nose, fuller lips, foxy eyes, smoother skin, or makeup changes. The experience should feel visual, polished, and easy to scan.

The interface should closely copy the Pinterest-style browsing pattern from the provided reference: many rounded visual tiles, mixed heights, tight spacing, hover/save actions, and fast scanning.

Layout requirements:

- Display 5 generated result images for the free-key MVP.
- Use staggered columns with mixed tile heights.
- Use rounded corners on image tiles.
- Keep image spacing clean and consistent.
- Make the generated images the main focus of the page.
- Include a clear save action for selected results, similar to the prominent save button in the reference.
- Work well on mobile and desktop.

## Preview Options

Initial preview options should include:

- Smaller nose
- Fuller lips
- Foxy eyes / lifted eye look
- Botox-style smoothing
- Different skin tone
- Jawline contouring
- Cheek filler / lifted cheeks
- Chin reshaping
- Brow lift
- Under-eye smoothing
- Teeth whitening
- Smile enhancement
- Skin texture smoothing
- Acne or blemish reduction
- Facial slimming
- Forehead smoothing
- Nasolabial fold softening
- Eyelash enhancement
- Hair color preview
- Makeup previews such as lipstick, contour, blush, and eyeliner

## Common Facial Cosmetic Procedures To Support

This list is based on common facial cosmetic surgery and minimally invasive procedure categories reported by ASPS, Stanford Health Care, and facial cosmetic surgery references.

- Rhinoplasty / nose reshaping
- Upper eyelid lift / upper blepharoplasty
- Lower eyelid lift / lower blepharoplasty
- Double eyelid surgery
- Facelift / rhytidectomy
- Mini facelift
- Neck lift
- Chin liposuction / submental liposuction
- Forehead lift / brow lift
- Temporal brow lift / foxy eye lift
- Lip lift
- Lip augmentation
- Botox-style neuromodulator injections
- Hyaluronic acid dermal fillers
- Cheek augmentation / cheek implants
- Cheek filler / midface volume restoration
- Chin augmentation / genioplasty
- Jawline contouring
- V-line jaw surgery / jaw reduction
- Facial fat grafting
- Buccal fat removal
- Skin resurfacing
- Chemical peel
- Dermabrasion / dermaplaning
- Non-surgical skin tightening
- Laser skin treatments
- Hairline lowering / forehead reduction
- Hair restoration / hair transplantation
- Ear reshaping / otoplasty
- Scar revision

## Product Values

- Realistic previews
- Privacy-first image handling
- Respectful, confidence-focused language
- No pressure toward cosmetic procedures
- Clear labeling that previews are simulations
- No medical claims or guaranteed results

## Safety Notes

Uploaded selfies should be treated as sensitive personal data. The app should avoid storing images unless the user opts in, and it should provide clear deletion/reset behavior. The app is not a medical tool and should not replace advice from qualified professionals.

## Research Notes

Current facial aesthetics research and market references point to these product priorities:

- Facial aesthetics demand is strongest around rhinoplasty, eyelid surgery, facelifts, brow/forehead lifts, injectables, fillers, and skin treatments.
- Minimally invasive procedures are a major part of the market, so the app should not focus only on traditional surgery. Botox-style smoothing, fillers, skin resurfacing, peels, tightening, and skin-tone previews should be first-class categories.
- Recent facial plastic surgery trends emphasize natural-looking, subtle, and earlier interventions instead of dramatic or overdone results.
- Competitor and beauty-tech products commonly support upload/live camera flows, face tracking, before/after comparison, save/share, virtual makeup, hair color, skin analysis, and face reshaping.
- The generated-result experience should feel like a browsable visual gallery, not a clinical form. The reference masonry layout fits this direction.
- Face photos, face landmarks, and generated face outputs should be treated as sensitive personal data and possibly biometric data.
- The app should clearly explain whether processing happens on-device, on a private server, or through a third-party AI provider.
- The app should avoid training models on user photos unless the user gives explicit, separate consent.
- The app should not use harsh labels such as "flaws" or "defects." Use neutral language like "preview," "variation," "smoother," "lifted," "balanced," or "refined."
- Because cosmetic-aesthetic audiences can include people with body-image distress, the product should avoid pressure, unrealistic promises, or unlimited escalation toward extreme edits.

## Product Implications From Research

- Default previews should be subtle and realistic.
- Each generated tile should be labeled by procedure or beauty-change category.
- Add filters for categories such as nose, eyes, lips, skin, jawline, cheeks, hair, and makeup.
- Add an "original" tile or persistent before/after compare mode.
- Add intensity levels, but keep default values conservative.
- Add a disclaimer near generated results: previews are simulations and do not guarantee medical or cosmetic outcomes.
- Add privacy controls before upload: delete, do not store, and explain processing.
- Add a provider-safe wording layer if the app later connects users to clinics or professionals.

## AI Image Editing Requirements

- Use OpenRouter with model `google/gemini-3.1-flash-image-preview`.
- Keep the OpenRouter API key on the server side only.
- Use environment variables for API credentials.
- Generate 5 predefined edits from the single uploaded selfie for now.
- Prompts should preserve the user's identity, pose, lighting, expression, age, hairstyle, and overall realism.
- Prompts should request subtle, natural-looking cosmetic previews.
- Avoid extreme language such as "dramatic," "perfect," "flawless," "unrecognizable," or "surgically transformed."
- Each generated result should have a clear label such as "Subtle Nose Refinement," "Soft Lip Volume," or "Natural Brow Lift."
- Show generated results in the masonry gallery as they complete, rather than blocking the whole gallery until every image is done.

## Local Setup

Valyra currently runs as a dependency-free Node web app.

1. Create a `.env` file using `.env.example`.
2. Add `OPENROUTER_API_KEY`.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

Commands:

- Dev: `npm run dev`
- Start: `npm start`
- Syntax check: `npm run check`

No package install is required for the current MVP.

## Research Sources

- ASPS plastic surgery statistics: https://www.plasticsurgery.org/plastic-surgery-statistics
- AAFPRS 2023 annual facial plastic surgery survey: https://www.aafprs.org/Media/Press_Releases/2024_02_01_PressRelease.aspx
- AAFPRS 2025 facial plastic surgery trends: https://www.prnewswire.com/news-releases/aafprs-reveals-the-trends-defining-facial-plastic-surgery-302695297.html
- ISAPS Global Survey 2024: https://www.isaps.org/discover/about-isaps/global-statistics/global-survey-2024-full-report-and-press-releases/
- FDA dermal filler safety information: https://www.fda.gov/medical-devices/aesthetic-cosmetic-devices/dermal-fillers-soft-tissue-fillers
- FDA dermal filler do's and don'ts: https://www.fda.gov/consumers/consumer-updates/dermal-filler-dos-and-donts-wrinkles-lips-and-more
- FTC biometric information warning: https://www.ftc.gov/news-events/news/press-releases/2023/05/ftc-warns-about-misuses-biometric-information-harm-consumers
- FTC health app privacy guidance: https://www.ftc.gov/business-guidance/privacy-security/health-privacy
- FTC facial recognition privacy best practices: https://www.ftc.gov/news-events/news/press-releases/2012/10/ftc-recommends-best-practices-companies-use-facial-recognition-technologies
- ModiFace beauty AR technology: https://www.modiface.com/
- Perfect Corp / YouCam AI beauty technology: https://www.perfectcorp.com/
- YouCam Makeup App Store listing: https://apps.apple.com/us/app/youcam-makeup-virtual-makeover/id863844475
- Crisalix aesthetic simulation: https://www.crisalix.com/
- Body dysmorphic disorder in facial plastic surgery clinic study: https://pubmed.ncbi.nlm.nih.gov/25654334/
- BDD screening among cosmetic facial plastic surgery patients: https://pubmed.ncbi.nlm.nih.gov/37930999/

## Status

MVP implementation started. The app includes the upload flow, local session persistence, server-side OpenRouter generation route, 5 predefined realistic prompt templates, stylish gallery, filters, compare modal, retry flow, and save action.
