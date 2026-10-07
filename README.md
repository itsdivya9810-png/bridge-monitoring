# Civic Nova

React + Vite prototype for smart bridge monitoring.

## Run locally

1. Install Node.js (version 18 or newer).
2. From the project folder, install dependencies:

   ```sh
   npm install
   ```

3. Start the development server:

   ```sh
   npm run dev
   ```

Vite prints the local URL in the terminal (typically `http://localhost:5173/`).

The interface keeps its bridge-health score, alerts, and bridge-history details as prototype data. Sensor readings and recent history are fetched from the Apps Script API when configured.

## Configure sensor data

`src/config/api.js` contains the public Apps Script Web App `/exec` URL. The endpoint must return `{ "success": true, "latest": { ... } }` for a normal GET and `{ "success": true, "history": [ ... ] }` for `?history=true`. The API client calls the original `/exec` URL and reads the JSON response.

To update the deployed Apps Script, replace only its existing `doGet(e)` function with `apps-script/doGet-replacement.gs`, leave `doPost()` and `jsonResponse()` unchanged, then update the existing web-app deployment to a new version. The GET handler reads the existing `SHEET_NAME` first (the pasted `doPost()` uses `bridge monitoring`) and falls back to a tab named `SensorData` if needed.
