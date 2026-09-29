---
name: ALKIFAH upload boundaries
description: Legacy LMS target details and the browser security boundary around laptop files and authenticated uploads.
---

The legacy workflow targets `lms.alkifah.edu.sa`, with login at `/Identity/Account/LogIn` and material uploads at `/CourseManagement/Materials/Create`. It checks duplicate titles and treats PowerPoint-to-PDF conversion as the preferred upload path.

**Why:** A normal browser app cannot read an arbitrary typed laptop path or reuse a user's authenticated LMS session for direct submission. The control room should therefore prepare a user-reviewed file queue and hand off to the official LMS page unless a separate desktop/automation bridge is explicitly added.

**How to apply:** Keep LMS credentials out of browser code. Treat direct LMS automation and Google Drive OAuth as separate integrations, not silent client-side shortcuts.