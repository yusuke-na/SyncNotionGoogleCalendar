<div align="center">  

# Sync Notion-GoogleCalendar

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Language: JavaScript](https://img.shields.io/badge/Language-JavaScript-f1e05a.svg)](https://github.com/yusuke-na/SyncNotionGoogleCalendar) [![Platform: Google Apps Script](https://img.shields.io/badge/Platform-Google%20Apps%20Script-blue.svg)](https://developers.google.com/apps-script) [![API: Notion](https://img.shields.io/badge/API-Notion-black.svg)](https://developers.notion.com/) [![API: Google Calendar](https://img.shields.io/badge/API-Google%20Calendar-red.svg)](https://developers.google.com/calendar)  

**[🇯🇵 日本語版 README はこちら / Japanese README](README_JP.md)**  

**A Google Apps Script project that provides bidirectional synchronization between Notion databases and Google Calendar.**  
**Automatically sync tasks and schedules managed in Notion to Google Calendar.**  

</div>  

## ✨ Features Overview

- **🔄 Auto Sync**: Automatically synchronizes Notion items with "Schedule" tags to Google Calendar every 15 minutes
- **📅 Date Processing**: Supports all-day events, timed events, and period events
- **🛡️ Duplicate Prevention**: Prevents duplicate creation using Event IDs
- **↔️ Bidirectional Sync**: Reflects changes and deletions in Notion to the calendar

## 🚀 Setup

### 1️⃣ Prerequisites
- Node.js (v16 or later)
- npm
- Google Account
- Notion Account

### 2️⃣ Notion API Configuration

#### Creating Notion Integration
1. Access [Notion Developers](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Enter integration name (e.g., `GoogleCalendar-Sync`)
4. Click **"Submit"**
5. Copy and save the **Internal Integration Token**

#### Obtaining Database Information
1. Open the Notion database to be synchronized
2. Get the **Database ID** from the URL
   - `https://notion.so/workspace/{database-id}?v={view-id}`
   - The `{database-id}` part is the database ID
3. Get the **"Schedule tag" Page ID**
   - Click on the Schedule tag → Get the page ID from the URL

#### Database Sharing Settings
1. Click "⋯" at the top right of the database → "Add connections"
2. Select and add the created integration

### 3️⃣ Google APIs Configuration

#### Google Cloud Console Setup
1. Access [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google Calendar API**
   - "APIs & Services" → "Library"
   - Search for "Google Calendar API" and enable it
4. Enable **Google Apps Script API**
   - Follow the same procedure to enable

### 4️⃣ Building Google Apps Script Project with npm and clasp

#### Installing and Authenticating clasp
```bash
# Navigate to the project folder
cd SyncNotionGoogleCalendar

# Install dependencies
npm install

# Login to Google account with clasp
npm run login
```

#### Creating and Deploying Google Apps Script Project
```bash
# Create a new GAS project (first time only)
npm run create

# Push code to Google Apps Script
npm run push
```

### 5️⃣ Google Apps Script Configuration

#### Setting Script Properties
1. Access [Google Apps Script](https://script.google.com/)
2. Open the created project
3. Left menu "Project Settings" → "Script properties"
4. Add the following properties:

| Property Name        | Value                             | Description                       |
| -------------------- | --------------------------------- | --------------------------------- |
| `NOTION_API_KEY`     | `secret_xxxxx...`                 | Notion Internal Integration Token |
| `NOTION_DATABASE_ID` | `xxxxxxxxx...`                    | Target Notion Database ID         |
| `SCHEDULE_TAG_ID`    | `xxxxxxxxx...`                    | "Schedule" tag Page ID            |
| `CALENDAR_ID`        | `primary` or specific calendar ID | Target Google Calendar (optional) |

#### Enabling Required API Services
1. Left menu "Services"
2. Enable **Google Calendar API** (select v3)

### 6️⃣ Notion Database Configuration

To ensure proper synchronization, the following properties are required in the Notion database:  

| Property Name  | Type     | Required | Description                                  |
| -------------- | -------- | -------- | -------------------------------------------- |
| **Title**      | Title    | ✅        | Event title                                  |
| **Action Day** | Date     | ✅        | Event date and time                          |
| **Tags**       | Relation | ✅        | Relation containing "Schedule" tag           |
| **Status**     | Status   | ❌        | Task status                                  |
| **Event ID**   | Text     | ❌        | Google Calendar Event ID (automatically set) |
| **URL**        | URL      | ❌        | Related links                                |

## 📖 Usage

### 1️⃣ Initial Setup Execution

Execute initial setup in Google Apps Script editor:  

```javascript
// Execute initialization function (first time only)
initialize();
```

This function performs the following:  
- Verifies script properties
- Tests Google Calendar API connection
- Sets up automatic sync trigger (15-minute intervals)

### 2️⃣ Schedule Management in Notion

#### Creating Schedule Items
1. Create a new page in the Notion database
2. Enter event name in **Title**
3. Set date and time in **Action Day**:
   - **All-day event**: Date only (e.g., `2023-12-25`)
   - **Timed event**: Specify date and time (e.g., `2023-12-25 14:30`)
   - **Period event**: Set start and end date/time
4. Add "Schedule" tag to **Tags**

#### Sync Target Conditions
- ✅ "Schedule" tag is included in `Tags`
- ✅ `Action Day` is set
- ✅ `Action Day` is within sync range (30 days ago to 90 days ahead)
- ❌ Items not meeting the above criteria are excluded from sync

### 3️⃣ Automatic Sync Operation

#### Sync Timing
- **Automatic sync**: Executes every 15 minutes
- **Manual sync**: Execute `manualSync()` in Google Apps Script editor

#### Synchronized Operations
| Notion Operation      | Google Calendar |
| --------------------- | --------------- |
| 📝 Create new          | ➕ Create event  |
| ✏️ Change title        | 🔄 Update event  |
| 📅 Change date/time    | 🔄 Update event  |
| ❌ Remove Schedule tag | 🗑️ Delete event  |
| 🗑️ Delete page         | 🗑️ Delete event  |

### 4️⃣ Event Format Examples

#### All-Day Event
```
Title: Meeting Preparation
Action Day: 2023-12-25
→ Google Calendar: 12/25 all-day event
```

#### Timed Event
```
Title: Team Meeting
Action Day: 2023-12-25 14:00 → 2023-12-25 15:30
→ Google Calendar: 12/25 14:00-15:30
```

#### Multi-Day Event
```
Title: Business Trip
Action Day: 2023-12-25 → 2023-12-27
→ Google Calendar: 12/25-12/27 all-day event
```

### 5️⃣ Sync Status Verification

#### Tracking with Event ID
- Synchronized Notion pages automatically have **Event ID** set
- This ID manages the connection with Google Calendar
- Pages with Event ID are already synchronized

#### Checking Sync Logs
Check sync status in Google Apps Script editor execution logs:  
```
=== Sync Process Started ===
Retrieved 3 schedule items from Notion
Retrieved 5 events from Google Calendar
=== Sync Process Completed ===
Created: 1, Updated: 1, Deleted: 0
```  

## 🔧 Troubleshooting

### ❌ Common Errors and Solutions

#### 1. **Notion API Connection Error**
```
Error: Notion API Error (401): Unauthorized
```

**Causes and Solutions:**  
- ❌ **NOTION_API_KEY** is not set correctly
  - ✅ Verify the Internal Integration Token obtained from Notion Developers
  - ✅ Set correctly in Google Apps Script script properties
- ❌ Integration not added to database
  - ✅ Notion database → "⋯" → "Add connections" to add integration

#### 2. **Unable to Retrieve Schedule Items**
```
Log: Retrieved 0 schedule items from Notion
```

**Causes and Solutions:**  
- ❌ **SCHEDULE_TAG_ID** is incorrect
  - ✅ Open "Schedule" tag page and verify page ID from URL
  - ✅ Page ID is a 32-character string including hyphens
- ❌ No items with "Schedule" tag in database
  - ✅ Create items in Notion and add "Schedule" tag
  - ✅ Verify that Action Day is also set

#### 3. **Google Calendar API Connection Error**
```
Error: Google Calendar API is not enabled
```

**Causes and Solutions:**  
- ❌ Calendar API not enabled in Google Apps Script
  - ✅ Google Apps Script → "Services" → Add Google Calendar API v3
- ❌ Calendar API disabled in Google Cloud Console
  - ✅ Google Cloud Console → APIs & Services → Library → Enable Google Calendar API

#### 4. **Sync Not Executing**
```
Log: Trigger not set
```

**Causes and Solutions:**  
- ❌ Periodic execution trigger not set
  - ✅ Google Apps Script → Triggers → Verify 15-minute interval trigger for `syncNotionWithGoogleCalendar` function
  - ✅ Or execute `initialize()` function to automatically set trigger

#### 5. **Date Format Error**
```
Error: Valid Action Day is not set
```

**Causes and Solutions:**  
- ❌ Notion Action Day property is empty
  - ✅ Set appropriate date in Notion Action Day
- ❌ Action Day format is incorrect
  - ✅ All-day: `2023-12-25`
  - ✅ Timed: `2023-12-25T14:30:00`
  - ✅ Period: Set start date → end date

#### 6. **Permission Error**
```
Error: Insufficient permissions
```

**Causes and Solutions:**  
- ❌ Calendar scope insufficient in Google Apps Script
  - ✅ Approve required permissions when executing script
  - ✅ Click "Review permissions" on "Authorization required" screen

#### 7. **Calendar Usage Limits Exceeded**
```
Error: API call to calendar.events.insert failed with error: Calendar usage limits exceeded.
```

**Causes and Solutions:**  
- ❌ Events outside the sync range were repeatedly created, exceeding Google Calendar API quotas
  - ✅ Run `cleanupDuplicateEvents(true)` as a dry run to check the scale of duplicates
  - ✅ Run `cleanupDuplicateEvents(false)` to delete duplicate events
  - ✅ Update to the latest version to apply the date range filter fix

### 🔍 Debugging Methods

#### Checking Logs
1. Google Apps Script → "Execute" → Run any function
2. Check error details in "Execution log"
3. Add `Logger.log()` for detailed debugging

#### Manual Testing
```javascript
// Testing individual functions
function testNotionConnection() {
  const items = getNotionScheduleItems();
  Logger.log(`Number of items retrieved: ${items.length}`);
  items.forEach(item => Logger.log(item.title));
}

function testCalendarConnection() {
  const events = getGoogleCalendarEvents();
  Logger.log(`Number of events retrieved: ${events.length}`);
}
```

#### Verifying Configuration Values
```javascript
function checkConfiguration() {
  const config = {
    apiKey: CONFIG.NOTION_API_KEY ? 'Set' : 'Not set',
    databaseId: CONFIG.NOTION_DATABASE_ID ? 'Set' : 'Not set',
    scheduleTagId: CONFIG.SCHEDULE_TAG_ID ? 'Set' : 'Not set'
  };
  Logger.log(config);
}
```

#### Cleaning Up Duplicate Events
```javascript
// Check for duplicate events (dry run)
cleanupDuplicateEvents(true);

// Delete duplicate events (execute)
cleanupDuplicateEvents(false);
```

### ⚠️ Important Notes

- **Rate Limits**: Notion API allows maximum 3 requests per second
- **Time Zone**: Set to `Asia/Tokyo` by default
- **Sync Range**: Only targets events from 30 days ago to 90 days in the future
- **Duplicate Prevention**: Prevents duplicate creation through Event ID linking  

## 🗃️ Notion Database Items Used in This Project

![Notion Database Properties](https://github.com/yusuke-na/SyncNotionGoogleCalendar/blob/main/img/notion-database-property.png?raw=true)  
![Notion Schedule Tags](https://github.com/yusuke-na/SyncNotionGoogleCalendar/blob/main/img/notion-tags-schedule.png?raw=true)  

## 📄 License

This project is licensed under the **[MIT License](https://github.com/yusuke-na/SyncNotionGoogleCalendar/blob/main/LICENSE)**.   

### 🤝 Contributing

Contributions to this project are welcome!  
- 🐛 Bug reports
- 💡 Feature suggestions  
- 🔧 Pull requests

Please feel free to report details in [GitHub Issues](https://github.com/yusuke-na/SyncNotionGoogleCalendar/issues).  
