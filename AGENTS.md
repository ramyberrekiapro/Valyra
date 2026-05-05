# Project Guidance

## Project Overview

Project: Valyra - an app where users upload one selfie and preview realistic facial and skin changes before considering cosmetic, aesthetic, or beauty treatments.

Target audience: Women ages 18+ who want to explore beauty changes safely, privately, and realistically before making decisions.

Core user flow:

1. User uploads or takes a selfie.
2. App detects face and relevant facial regions.
3. App generates a gallery of predefined facial-change results from the uploaded face.
4. User browses 5 essential generated images in a visual grid.
5. User can open a result, compare it with the original, save it, share it, or reset previews.
6. If the user wants a new set of results, she uploads another selfie.

## MVP Decisions

- App name: Valyra.
- Build as a web app.
- Use real AI image editing in the MVP.
- AI provider: OpenRouter API.
- Image model slug: `google/gemini-3.1-flash-image-preview`.
- Use the user-provided model exactly for fast generation speed.
- Support one uploaded selfie per generation session.
- Generate 5 essential improved facial-feature preview images from that one uploaded selfie for the free-key MVP.
- No sign in for the first version.
- Store session state, uploaded image reference, and generated result metadata in local storage for now.
- The target audience is women who want to see how they would look with different cosmetic facial features.
- Prioritize realistic results, fast generation speed, and a beautiful gallery-style experience.
- Realistic results should come from subtle prompts, not aggressive transformation prompts.
- The gallery should closely follow the Pinterest-style interface and layout from the provided reference image.

## Layout Reference

The app layout should be inspired by the provided reference image: a Pinterest-style masonry gallery with multiple vertical columns, rounded image tiles, tight spacing, and mixed tile heights.

After the user uploads a face image, the main screen should show a focused gallery of generated previews instead of a single result. The free-key MVP should contain 5 essential predefined variations of the user's face. Each tile should represent a different beauty or facial-change concept.

Layout requirements:

- Use a masonry/staggered image grid similar to the reference.
- Show the 5 generated results together, with mixed image heights for a curated visual feel.
- Use rounded corners on image tiles.
- Keep spacing clean and consistent.
- Make the uploaded face and generated variations the main visual focus.
- Add a clear action overlay or button for saving a selected result, similar to the reference image's prominent save button.
- Support mobile scrolling and desktop multi-column browsing.
- Avoid a plain list layout; the app should feel visual, browsable, and beauty-focused.

## Feature Direction

Support previews for common aesthetic changes, including:

- Smaller nose
- Fuller lips
- Foxy eyes / lifted eye look
- Botox-style smoothing
- Different skin tone previews
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
- Makeup-style previews such as blush, contour, lipstick, and eyeliner

## Product Principles

- Results should look realistic, not cartoonish.
- The app should help users visualize possibilities, not pressure them into procedures.
- Avoid language that makes users feel judged, insecure, or flawed.
- Keep the experience private, respectful, and confidence-focused.
- Clearly label generated previews as simulations, not medical predictions.
- Do not claim that a preview guarantees real cosmetic results.
- Prefer subtle, natural-looking changes over exaggerated transformations.
- Treat the app as a visualization and education product, not a diagnostic or treatment-recommendation product.
- Prompts must avoid aggressive or extreme edits. Ask for refined, natural, believable improvements.

## Research-Backed Priorities

- Prioritize rhinoplasty, eyelid changes, facelift/mini facelift, brow lift, injectables, fillers, lip augmentation, jawline/chin contouring, cheek volume, skin texture, and skin tone because these appear repeatedly in facial aesthetics statistics, competitor products, and virtual beauty tools.
- Include both surgical and non-surgical categories because minimally invasive treatments such as neuromodulators, fillers, skin treatments, and chemical peels dominate modern aesthetic procedure volume.
- Support natural-looking "preservation" and "refresh" results, since current facial aesthetics trends emphasize subtle changes instead of overdone transformations.
- Add before/after comparison, save/share, and variation browsing because established beauty-tech and aesthetic-simulation products commonly use these flows.
- Keep uploaded face processing privacy-first. Face images and facial geometry may be biometric or sensitive personal data.
- Add emotional-safety guardrails. Avoid negative labels like "flaw," "fix," "bad skin," or "problem face." Use neutral labels such as "preview," "variation," "smoother," "lifted," and "refined."
- Avoid implying that generated images predict exact surgical outcomes. Real outcomes depend on anatomy, clinician skill, healing, product choice, and medical suitability.

## Safety And Privacy

- Treat uploaded selfies as sensitive personal data.
- Do not store uploaded images unless the user clearly opts in.
- Make deletion and reset behavior obvious.
- Avoid collecting unnecessary personal information.
- Do not target minors; the intended audience is 18+.
- Avoid medical advice. Cosmetic and medical procedure decisions should be discussed with qualified professionals.
- Include disclaimers where needed that previews are visual estimates only.
- Get clear consent before using face detection, facial analysis, or face-generation features.
- Be transparent about whether images are processed on-device, on a server, or by a third-party AI provider.
- Do not use uploaded photos to train models unless the user gives explicit, separate consent.
- Provide a quick way to delete uploaded images, generated outputs, and face-analysis data.
- Consider adding a gentle support path if a user repeatedly generates extreme changes or shows signs of distress.

## Technical Expectations

- Read existing code before modifying anything.
- Match existing patterns, naming, and style.
- Keep changes small and scoped to the request.
- Handle image upload errors gracefully.
- Validate file type and size before processing uploads.
- Avoid hardcoding secrets, API keys, or credentials.
- Ask before adding new dependencies or external AI/image services.
- Run available build, lint, and tests after implementation changes.
- Use an environment variable for the OpenRouter API key.
- Do not expose the OpenRouter API key in frontend client code.
- Send image editing requests through a server/API route.
- Store only MVP session data in local storage. Do not rely on local storage for secrets.
- Keep generated prompt templates conservative and reusable across the 5 essential predefined result categories.

## UX Expectations

- Make the upload flow simple and mobile-friendly.
- Prioritize clear before/after comparison.
- Use controls that feel familiar: sliders for intensity, toggles for enabling changes, tabs or categories for feature groups.
- Allow users to combine multiple changes and reset each one individually.
- After upload, generate and display 5 predefined facial-change images in the gallery for the free-key MVP.
- Make the first screen the actual app experience, not a marketing landing page.
- Use calm, polished, beauty-focused visual design without making the UI feel clinical.

## Commands

Install: No install step is required for the current dependency-free Node MVP.
Dev: `npm run dev`
Build: No build step is required for the current static frontend.
Test: `npm run check`
Lint: No linter is configured yet.

## Response Style

- Respond with clear and concise messages.
- Use plain English when explaining changes.
- Avoid long paragraphs unless needed for technical clarity.
