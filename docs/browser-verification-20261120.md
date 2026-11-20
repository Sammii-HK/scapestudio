# Local browser verification, 20 November 2026

Source 3d586d1, served as the local production build. No application code changed in this verification pass. These observations do not establish what is deployed.

## Crop and curves

The synthetic tonal study opens the actual editor. Swapping orientation changes the initial 1200x900 crop to 675x900; the displayed export dimensions change with it. The exact width and height fields were then set to 600x400. They updated both the crop selection and the export plan to 2953x1969 at the selected 25cm width.

An exact curve point was added at 128/128, changed to output 180 and removed again. Endpoints remain. At a 390px viewport, dragging the crop's right handle changed the width from 600 to 731px. Document width remained 390px. This used mouse pointer input in a phone-sized layout, not a physical touchscreen certification.

## Actual downloaded output

The edited 600x400 crop produced a ZIP with colour, print and apparel PNGs. Every file decoded successfully at 2953x1969 with approximately 299.9994 DPI metadata. This selected crop contained bright sky; its apparel pixels stayed opaque, as expected for the dark-tone knockout threshold. The earlier full-study export separately contained alpha values from 0 to 255. Transparency depends on the selected pixels and threshold, not automatic object/background recognition.

## Local preset persistence

A preset named `Polish verification 20 Nov` was saved through the interface. After a page reload and reopening the study, it appeared in the preset menu. It was left in local browser storage; no existing presets or files were deleted. This test did not use raw database commands or a remote database.

## Evidence and limits

Screenshots in .codex-artifacts: scapestudio-phone-editor.jpg and scapestudio-desktop-editor.jpg. The desktop image shows the uncropped synthetic sample in Print view; the phone image shows the edited crop. The downloaded post-crop ZIP is /Users/sammii/Downloads/tonal-study_export (1).zip.

Large-source memory limits, HEIC across browsers, physical-touch behaviour, assistive technology and native iOS delivery remain unverified. The baseline production build, lint, TypeScript, 5 crop/export tests, 8 icon tests and dependency audit had passed before this browser-only pass. Nothing was pushed or deployed.
