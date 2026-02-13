# Technical Design: Single Project Page (`app/pages/app/projects/[id]/index.vue`)

## Overview
This document outlines the design for the Single Project Details page. The page will provide a comprehensive view of a project, including its status, configuration, deployments, and actions.

## 1. API Integration

### Data Fetching
-   **Project Details**: `GET /api/projects/:id`
    -   Returns: `Project` object.
-   **Deployments**: `GET /api/projects/:id/deployments`
    -   Returns: Array of deployments.
-   **Project Data**: `GET /api/projects/:id/data` (Optional/Tab)
    -   Returns: `ProjectData` object (custom key-value data).

### Actions
-   **Redeploy**: `POST /api/projects/:id/redeploy`
-   **Toggle Archive**: `POST /api/projects/:id/toggle-archive`
-   **Delete**: `DELETE /api/projects/:id`
-   **Duplicate**: `POST /api/projects/:id/duplicate`
-   **Runtime Events**: `POST /api/projects/:id/runtime-events` (if applicable for triggering events)

## 2. Component Structure

### Layout
Standard Dashboard Page Layout.

#### 1. Header
-   **Breadcrumbs**: Projects > [Project Name]
-   **Title Area**:
    -   Project Name (H1)
    -   Status Badge (`active`=green, `draft`=orange, `archived`=gray)
    -   Repository Link (Icon Button if exists)
    -   Vercel Link (Icon Button if exists)
-   **Actions Area**:
    -   **Primary**: "Redeploy" (if active/has vercel)
    -   **Secondary**: "Edit" (Links to `/app/projects/[id]/edit` or opens modal)
    -   **More**: `UDropdownMenu`
        -   Duplicate
        -   Archive/Unarchive
        -   Delete (Red color)

#### 2. Tabs (`UTabs`)
The main content will be organized into tabs.

**Tab 1: Overview**
-   **Description Card**:
    -   Project Description.
    -   Slug / Public URL.
    -   Created/Updated Timestamps.
-   **Configuration/Data Card**:
    -   Display `ProjectData` if available (Key/Value pairs).
-   **Quick Stats** (if available from deployments or other sources).

**Tab 2: Deployments**
-   **List/Table** of recent deployments.
    -   Columns: Status, Commit Message (if available), Branch, Date, Duration.
    -   Actions: "View Logs" (links to a logs view or modal).

**Tab 3: Settings** (Optional, or link to Edit page)
-   Danger Zone (Delete, Archive).

### 3. State Management
-   `const { data: project, refresh: refreshProject } = await useFetch(...)`
-   `const { data: deployments, refresh: refreshDeployments } = await useFetch(...)`
-   `const items = [{ label: 'Overview', slot: 'overview' }, { label: 'Deployments', slot: 'deployments' }]`

### 4. UI Guidelines Compliance
-   Use `UFormField` for any read-only field displays if it makes sense (or description lists).
-   Use `USeparator` to separate sections.
-   Use `UButton` variants correctly (ghost for secondary, solid for primary).
-   Use `UI MCP` to check component props if unsure.

## 3. Workflow
1.  **Page Load**: Fetch Project and Deployments.
2.  **User interactions**:
    -   Click **Redeploy**: Call API -> Show Toast -> Refresh Deployments.
    -   Click **Archive**: Call API -> Refresh Project (Status updates).
    -   Click **Delete**: Open Confirm Modal -> Call API -> Navigate to `/app/projects`.
