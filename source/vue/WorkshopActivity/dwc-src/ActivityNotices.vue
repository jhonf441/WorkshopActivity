<template>
	<v-card class="mb-3">
		<v-card-title>
			{{ $t('plugins.WorkshopActivity.activity.phone_notifications') }}
			<v-spacer />
			<v-switch
				v-if="notice" :model-value="notice.config.active" density="compact" hide-details
				:label="notice.config.active ? $t('plugins.WorkshopActivity.activity.on_plural') : $t('plugins.WorkshopActivity.activity.off_plural')"
				@update:model-value="setActive"
			/>
		</v-card-title>
		<v-card-text v-if="!notice" class="text-medium-emphasis">
			{{ $t('plugins.WorkshopActivity.activity.waiting_for_backend') }}
		</v-card-text>
		<v-card-text v-else>
			<div class="text-body-medium mb-4" style="color:var(--tp-faint)">
				{{ $t('plugins.WorkshopActivity.activity.every_event_in_this_list_is') }}
				<a href="https://ntfy.sh" target="_blank" rel="noopener">ntfy</a>
				{{ $t('plugins.WorkshopActivity.activity.android_ios_install_and_subscribe') }}
			</div>

			<!-- Destination -->
			<section class="act-section" style="--act-sec:#1E88E5">
				<div class="act-section-title">
					<span class="act-badge"><v-icon size="small" color="white">mdi-server-network</v-icon></span>
					{{ $t('plugins.WorkshopActivity.activity.server') }} / {{ $t('plugins.WorkshopActivity.activity.topic_keep_private') }}
				</div>
				<v-row density="compact">
					<v-col cols="12" sm="5">
						<v-text-field v-model="destServer" :label="$t('plugins.WorkshopActivity.activity.server')" density="compact" variant="outlined" hide-details />
					</v-col>
					<v-col cols="12" sm="7">
						<v-text-field v-model="destTopic" :label="$t('plugins.WorkshopActivity.activity.topic_keep_private')" density="compact" variant="outlined" hide-details />
					</v-col>
				</v-row>
				<div class="act-actions mt-3">
					<v-btn size="small" color="primary" :disabled="!destinationChanged" @click="saveDestination">{{ $t('plugins.WorkshopActivity.activity.save_destination') }}</v-btn>
					<v-btn size="small" variant="outlined" :loading="testing" @click="test"><v-icon size="small" start>mdi-send-check-outline</v-icon>{{ $t('plugins.WorkshopActivity.activity.test') }}</v-btn>
					<v-btn size="small" variant="outlined" :color="topicArmed ? 'error' : undefined" @click="newTopic"
						:title="$t('plugins.WorkshopActivity.activity.new_topic_hint')"
					>{{ topicArmed ? $t('plugins.WorkshopActivity.activity.tap_again_to_change_topic') : $t('plugins.WorkshopActivity.activity.generate_new_topic') }}</v-btn>
				</div>
				<div class="text-body-small mt-2" v-if="notice.config.topic">
					<a target="_blank" rel="noopener"
						:href="notice.config.server.replace(/\/$/, '') + '/' + notice.config.topic"
					>{{ $t('plugins.WorkshopActivity.activity.open_subscribe', { url: notice.config.server.replace(/^https?:\/\//, '').replace(/\/$/, '') + '/' + notice.config.topic }) }}</a>
				</div>
				<div class="text-body-small mt-1" v-if="notice.last">
					{{ $t('plugins.WorkshopActivity.activity.last_sent', { time: notice.last.ts.replace('T', ' '), title: notice.last.title }) }}
					<span :class="notice.last.ok ? 'text-success' : 'text-error'">
						{{ notice.last.ok ? $t('plugins.WorkshopActivity.activity.sent') : $t('plugins.WorkshopActivity.activity.failed_error', { error: notice.last.error }) }}
					</span>
				</div>
				<error-notice :error="noticeError" class="mt-2" />
			</section>

			<!-- Quiet hours (2026-10-12, pending 21) -->
			<section class="act-section" style="--act-sec:#5E35B1">
				<div class="act-section-title">
					<span class="act-badge"><v-icon size="small" color="white">mdi-weather-night</v-icon></span>{{ $t('plugins.WorkshopActivity.activity.quiet_hours') }}
					<v-chip v-if="notice.in_schedule" size="x-small" variant="outlined" color="info" class="ml-2">{{ $t('plugins.WorkshopActivity.activity.quiet_now') }}</v-chip>
					<v-spacer />
					<v-switch
						:model-value="scheduleCfg.active" density="compact" hide-details
						:label="scheduleCfg.active ? $t('plugins.WorkshopActivity.activity.on_singular') : $t('plugins.WorkshopActivity.activity.off_singular')" :disabled="!notice.config.active"
						@update:model-value="v => saveSchedule({ active: v })"
					/>
				</div>
				<div class="act-grid">
					<v-menu v-model="hourSinceMenu" :close-on-content-click="false" transition="scale-transition" min-width="auto" :disabled="!notice.config.active">
						<template #activator="{ props: activator }">
							<v-text-field
								v-model="hourSince" :label="$t('plugins.WorkshopActivity.activity.from')" readonly density="compact" variant="outlined" hide-details color="primary"
								:disabled="!notice.config.active" v-bind="activator"
							>
								<template #prepend-inner>
									<v-icon size="small" color="primary">mdi-clock-outline</v-icon>
								</template>
							</v-text-field>
						</template>
						<v-time-picker v-model="hourSince" format="24hr" hide-header color="primary" @update:minute="hourSinceMenu = false" />
					</v-menu>
					<v-menu v-model="hourUntilMenu" :close-on-content-click="false" transition="scale-transition" min-width="auto" :disabled="!notice.config.active">
						<template #activator="{ props: activator }">
							<v-text-field
								v-model="hourUntil" :label="$t('plugins.WorkshopActivity.activity.to')" readonly density="compact" variant="outlined" hide-details color="primary"
								:disabled="!notice.config.active" v-bind="activator"
							>
								<template #prepend-inner>
									<v-icon size="small" color="primary">mdi-clock-outline</v-icon>
								</template>
							</v-text-field>
						</template>
						<v-time-picker v-model="hourUntil" format="24hr" hide-header color="primary" @update:minute="hourUntilMenu = false" />
					</v-menu>
					<v-select
						:model-value="scheduleCfg.mode" :items="MODES_SCHEDULE" :label="$t('plugins.WorkshopActivity.activity.during_those_hours')" item-title="text" item-value="value" density="compact" variant="outlined" hide-details
						:disabled="!notice.config.active"
						@update:model-value="v => saveSchedule({ mode: v })"
					/>
				</div>
				<div class="act-actions mt-3">
					<v-btn size="small" variant="outlined" :disabled="!scheduleChanged || !notice.config.active" @click="saveSchedule({})">{{ $t('plugins.WorkshopActivity.activity.save_hours') }}</v-btn>
				</div>
				<div class="text-body-small mt-2" style="color:var(--tp-faint)">
					{{ $t('plugins.WorkshopActivity.activity.events_are_still_saved_in_the') }}
				</div>
			</section>

			<!-- Events -->
			<section class="act-section" style="--act-sec:#FB8C00">
				<div class="act-section-title">
					<span class="act-badge"><v-icon size="small" color="white">mdi-bell-ring-outline</v-icon></span>
					{{ $t('plugins.WorkshopActivity.activity.which_events_to_notify_and_how') }}
				</div>
				<div class="text-body-small mb-3" style="color:var(--tp-faint)">
					{{ $t(hasCamera ? 'plugins.WorkshopActivity.activity.attachment_hint' : 'plugins.WorkshopActivity.activity.attachment_hint_no_camera', { s: notice.config.video_s }) }}
				</div>
				<div class="act-grid mb-3">
					<v-select
						v-if="cameras.length"
						:model-value="noticeCamera" :items="cameraItems(false)" :label="$t('plugins.WorkshopActivity.activity.notification_camera')" item-title="text" item-value="value" density="compact" variant="outlined" hide-details
						:disabled="!notice.config.active"
						@update:model-value="setCameraNotice"
					/>
					<v-select
						:model-value="notice.config.video_s" :items="SECONDS_VIDEO" :label="$t('plugins.WorkshopActivity.activity.video_length')" item-title="text" item-value="value" density="compact" variant="outlined" hide-details
						:disabled="!notice.config.active"
						@update:model-value="setVideo"
					/>
				</div>
				<div class="act-events">
				<div
					v-for="t in notice.catalog" :key="t.kind"
					class="act-notice" :class="{ 'act-notice-on': !!notice.config.kinds[t.kind] }"
					:style="{ '--ev': styleOf(t.kind).color }"
				>
					<div class="act-notice-head">
						<span class="act-ev-icon"><v-icon size="small" color="white">{{ styleOf(t.kind).icon }}</v-icon></span>
						<span class="act-notice-name">
							<span class="act-ev-label">{{ labelOf(t) }}</span>
							<span v-if="notice.config.kinds[t.kind] && option(t.kind)" class="act-tags">
								<span class="act-tag" :style="{ '--tag': PRIORITY_COLORS[option(t.kind).priority] || '#78909C' }">
									{{ priorityText(option(t.kind).priority) }}
								</span>
								<span v-if="option(t.kind).attachment !== 'none'" class="act-tag" style="--tag:#00897B">
									<v-icon size="x-small" color="white" class="mr-1">{{ option(t.kind).attachment === 'video' ? 'mdi-video-outline' : 'mdi-camera-outline' }}</v-icon>{{ attachmentText(option(t.kind).attachment) }}
								</span>
							</span>
						</span>
						<v-switch
							:model-value="!!notice.config.kinds[t.kind]" density="compact" hide-details class="flex-grow-0"
							:disabled="!notice.config.active"
							@update:model-value="v => setKind(t.kind, v)"
						/>
						<span v-if="resultKind[t.kind]" class="text-body-small" :class="resultKind[t.kind].ok ? 'text-success' : 'text-error'">{{ resultKind[t.kind].text }}</span>
						<v-btn
							size="x-small" variant="outlined" :loading="testingKind === t.kind" :disabled="!notice.config.active || !notice.config.topic || !!testingKind"
							:title="$t('plugins.WorkshopActivity.activity.test_type_help')" @click="testKind(t.kind)"
						>
							<v-icon size="x-small" start>mdi-send-check-outline</v-icon>{{ $t('plugins.WorkshopActivity.activity.test') }}
						</v-btn>
					</div>
					<div v-if="notice.config.kinds[t.kind] && option(t.kind)" class="act-grid act-notice-options">
						<v-select
							:model-value="option(t.kind).attachment" :items="ATTACHMENTS" :label="$t('plugins.WorkshopActivity.activity.attachment')" item-title="text" item-value="value" density="compact" variant="outlined" hide-details
							:disabled="!notice.config.active"
							@update:model-value="v => setOption(t.kind, 'A', v)"
						/>
						<v-select
							:model-value="option(t.kind).priority" :items="priorities(t)" :label="$t('plugins.WorkshopActivity.activity.priority')" item-title="text" item-value="value" density="compact" variant="outlined" hide-details
							:disabled="!notice.config.active"
							@update:model-value="v => setOption(t.kind, 'R', v)"
						/>
						<v-select
							v-if="cameras.length && option(t.kind).attachment !== 'none'"
							:model-value="option(t.kind).camera || ''" :items="cameraItems(true)" :label="$t('plugins.WorkshopActivity.activity.camera')" item-title="text" item-value="value" density="compact" variant="outlined" hide-details
							:disabled="!notice.config.active"
							@update:model-value="v => setOption(t.kind, 'K', v)"
						/>
						<v-checkbox
							:model-value="!!option(t.kind).schedule" :label="$t('plugins.WorkshopActivity.activity.hours')" density="compact" hide-details
							:disabled="!notice.config.active || !scheduleCfg.active"
							:title="$t('plugins.WorkshopActivity.activity.respects_quiet_hours')"
							@update:model-value="v => setOption(t.kind, 'H', v)"
						/>
					</div>
				</div>
				</div>
			</section>
		</v-card-text>
	</v-card>
</template>

<script setup>
// Activity > Alerts: the phone notifications (ntfy) of the workshop: destination, quiet hours, which events notify and how. The
// state comes from the data the service publishes (notifications) and every change is a call notifications.<op>. All of it is a
// technician's (the service refuses it to a lower role, so a viewer or an operator does not even see the section).
// A failed call says so in words (ErrorNotice); nothing is retried by itself.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { i18n } from './dwc-host.js'
import ErrorNotice from './ErrorNotice.vue' // vue/_shared
import { api } from './workshop-api.js'
import { pluginActive } from './workshop-ids.js'
import { noticeOf } from './activity-notice.js'
import { styles, STYLE_OTHER } from './event-styles.js'

// Colour of the priority tag; icon and colour of the event types the history has no style for
const PRIORITY_COLORS = { min: '#78909C', low: '#546E7A', default: '#1E88E5', high: '#FB8C00', urgent: '#D32F2F' }
const EXTRA_STYLES = {
	maintenance: { color: '#00ACC1', icon: 'mdi-wrench-clock' },
	box_black: { color: '#546E7A', icon: 'mdi-file-document-alert-outline' },
	health_disk: { color: '#F4511E', icon: 'mdi-harddisk-remove' },
	camera: { color: '#00897B', icon: 'mdi-camera-outline' },
	camera_load: { color: '#00897B', icon: 'mdi-camera-timer' },
	camera_deleted: { color: '#757575', icon: 'mdi-camera-off-outline' },
	base_deleted: { color: '#757575', icon: 'mdi-database-remove-outline' },
	base_backup: { color: '#3949AB', icon: 'mdi-database-export-outline' },
	meter_alarm: { color: '#8E24AA', icon: 'mdi-meter-electric-outline' }
}

// Options by type of alert (2026-10-12, pending 21). Values in English (API notifications.option).
const ATTACHMENTS = [
	{ value: 'none', text: i18n.t('plugins.WorkshopActivity.activity.none') },
	{ value: 'photo', text: i18n.t('plugins.WorkshopActivity.activity.photo') },
	{ value: 'video', text: i18n.t('plugins.WorkshopActivity.activity.short_video') }
]
const PRIORITIES = [
	{ value: 'min', text: i18n.t('plugins.WorkshopActivity.activity.minimum_no_sound') },
	{ value: 'low', text: i18n.t('plugins.WorkshopActivity.activity.low') },
	{ value: 'default', text: i18n.t('plugins.WorkshopActivity.activity.normal') },
	{ value: 'high', text: i18n.t('plugins.WorkshopActivity.activity.high') },
	{ value: 'urgent', text: i18n.t('plugins.WorkshopActivity.activity.urgent') }
]
const MODES_SCHEDULE = [
	{ value: 'mute', text: i18n.t('plugins.WorkshopActivity.activity.don_t_send') },
	{ value: 'soft', text: i18n.t('plugins.WorkshopActivity.activity.send_without_sound') }
]
const SECONDS_VIDEO = [2, 3, 4, 5, 6, 8, 10].map(n => ({ value: n, text: n + ' s' }))

const cameras = ref([]) // [{id, name}] of the camera relay (empty = no camera service)
const noticeCamera = ref('main') // camera of the photo / video of the notifications (default)
const destServer = ref('')
const destTopic = ref('')
const testing = ref(false)
const topicArmed = ref(false)
const noticeError = ref(null) // the last failed call (an Error, or a text of the page)
const hourSince = ref('22:00')
const hourUntil = ref('07:00')
const hourSinceMenu = ref(false)
const hourUntilMenu = ref(false)
const testingKind = ref('') // type whose test is being sent
const resultKind = ref({}) // type -> {ok, text} of its last test
let topicTimer = null

// the Camera plugin is optional: its page is named only when it is there
const hasCamera = computed(() => pluginActive('camera'))
// Published by the backend (notifier.py) as WorkshopService plugin data.
const notice = computed(() => noticeOf())
const destinationChanged = computed(() => !!notice.value && (destServer.value !== notice.value.config.server || destTopic.value !== notice.value.config.topic))
const scheduleCfg = computed(() => (notice.value && notice.value.config.schedule) || { active: false, since: '22:00', until: '07:00', mode: 'mute' })
const scheduleChanged = computed(() => hourSince.value !== scheduleCfg.value.since || hourUntil.value !== scheduleCfg.value.until)

watch(notice, (n, old) => {
	// Fill the fields on load (without overwriting what the user is typing when any update arrives).
	if (n && (!old || destServer.value === old.config.server)) destServer.value = n.config.server
	if (n && (!old || destTopic.value === old.config.topic)) destTopic.value = n.config.topic
	const h = n && n.config.schedule
	const hv = old && old.config.schedule
	if (h && (!hv || hourSince.value === hv.since)) hourSince.value = h.since
	if (h && (!hv || hourUntil.value === hv.until)) hourUntil.value = h.until
}, { immediate: true })

onMounted(() => {
	readCameras()
})
onBeforeUnmount(() => {
	clearTimeout(topicTimer)
})

function styleOf(kind) {
	return styles[kind] || EXTRA_STYLES[kind] || STYLE_OTHER
}
function priorityText(value) {
	const p = PRIORITIES.find(x => x.value === value)
	return p ? p.text : value
}
function attachmentText(value) {
	const a = ATTACHMENTS.find(x => x.value === value)
	return a ? a.text : value
}
function labelOf(t) {
	return t.label // already in the language of this DWC (notice)
}
async function newTopic() {
	if (!topicArmed.value) {
		topicArmed.value = true
		clearTimeout(topicTimer)
		topicTimer = setTimeout(() => { topicArmed.value = false }, 4000)
		return
	}
	topicArmed.value = false
	const data = await noticeCmd('new_topic')
	if (data && data.config) destTopic.value = data.config.topic
}
// API of WorkshopService: notifications.<op> (answers the JSON of the settings)
async function noticeCmd(op, args) {
	noticeError.value = null
	try {
		const data = await api('notifications.' + op, args || {})
		if (data.error) noticeError.value = data.error
		return data
	} catch (e) {
		noticeError.value = e
		return null
	}
}
function setActive(v) {
	return noticeCmd('active', { on: !!v })
}
function setKind(kind, v) {
	return noticeCmd('type', { type: kind, on: !!v })
}
function option(kind) {
	return (notice.value && notice.value.config.options && notice.value.config.options[kind]) || null
}
function priorities(t) {
	// the factory one of each type marked, to be able to go back to it
	return PRIORITIES.map(p => (p.value === t.priority ? { value: p.value, text: p.text + i18n.t('plugins.WorkshopActivity.activity.default') } : p))
}
// cameras known by the relay and the one the notifications use by default
async function readCameras() {
	try {
		const r = await api('camera.status')
		cameras.value = Array.isArray(r.cameras) ? r.cameras : []
		noticeCamera.value = (r.service && r.service.notice_camera) || 'main'
	} catch (e) {
		cameras.value = []
	}
}
function cameraItems(withDefault) {
	const items = cameras.value.map(c => ({ value: c.id, text: c.name || c.id }))
	if (!withDefault) return items
	const by = cameras.value.find(c => c.id === noticeCamera.value)
	return [{ value: '', text: by ? i18n.t('plugins.WorkshopActivity.activity.default_camera_named', { name: by.name || by.id }) : i18n.t('plugins.WorkshopActivity.activity.default_camera') }].concat(items)
}
async function setCameraNotice(id) {
	// camera relay service settings (API camera.service with the changes)
	try {
		await api('camera.service', { changes: { notice_camera: id } })
	} catch (e) {
		noticeError.value = e
	}
	readCameras()
}
function setOption(kind, letter, v) {
	// letter of the old command -> argument of notifications.option
	const name = { A: 'attachment', R: 'priority', H: 'quiet_hours', K: 'camera' }[letter] || letter
	const value = letter === 'H' ? !!v : letter === 'K' ? (v || 'auto') : v
	return noticeCmd('option', { type: kind, [name]: value })
}
function setVideo(seconds) {
	return noticeCmd('video', { seconds: Number(seconds) })
}
function saveSchedule(changes) {
	const h = Object.assign({}, scheduleCfg.value, { since: hourSince.value, until: hourUntil.value }, changes)
	if (!/^\d{2}:\d{2}$/.test(h.since) || !/^\d{2}:\d{2}$/.test(h.until)) {
		noticeError.value = i18n.t('plugins.WorkshopActivity.activity.the_time_must_be_hh_mm')
		return null
	}
	return noticeCmd('quiet_hours', { on: !!h.active, from: h.since, to: h.until, mode: h.mode })
}
function saveDestination() {
	const s = destServer.value.replace(/"/g, '').trim()
	const t = destTopic.value.replace(/"/g, '').trim()
	return noticeCmd('destination', { server: s, topic: t })
}
async function test() {
	testing.value = true
	const data = await noticeCmd('test')
	if (data && data.test && !data.test.ok) noticeError.value = i18n.t('plugins.WorkshopActivity.activity.test_failed', { error: data.test.error })
	testing.value = false
}
// ---- test of one notification type: what a real event of that type would send
async function testKind(kind) {
	testingKind.value = kind
	const data = await noticeCmd('test', { type: kind })
	const pr = data && data.test
	let text
	if (pr && pr.ok) text = i18n.t('plugins.WorkshopActivity.activity.' + (pr.video ? 'test_sent_video' : pr.with_photo ? 'test_sent_photo' : 'test_sent'))
	else text = i18n.t('plugins.WorkshopActivity.activity.test_failed', { error: (pr && pr.error) || (noticeError.value && noticeError.value.message) || noticeError.value || '?' })
	resultKind.value[kind] = { ok: !!(pr && pr.ok), text: text }
	testingKind.value = ''
	setTimeout(() => { delete resultKind.value[kind] }, 12000)
}
</script>

<style scoped>
.act-section {
	border: 1px solid rgba(128, 128, 128, 0.25);
	border-left: 4px solid var(--act-sec, #1E88E5);
	border-radius: 10px;
	padding: 18px 20px 20px;
	margin-bottom: 20px;
	background: rgba(128, 128, 128, 0.04);
}
.act-section-title {
	display: flex;
	align-items: center;
	gap: 10px;
	font-size: 15px;
	font-weight: 600;
	margin-bottom: 18px;
}
.act-badge {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 30px;
	height: 30px;
	border-radius: 8px;
	background: var(--act-sec, #1E88E5);
}
.act-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
}
.act-grid {
	min-width: 0;
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(min(200px, 100%), 1fr));
	gap: 16px;
	align-items: center;
}
.act-events {
	min-width: 0;
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(min(380px, 100%), 1fr));
	gap: 14px;
	align-items: start; /* a card that is off keeps its own height instead of stretching to the tallest one of its row */
}
.act-notice {
	min-width: 0;
	padding: 14px 16px;
	border: 1px solid rgba(128, 128, 128, 0.2);
	border-left: 4px solid rgba(128, 128, 128, 0.35);
	border-radius: 8px;
	opacity: 0.75;
}
.act-notice-on {
	border-left-color: var(--ev, #9E9E9E);
	background: rgba(128, 128, 128, 0.07);
	opacity: 1;
}
.act-notice-head {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px 12px;
}
.act-ev-icon {
	flex: none;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 34px;
	height: 34px;
	border-radius: 50%;
	background: var(--ev, #9E9E9E);
}
.act-notice-name {
	flex: 1 1 120px;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 6px;
}
.act-ev-label {
	font-weight: 500;
	line-height: 1.25;
}
.act-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}
.act-tag {
	display: inline-flex;
	align-items: center;
	padding: 1px 10px;
	border-radius: 10px;
	font-size: 11px;
	font-weight: 600;
	color: #fff;
	background: var(--tag, #78909C);
}
.act-notice-options {
	margin-top: 16px;
	padding-top: 16px;
	border-top: 1px dashed rgba(128, 128, 128, 0.3);
}
@media (max-width: 480px) {
	.act-section {
		padding: 14px 12px 16px;
	}
	.act-notice {
		padding: 12px;
	}
}
</style>
