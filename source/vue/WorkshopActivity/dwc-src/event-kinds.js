// event-kinds.js -- decisions about history events by their code, never by the translated text (tested in test/event-kinds.test.js)
'use strict';

// value of the "all types" filter: neutral, the translated label is shown apart
export const KIND_ALL = 'all';

// message keys the service stores for a job that did not finish well (dsf/db.py counts the same ones)
const CANCELLED_KEYS = ['job_cancelled', 'live_job_end_cancel', 'live_job_end_file_cancelled', 'live_job_end_interrumpido'];

// ev.message_key comes from the service when it sends the code of the message; while a service does not send it,
// the old text is the only clue left (Spanish history text and its English version)
export function isCancelledEvent(ev) {
	if (!ev) return false;
	if (ev.message_key) return CANCELLED_KEYS.indexOf(ev.message_key) >= 0;
	return /cancelad|cancelled|canceled|sin fin/i.test(ev.description || '') || /cancelled|canceled/i.test(ev.description_en || '');
}

// the filter value that goes to the API: nothing for "all"
export function kindFilter(actKind) {
	return actKind && actKind !== KIND_ALL ? actKind : '';
}

// the text of an event in the language of the page: the history is stored in Spanish and the service adds description_en; every
// language other than Spanish reads the English one (DWC 3.7 offers English and German, QA 3.7 #04)
export function eventText(ev, locale) {
	if (!ev) return '';
	return !String(locale).startsWith('es') && ev.description_en ? ev.description_en : ev.description;
}

// a type of event that has no label of its own: the code made readable ("meter_alarm" -> "Meter alarm"), never the bare code
export function readableKind(kind) {
	const s = String(kind == null ? '' : kind).replace(/_+/g, ' ').trim();
	return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}
