# Local Database and Desktop Architecture Design

## 1. Local Database Choice: SQLite

Given the existing SQL schema from Supabase and the requirement for a local, file-based database for a desktop application, SQLite is the most suitable choice. It is lightweight, serverless, and widely supported, making it ideal for embedded use within desktop applications.

## 2. Database Schema Migration

The existing Supabase schema, defined in the migration files (`supabase/migrations/*.sql`), will be directly translated to SQLite. The following tables and their respective columns, data types, and constraints will be replicated:

- `appointments`
- `orders`
- `order_items`
- `transactions`
- `rooms`
- `cafe_products`

UUIDs will be handled as TEXT in SQLite, and `TIMESTAMP WITH TIME ZONE` will be stored as `TEXT` in ISO 8601 format.

## 3. Data Synchronization (Initial Assessment)

For the initial conversion to a local desktop application, data synchronization with a remote server (like Supabase) will not be implemented. The application will operate entirely with the local SQLite database. If future requirements include multi-device access or cloud backup, a separate synchronization mechanism would need to be designed and implemented.

## 4. Desktop Application Framework: Electron

The `package.json` file indicates that the application is already set up with Electron (`"electron": "electron ."`, `"package": "electron-builder"`). This means the existing React frontend can be directly packaged into an Electron application. No significant architectural changes are required for the desktop framework itself in this phase, beyond integrating the local database access.
