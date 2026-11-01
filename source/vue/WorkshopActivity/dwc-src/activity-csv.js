// activity-csv.js -- what the Activity CSV export holds: the columns (fixed keys, never translated) and a row per event. The file itself
// (layout, quoting, byte order mark, name) is written by the shared exchange module (exchangeExportCsv, docs-internal/DATA-EXCHANGE.md).
'use strict'

export const ACTIVITY_CSV_COLUMNS = ['id', 'ts', 'type', 'mode', 'description', 'duration_s', 'energy_kwh', 'detail', 'user']

export function activityCsvRows(events) {
	return (events || []).map(f => [f.id, f.ts, f.kind, f.mode, f.description, f.duration_s, f.consumption_kwh, f.detail, f.user])
}

// the base of the file name: the days it covers (range = { from, to }, texts that start with YYYY-MM-DD)
export function activityCsvBase(range) {
	return 'workshop-activity-' + String(range.from).slice(0, 10) + '-to-' + String(range.to).slice(0, 10)
}
