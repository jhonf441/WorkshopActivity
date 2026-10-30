'use strict'

// The notifications state the service publishes (plugins.WorkshopService.data.notifications) as the Activity page reads it: with
// its texts ({key, params}) already in the language of DWC, or null while the service has not published it.
// Shared by the page (header chip, start-up card) and the Alerts section.

import { pluginOf } from './workshop-ids.js'
import { serviceTexts } from './service-text.js'

export function noticeOf(store) {
	const plugins = store.state.machine.model.plugins
	const p = pluginOf(plugins, 'service')
	const n = p && p.data ? serviceTexts(p.data.notifications) : null
	return n && n.config ? n : null
}
