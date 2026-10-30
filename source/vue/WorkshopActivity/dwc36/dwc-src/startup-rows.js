'use strict';

// Rows of the start-up card of Activity (vue/_shared/StartupPanel.vue). Pure function (no imports): tests/startup-plugins.test.js
// loads it in node. The labels are keys of plugins.WorkshopActivity.startup.*.
//
// The history needs nothing from the machine but the service (it keeps the database). The phone alerts (ntfy) are
// optional: off or without a topic is orange (still to configure; "Do not use" turns the row off), never red.
//
// c = { historial: true | false | null,   the history answered (true), failed (false) or was not asked yet (null)
//       eventos: number,                  events counted by the history
//       avisos: null | { activo: bool, servidor: string, topic: string } }   notifications.config published by the service
export function rowsActivity(c) {
	const out = [];
	if (c && (c.history === true || c.history === false)) {
		out.push({
			id: 'history',
			state: c.history ? 'configured' : 'missing',
			label: 'row_history', what: 'row_history_what', why: 'row_history_for', ifMissing: 'row_history_missing',
			help: 'row_history_tip',
			params: { n: c.events || 0 },
			texts: { configured: 'history_ok', missing: 'history_down' }
		});
	}
	const a = c && c.notices;
	if (a) {
		const destination = !!(a.server && a.topic);
		out.push({
			id: 'alerts',
			state: !a.active ? 'example' : destination ? 'configured' : 'missing',
			label: 'row_alerts', what: 'row_alerts_what', why: 'row_alerts_for', ifMissing: 'row_alerts_missing',
			help: 'row_alerts_tip',
			texts: { configured: 'alerts_on', example: 'alerts_off', missing: 'alerts_no_topic' }
		});
	}
	return out;
}
