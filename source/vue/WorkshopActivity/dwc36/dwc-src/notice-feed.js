'use strict'

// The feed of the Activity notices of "this device" (3.6 line): it reads the history the service already keeps (activity.list, a read of the viewer
// role) from time to time and shows a card of this browser for every NEW event that device-notice.js says must be announced. It runs on every page of
// DWC while DWC is open (index.js starts it), on the one-second clock of the family (vue/_shared36/tick-scheduler.js), and it only asks when the
// channel is "device" or "both": with "phone" it does nothing at all. The first answer after it turns on only sets the cursor (what was already in the
// history is not announced); a refused or failed read says nothing and tries again later. Everything outside the logic comes in through `host`, so
// test/notice-feed.test.js runs it in node.
//
// host: { readNotice() -> notice | null, list(args) -> Promise<{ rows }>, now() -> Date, locale() -> string,
//         fire(id, title, message, tone), labelOf(kind, notice) -> string }

import { channelOf, deviceOn, noticePlan, dayStart } from './device-notice.js'
import { eventText } from './event-kinds.js'

export const FEED_EVERY_MS = 5000
export const FAILURE_BACKOFF_POLLS = 6 // after a refused or failed read: skip this many polls (30 s)
const PAGE = 50

export function createNoticeFeed(host) {
	let cursor = null // the highest event id already seen (null: not read since it turned on)
	let busy = false
	let skip = 0

	// one poll; resolves the number of cards it fired (0 when it did nothing)
	async function poll() {
		if (busy) return 0
		if (skip > 0) { skip--; return 0 }
		const notice = host.readNotice()
		if (!notice || !deviceOn(channelOf(notice))) { cursor = null; return 0 }
		busy = true
		try {
			const now = host.now()
			const data = await host.list({ from: dayStart(now), limit: PAGE })
			const rows = data && Array.isArray(data.rows) ? data.rows : []
			const ids = rows.map(r => Number(r.id)).filter(Number.isFinite)
			if (cursor === null) { cursor = ids.length ? Math.max.apply(null, ids) : 0; return 0 }
			const fresh = rows.filter(r => Number(r.id) > cursor).sort((a, b) => Number(a.id) - Number(b.id))
			if (ids.length) cursor = Math.max(cursor, Math.max.apply(null, ids))
			let fired = 0
			fresh.forEach(ev => {
				const plan = noticePlan(notice, ev, now)
				if (!plan) return
				// one message per type: a new event of the same type replaces the one still waiting
				host.fire('activity:' + ev.kind, host.labelOf(ev.kind, notice), eventText(ev, host.locale()), plan.tone)
				fired++
			})
			return fired
		} catch (e) {
			skip = FAILURE_BACKOFF_POLLS // no session, no service, a refusal: nothing is said and nothing is hammered
			return 0
		} finally {
			busy = false
		}
	}

	return {
		poll,
		get cursor() { return cursor }
	}
}
