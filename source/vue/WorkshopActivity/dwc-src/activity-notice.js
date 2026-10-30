'use strict'

// The notifications state the service publishes (plugins.WorkshopService.data.notifications) as the Activity page reads it: with
// its texts ({key, params}) already in the language of DWC, or null while the service has not published it.
// Shared by the page (header chip, start-up card) and the Alerts section. Reactive: call it inside computed().

import { modelPlugins } from './dwc-host.js'
import { pluginOf, dataOf } from './workshop-ids.js'
import { serviceTexts } from './service-text.js'

export function noticeOf() {
	const p = pluginOf(modelPlugins(), 'service')
	const n = p ? serviceTexts(dataOf(p, 'notifications')) : null
	return n && n.config ? n : null
}
