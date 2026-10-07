// Replace only the existing doGet(e) with this function.
// It uses the same sheet as doPost() when available and falls back to SensorData.
function doGet(e) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.getSheetByName("SensorData");
    if (!sheet) {
      return jsonResponse({ success: false, error: "Sensor data sheet not found" });
    }

    const values = sheet.getDataRange().getValues();
    if (values.length < 2) {
      return jsonResponse({ success: false, error: "No sensor readings found" });
    }

    const headers = values[0].map(value => String(value).trim());
    const requiredColumns = [
      "ID", "Timestamp", "Bridge_ID", "Distance_mm", "HX711_Raw",
      "Accel_X_g", "Accel_Y_g", "Accel_Z_g"
    ];
    const column = {};
    for (const name of requiredColumns) {
      column[name] = headers.indexOf(name);
      if (column[name] < 0) {
        return jsonResponse({ success: false, error: "Missing column: " + name });
      }
    }

    const timezone = spreadsheet.getSpreadsheetTimeZone();
    const records = values.slice(1).filter(row => row[column.ID] !== "").map(row => {
      const rawTimestamp = row[column.Timestamp];
      const timestamp = rawTimestamp instanceof Date
        ? Utilities.formatDate(rawTimestamp, timezone, "dd/MM/yyyy HH:mm:ss")
        : String(rawTimestamp || "");
      const number = value => value === "" || value === null ? NaN : Number(value);
      return {
        id: number(row[column.ID]),
        timestamp: timestamp,
        bridgeId: String(row[column.Bridge_ID] || ""),
        distance_mm: number(row[column.Distance_mm]),
        hx711_raw: number(row[column.HX711_Raw]),
        accel_x_g: number(row[column.Accel_X_g]),
        accel_y_g: number(row[column.Accel_Y_g]),
        accel_z_g: number(row[column.Accel_Z_g])
      };
    }).filter(record =>
      Number.isFinite(record.id) && record.timestamp && record.bridgeId &&
      Number.isFinite(record.distance_mm) && Number.isFinite(record.hx711_raw) &&
      Number.isFinite(record.accel_x_g) && Number.isFinite(record.accel_y_g) &&
      Number.isFinite(record.accel_z_g)
    );

    if (records.length === 0) {
      return jsonResponse({ success: false, error: "No valid sensor readings found" });
    }

    const history = records.slice(-50).reverse();
    if (e && e.parameter && e.parameter.history === "true") {
      return jsonResponse({ success: true, history: history });
    }
    return jsonResponse({ success: true, latest: history[0] });
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}
