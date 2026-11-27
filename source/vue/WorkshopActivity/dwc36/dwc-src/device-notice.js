'use strict'

// "This device" destination of the Activity notices (3.6 line): which of the events the history just got must be announced here, with a card of this
// browser, and how. The service publishes the settings (plugins.WorkshopService.data.notifications: the channel, the types that notify, their options,
// the quiet hours, the mute); the rule is the one the service applies to the phone (notifier.py plan_sending) minus what only the phone needs (the
// ntfy topic and the master switch), so a person who only wants the notices on this device never has to turn the phone on. Pure: test/device-notice.test.js.

export const CHANNELS = Object.freeze(['phone', 'device', 'both'])

// where the events are announced; a service that does not publish it yet only knows the phone
export function channelOf(notice) {
	const c = notice && notice.config ? notice.config.channel : ''
	return CHANNELS.indexOf(c) >= 0 ? c : 'phone'
}

export const deviceOn = channel => channel === 'device' || channel === 'both'
export const phoneOn = channel => channel === 'phone' || channel === 'both'

// the phone is ready when the alerts are on and a destination exists (what the service needs to send anything)
export function phoneReady(notice) {
	return !!(notice && notice.config && notice.config.active && notice.config.topic_set)
}

const minutes = hhmm => Number(String(hhmm).slice(0, 2)) * 60 + Number(String(hhmm).slice(3, 5))

// true when `date` falls within the scheduled silence (the same rule as notifier.in_schedule)
export function inQuietHours(h, date) {
	if (!h || !h.active) return false
	const now = date.getHours() * 60 + date.getMinutes()
	const from = minutes(h.since)
	const to = minutes(h.until)
	if (from === to) return false // same hour twice: no silence (not "all day" by mistake)
	return from < to ? from <= now && now < to : now >= from || now < to
}

// -> null (do not announce) or { kind, priority, tone: 'warning' | 'info', soft }. `now` is a Date.
export function noticePlan(notice, ev, now) {
	const cfg = notice && notice.config
	if (!cfg || !ev || !deviceOn(channelOf(notice))) return null
	if (!cfg.kinds || !cfg.kinds[ev.kind]) return null
	if (Number(cfg.silence_until || 0) * 1000 > now.getTime()) return null // muted (the sidebar's "mute 1 h")
	const o = (cfg.options && cfg.options[ev.kind]) || {}
	const quiet = !!o.schedule && inQuietHours(cfg.schedule, now)
	if (quiet && cfg.schedule.mode === 'mute') return null
	const priority = o.priority || 'default'
	const loud = priority === 'high' || priority === 'urgent' || ev.kind === 'error' || ev.kind === 'emergency'
	return { kind: ev.kind, priority, tone: loud ? 'warning' : 'info', soft: quiet }
}

// the start of the day of `date` as the service wants a range (YYYY-MM-DDTHH:MM:SS)
export function dayStart(date) {
	const p = n => String(n).padStart(2, '0')
	return date.getFullYear() + '-' + p(date.getMonth() + 1) + '-' + p(date.getDate()) + 'T00:00:00'
}
