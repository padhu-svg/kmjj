# Community Event Registration & Verification Platform

This workspace contains a production-oriented event registration and attendance management application built for a large physical community event with multiple simultaneous counters.

## Project structure

- `frontend/` — React + TypeScript UI
- `backend/` — Google Apps Script backend for spreadsheet operations

## What is included

- Registration counters separated from verification counters
- Landing page and route-based workflows for `/register` and `/search`
- Duplicate registration warnings
- Search by name, phone, angasamste, or pincode using OR logic
- Attendance verification flow with family member selection and phone update
- Server-side duplicate avoidance and concurrent write protection using `LockService.getScriptLock()`
- Google Sheets integration using the provided spreadsheet ID

## Important limitation

This version derives the Member ID from the spreadsheet row number because the source schema does not include a dedicated `MemberID` column.

Example:

- Row 2 => `M000002`
- Row 3 => `M000003`

This is intentionally retained and documented rather than altering the Members sheet schema.

## Frontend setup

From the `frontend` folder:

1. Copy `.env.example` to `.env`
2. Set `VITE_GAS_URL` to the deployed Google Apps Script web app URL
3. Install dependencies:

```bash
npm install
```

4. Run the app locally:

```bash
npm run dev
```

5. Build for production:

```bash
npm run build
```

## Apps Script deployment

1. Open Google Apps Script.
2. Create a project and paste the contents of `backend/Code.gs`.
3. Create `appsscript.json` and paste the JSON from `backend/appsscript.json`.
4. Deploy:
   - Deploy -> New deployment
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone
5. Copy the generated URL:

```text
https://script.google.com/macros/s/XXXXXXXX/exec
```

6. Set the frontend environment variable:

```env
VITE_GAS_URL=https://script.google.com/macros/s/XXXXXXXX/exec
```

7. Rebuild the frontend.

## Google Spreadsheet behavior

The backend uses the required spreadsheet ID:

```js
SpreadsheetApp.openById('12zYH5SpV2wtoWETjBb7yV2JnMr4rwgqYaGXUg_dN8rY');
```

It ensures the following tabs exist:

- `Members`
- `Attendance`

And ensures the expected column headers exist.

## Testing

### Frontend

```bash
cd frontend
npm install
npm run build
```

### Backend

After deploying the Apps Script, test the API by posting JSON payloads with `action: "register"`, `action: "search"`, and `action: "verifyAttendance"`.

## Notes

- The frontend never reads the spreadsheet directly.
- All spreadsheet access is done by the Apps Script backend.
- Errors are returned in the required format:

```json
{ "success": false, "error": "Human-readable error message" }
```
