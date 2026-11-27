'use strict'

// The feed of the Activity notices (notice-feed.js) wired to DWC 3.6: the published notifications state, the history read of the service, THE notices
// center of the family (vue/_shared36/notices.js: where, how long and which look are the choice of THIS screen, NoticeOptions.vue; note 13, 2026-11-23)
// and the one-second clock of the family. index.js starts it when DWC loads the plugin, so the notices run on every page of DWC. A second load of the bundle
// stops the first poller through a key on `window`, so there are never two.

import store from '@/store'
import { makeNotification } from '@/utils/notifications'
import { LogType } from '@/utils/logging'
import i18n from '../../i18n'
import { rawCall } from './workshop-api.js'
import { noticeOf } from './activity-notice.js'
import { createNoticeFeed, FEED_EVERY_MS } from './notice-feed.js'
import { readableKind } from './event-kinds.js'
import { installNotices } from './notices.js' // vue/_shared36: THE notices center
import { sharedScheduler } from './tick-scheduler.js' // vue/_shared36
import { escapeHtml } from './toast-options.js' // vue/_shared36

const KEY = '__workshopActivityNoticeFeed'
const t = (k, p) => i18n.t('plugins.WorkshopActivity.activity.' + k, p)

const SOURCE = 'WorkshopActivity'
const DWC_TYPE = { info: 'info', success: 'info', warning: 'warning', error: 'warning', refusal: 'warning' }

// THE notices center of this tab (the first plugin that asks installs it). This plugin can show DWC's own notification, so it opens that door once
// for the "DWC notification" look of the screen (the center decides when to use it; a failed door falls back to the card). Texts are escaped: DWC prints HTML.
function center() {
	const c = installNotices()
	if (c && typeof c._setDwcDoor === 'function' && !c._door) {
		c._setDwcDoor(n => {
			try {
				return makeNotification(DWC_TYPE[n.level] === 'info' ? LogType.info : LogType.warning, escapeHtml(n.title || ''), escapeHtml(n.text || ''), null) !== null
			} catch (e) {
				console.warn('[WorkshopActivity] notice not shown:', e)
				return false
			}
		})
	}
	return c
}

// one card per kind of event (the same id replaces the previous one); the center decides the place, the time and how many wait
function post(id, title, text, tone) {
	const c = center()
	if (c) c.post({ source: SOURCE, id: String(id), level: tone === 'warning' ? 'warning' : 'info', title, text })
}

// the read of the history: no dialogs, no cards, no "forbidden" events; a refused read (no session, a role too low) just fails and the feed waits
async function list(args) {
	const j = await rawCall('activity.list', args, { plugin: 'service' })
	if (!j || !j.ok) throw new Error((j && j.error && j.error.code) || 'refused')
	return j.result
}

// the title of a card: the label of the type as the service publishes it (already in the language of DWC), the readable code otherwise
function labelOf(kind, notice) {
	const row = notice && Array.isArray(notice.catalog) ? notice.catalog.find(c => c.kind === kind) : null
	return (row && row.label) || readableKind(kind)
}

// the "Test on this device" button: a sample card in the style and the corner chosen now, with the same path a real event takes (no history, no phone)
export function previewDeviceNotice() {
	post('activity:preview', t('device_test_title'), t('device_test_text'), 'info')
}

let feed = null
let job = null

export function startNoticeFeed() {
	if (feed) return feed
	const win = typeof window === 'undefined' ? null : window
	if (win && win[KEY]) win[KEY]()
	feed = createNoticeFeed({
		readNotice: () => noticeOf(store),
		list,
		now: () => new Date(),
		locale: () => String(i18n.locale || 'es'),
		fire: (id, title, message, tone) => post(id, title, message, tone),
		labelOf
	})
	job = sharedScheduler().every(() => { feed.poll() }, FEED_EVERY_MS)
	if (win) win[KEY] = () => sharedScheduler().remove(job)
	return feed
}
