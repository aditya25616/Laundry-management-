<!-- BEGIN:nextjs-agent-rules -->

<!-- ## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean. -->

<!-- END:nextjs-agent-rules -->



# AGENTS.md

## Project Overview

This is a Hostel Laundry Management System.

The main goal is to provide students with visibility into the laundry journey and create accountability at every stage.

The system should help prevent:
- Lost or misplaced clothes
- Incorrect tagging
- Unclear laundry status
- Pickup confusion
- Unstructured disputes
- Lack of responsibility tracking

## Tech Stack

- Next.js
- React
- JavaScript
- Tailwind CSS
- MongoDB
- Mongoose
- Next.js App Router
- Next.js Route Handlers

Do not introduce another framework or major library unless there is a clear requirement.

## User Roles

The system has three primary roles:

### Student
- Submit laundry
- View laundry items
- View tag information
- Track laundry status
- View batch status
- Receive pickup notifications
- Confirm pickup
- Raise disputes
- Track dispute status

### Staff
- Verify tags
- Create and manage batches
- Update laundry status
- Manage pickup
- Investigate disputes
- Update dispute status

### Admin
- Manage students and staff
- View all laundry
- View batches
- Manage disputes
- View system activity
- View reports and statistics

## Core Laundry Workflow

Follow this workflow:

Student submits laundry
→ Tag generated
→ Tag verified
→ Laundry added to batch
→ Processing
→ Quality check
→ Ready for pickup
→ Student notified
→ Pickup verified
→ Completed

Any missing, damaged, or incorrect item can create a dispute.

## Accountability

Every important laundry status change should record:

- Who performed the action
- What action was performed
- Previous status
- New status
- Date and time
- Optional remarks

Do not remove status history when the current status changes.

## Project Structure

Use the Next.js App Router.

- `src/app/` — pages and layouts
- `src/app/api/` — API route handlers
- `src/components/` — reusable UI components
- `src/models/` — Mongoose models
- `src/lib/` — database, authentication, validation and utilities
- `public/` — static assets

Keep the project structure organized and predictable.

## Development Rules

1. Use JavaScript, not TypeScript.
2. Use functional React components.
3. Use Tailwind CSS for styling.
4. Prefer reusable components.
5. Avoid unnecessary code duplication.
6. Use meaningful variable and function names.
7. Keep business logic separate from UI when practical.
8. Do not modify unrelated files.
9. Do not rewrite working code unnecessarily.
10. Do not add dependencies unless they are necessary.
11. Keep the application runnable after every significant change.
12. Prefer simple solutions over unnecessary complexity.

## Authentication and Authorization

- Protect private routes and APIs.
- Verify the user's identity before accessing protected data.
- Verify the user's role before performing role-specific actions.
- Students must only access their own laundry and disputes.
- Staff must only perform authorized staff operations.
- Admins can access administrative functionality.

Never rely only on frontend checks for security.

## Database Rules

- Use Mongoose models.
- Validate incoming data.
- Use appropriate indexes for frequently searched fields.
- Tag IDs must be unique.
- Laundry orders must belong to the correct student.
- Batch assignments must be validated.
- Important status changes must be recorded.
- Avoid deleting important historical records unless explicitly required.

## API Rules

- Validate request data.
- Return appropriate HTTP status codes.
- Use consistent JSON response formats.
- Handle errors properly.
- Do not expose database errors or secrets to clients.
- Protect all private API routes.

## UI/UX Rules

The application should be:

- Clean
- Simple
- Responsive
- Mobile-friendly
- Accessible
- Easy for students to understand
- Efficient for staff to operate

Provide appropriate:

- Loading states
- Empty states
- Success messages
- Error messages
- Confirmation dialogs for destructive actions

## Error Handling

Handle:

- Invalid input
- Authentication errors
- Authorization errors
- Database errors
- Missing resources
- Duplicate records
- Invalid status transitions
- Network/API failures

Show user-friendly messages to users.

Do not expose sensitive technical information.

## Environment Variables

Never hardcode:

- Database credentials
- JWT secrets
- API keys
- Private tokens
- Other sensitive configuration

Use environment variables such as `.env.local`.

Never commit `.env.local` to GitHub.

## AI Coding Rules

Before making changes:

1. Understand the existing project structure.
2. Inspect related files.
3. Reuse existing components, models and utilities.
4. Make the smallest reasonable change.
5. Do not modify unrelated functionality.
6. Do not install packages without a clear reason.
7. Keep existing functionality working.
8. Check for errors after making changes.
9. Explain important architectural decisions.
10. If a requirement is unclear, ask before making a major architectural change.

## Development Priority

Build the MVP in this order:

1. Project setup
2. Database connection
3. Authentication
4. Role-based authorization
5. Student laundry submission
6. Tag management
7. Batch management
8. Laundry status tracking
9. Status history
10. Pickup management
11. Notifications
12. Dispute management
13. Staff dashboard
14. Admin dashboard
15. Testing
16. Deployment

Do not build advanced features before the core workflow works.

## Important Principle

The application is not just a laundry CRUD system.

The primary objective is:

Visibility → Verification → Accountability → Dispute Resolution

Every major feature should support one or more of these objectives.