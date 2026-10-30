<template>
	<v-card class="mb-3">
		<v-card-title>
			{{ $t('plugins.WorkshopActivity.activity.phone_notifications') }}
			<v-spacer />
			<v-switch
				v-if="notice" :input-value="notice.config.active" dense hide-details class="mt-0"
				:label="notice.config.active ? $t('plugins.WorkshopActivity.activity.on_plural') : $t('plugins.WorkshopActivity.activity.off_plural')"
				@change="setActive"
			/>
		</v-card-title>
		<v-card-text v-if="!notice" class="grey--text">
			{{ $t('plugins.WorkshopActivity.activity.waiting_for_backend') }}
		</v-card-text>
		<v-card-text v-else>
			<div class="text-body-2 mb-4" style="color:var(--tp-faint)">
				{{ $t('plugins.WorkshopActivity.activity.every_event_in_this_list_is') }}
				<a href="https://ntfy.sh" target="_blank" rel="noopener">ntfy</a>
				{{ $t('plugins.WorkshopActivity.activity.android_ios_install_and_subscribe') }}
			</div>

			<!-- Destination -->
			<section class="act-section" style="--act-sec:#1E88E5">
				<div class="act-section-title">
					<span class="act-badge"><v-icon small color="white">mdi-server-network</v-icon></span>
					{{ $t('plugins.WorkshopActivity.activity.server') }} / {{ $t('plugins.WorkshopActivity.activity.topic_keep_private') }}
				</div>
				<v-row dense>
					<v-col cols="12" sm="5">
						<v-text-field v-model="destServer" :label="$t('plugins.WorkshopActivity.activity.server')" dense outlined hide-details />
					</v-col>
					<v-col cols="12" sm="7">
						<v-text-field v-model="destTopic" :label="$t('plugins.WorkshopActivity.activity.topic_keep_private')" dense outlined hide-details />
					</v-col>
				</v-row>
				<div class="act-actions mt-3">
					<v-btn small color="primary" :disabled="!destinationChanged" @click="saveDestination">{{ $t('plugins.WorkshopActivity.activity.save_destination') }}</v-btn>
					<v-btn small outlined :loading="testing" @click="test"><v-icon small left>mdi-send-check-outline</v-icon>{{ $t('plugins.WorkshopActivity.activity.test') }}</v-btn>
					<v-btn small outlined :color="topicArmed ? 'error' : undefined" @click="newTopic"
						:title="$t('plugins.WorkshopActivity.activity.new_topic_hint')"
					>{{ topicArmed ? $t('plugins.WorkshopActivity.activity.tap_again_to_change_topic') : $t('plugins.WorkshopActivity.activity.generate_new_topic') }}</v-btn>
				</div>
				<div class="text-caption mt-2" v-if="notice.config.topic">
					<a target="_blank" rel="noopener"
						:href="notice.config.server.replace(/\/$/, '') + '/' + notice.config.topic"
					>{{ $t('plugins.WorkshopActivity.activity.open_subscribe', { url: notice.config.server.replace(/^https?:\/\//, '').replace(/\/$/, '') + '/' + notice.config.topic }) }}</a>
				</div>
				<div class="text-caption mt-1" v-if="notice.last">
					{{ $t('plugins.WorkshopActivity.activity.last_sent', { time: notice.last.ts.replace('T', ' '), title: notice.last.title }) }}
					<span :class="notice.last.ok ? 'success--text' : 'error--text'">
						{{ notice.last.ok ? $t('plugins.WorkshopActivity.activity.sent') : $t('plugins.WorkshopActivity.activity.failed_error', { error: notice.last.error }) }}
					</span>
				</div>
				<error-notice :error="noticeError" class="mt-2" />
			</section>

			<!-- Quiet hours (2026-10-12, pending 21) -->
			<section class="act-section" style="--act-sec:#5E35B1">
				<div class="act-section-title">
					<span class="act-badge"><v-icon small color="white">mdi-weather-night</v-icon></span>{{ $t('plugins.WorkshopActivity.activity.quiet_hours') }}
					<v-chip v-if="notice.in_schedule" x-small outlined color="info" class="ml-2">{{ $t('plugins.WorkshopActivity.activity.quiet_now') }}</v-chip>
					<v-spacer />
					<v-switch
						:input-value="scheduleCfg.active" dense hide-details class="mt-0 pt-0"
						:label="scheduleCfg.active ? $t('plugins.WorkshopActivity.activity.on_singular') : $t('plugins.WorkshopActivity.activity.off_singular')" :disabled="!notice.config.active"
						@change="v => saveSchedule({ active: v })"
					/>
				</div>
				<div class="act-grid">
					<v-menu v-model="hourSinceMenu" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto" :disabled="!notice.config.active">
						<template v-slot:activator="{ on, attrs }">
							<v-text-field
								v-model="hourSince" :label="$t('plugins.WorkshopActivity.activity.from')" readonly dense outlined hide-details color="primary"
								:disabled="!notice.config.active" v-bind="attrs" v-on="on"
							>
								<template v-slot:prepend-inner>
									<v-icon small color="primary">mdi-clock-outline</v-icon>
								</template>
							</v-text-field>
						</template>
						<v-time-picker v-model="hourSince" format="24hr" no-title color="primary" @click:minute="hourSinceMenu = false" />
					</v-menu>
					<v-menu v-model="hourUntilMenu" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto" :disabled="!notice.config.active">
						<template v-slot:activator="{ on, attrs }">
							<v-text-field
								v-model="hourUntil" :label="$t('plugins.WorkshopActivity.activity.to')" readonly dense outlined hide-details color="primary"
								:disabled="!notice.config.active" v-bind="attrs" v-on="on"
							>
								<template v-slot:prepend-inner>
									<v-icon small color="primary">mdi-clock-outline</v-icon>
								</template>
							</v-text-field>
						</template>
						<v-time-picker v-model="hourUntil" format="24hr" no-title color="primary" @click:minute="hourUntilMenu = false" />
					</v-menu>
					<v-select
						:value="scheduleCfg.mode" :items="MODES_SCHEDULE" :label="$t('plugins.WorkshopActivity.activity.during_those_hours')" dense outlined hide-details
						:disabled="!notice.config.active"
						@change="v => saveSchedule({ mode: v })"
					/>
				</div>
				<div class="act-actions mt-3">
					<v-btn small outlined :disabled="!scheduleChanged || !notice.config.active" @click="saveSchedule({})">{{ $t('plugins.WorkshopActivity.activity.save_hours') }}</v-btn>
				</div>
				<div class="text-caption mt-2" style="color:var(--tp-faint)">
					{{ $t('plugins.WorkshopActivity.activity.events_are_still_saved_in_the') }}
				</div>
			</section>

			<!-- Events -->
			<section class="act-section" style="--act-sec:#FB8C00">
				<div class="act-section-title">
					<span class="act-badge"><v-icon small color="white">mdi-bell-ring-outline</v-icon></span>
					{{ $t('plugins.WorkshopActivity.activity.which_events_to_notify_and_how') }}
				</div>
				<div class="text-caption mb-3" style="color:var(--tp-faint)">
					{{ $t(hasCamera ? 'plugins.WorkshopActivity.activity.attachment_hint' : 'plugins.WorkshopActivity.activity.attachment_hint_no_camera', { s: notice.config.video_s }) }}
				</div>
				<div class="act-grid mb-3">
					<v-select
						v-if="cameras.length"
						:value="noticeCamera" :items="cameraItems(false)" :label="$t('plugins.WorkshopActivity.activity.notification_camera')" dense outlined hide-details
						:disabled="!notice.config.active"
						@change="setCameraNotice"
					/>
					<v-select
						:value="notice.config.video_s" :items="SECONDS_VIDEO" :label="$t('plugins.WorkshopActivity.activity.video_length')" dense outlined hide-details
						:disabled="!notice.config.active"
						@change="setVideo"
					/>
				</div>
				<div class="act-events">
				<div
					v-for="t in notice.catalog" :key="t.kind"
					class="act-notice" :class="{ 'act-notice-on': !!notice.config.kinds[t.kind] }"
					:style="{ '--ev': styleOf(t.kind).color }"
				>
					<div class="act-notice-head">
						<span class="act-ev-icon"><v-icon small color="white">{{ styleOf(t.kind).icon }}</v-icon></span>
						<span class="act-notice-name">
							<span class="act-ev-label">{{ labelOf(t) }}</span>
							<span v-if="notice.config.kinds[t.kind] && option(t.kind)" class="act-tags">
								<span class="act-tag" :style="{ '--tag': PRIORITY_COLORS[option(t.kind).priority] || '#78909C' }">
									{{ priorityText(option(t.kind).priority) }}
								</span>
								<span v-if="option(t.kind).attachment !== 'none'" class="act-tag" style="--tag:#00897B">
									<v-icon x-small color="white" class="mr-1">{{ option(t.kind).attachment === 'video' ? 'mdi-video-outline' : 'mdi-camera-outline' }}</v-icon>{{ attachmentText(option(t.kind).attachment) }}
								</span>
							</span>
						</span>
						<v-switch
							:input-value="!!notice.config.kinds[t.kind]" dense hide-details class="mt-0 pt-0 flex-grow-0"
							:disabled="!notice.config.active"
							@change="v => setKind(t.kind, v)"
						/>
						<span v-if="resultKind[t.kind]" class="text-caption" :class="resultKind[t.kind].ok ? 'success--text' : 'error--text'">{{ resultKind[t.kind].text }}</span>
						<v-btn
							x-small outlined :loading="testingKind === t.kind" :disabled="!notice.config.active || !notice.config.topic || !!testingKind"
							:title="$t('plugins.WorkshopActivity.activity.test_type_help')" @click="testKind(t.kind)"
						>
							<v-icon x-small left>mdi-send-check-outline</v-icon>{{ $t('plugins.WorkshopActivity.activity.test') }}
						</v-btn>
					</div>
					<div v-if="notice.config.kinds[t.kind] && option(t.kind)" class="act-grid act-notice-options">
						<v-select
							:value="option(t.kind).attachment" :items="ATTACHMENTS" :label="$t('plugins.WorkshopActivity.activity.attachment')" dense outlined hide-details
							:disabled="!notice.config.active"
							@change="v => setOption(t.kind, 'A', v)"
						/>
						<v-select
							:value="option(t.kind).priority" :items="priorities(t)" :label="$t('plugins.WorkshopActivity.activity.priority')" dense outlined hide-details
							:disabled="!notice.config.active"
							@change="v => setOption(t.kind, 'R', v)"
						/>
						<v-select
							v-if="cameras.length && option(t.kind).attachment !== 'none'"
							:value="option(t.kind).camera || ''" :items="cameraItems(true)" :label="$t('plugins.WorkshopActivity.activity.camera')" dense outlined hide-details
							:disabled="!notice.config.active"
							@change="v => setOption(t.kind, 'K', v)"
						/>
						<v-checkbox
							:input-value="option(t.kind).schedule" :label="$t('plugins.WorkshopActivity.activity.hours')" dense hide-details class="mt-0 pt-0"
							:disabled="!notice.config.active || !scheduleCfg.active"
							:title="$t('plugins.WorkshopActivity.activity.respects_quiet_hours')"
							@change="v => setOption(t.kind, 'H', v)"
						/>
					</div>
				</div>
				</div>
			</section>
		</v-card-text>
	</v-card>
</template>

<script>
import i18n from '../../i18n'
'use strict'

// Activity > Alerts: the phone notifications (ntfy) of the workshop: destination, quiet hours, which events notify and how. The
// state comes from the data the service publishes (notifications) and every change is a call notifications.<op>. All of it is a
// technician's (the service refuses it to a lower role, so a viewer or an operator does not even see the section).
// A failed call says so in words (ErrorNotice); nothing is retried by itself.

import ErrorNotice from './ErrorNotice.vue' // vue/_shared
import { api } from './workshop-api.js'
import { pluginActive } from './workshop-ids.js'
import { noticeOf } from './activity-notice.js'
import { styles, STYLE_OTHER } from './event-styles.js'

// Colour of the priority tag; icon and colour of the event types the history has no style for
const PRIORITY_COLORS = { min: '#78909C', low: '#546E7A', default: '#1E88E5', high: '#FB8C00', urgent: '#D32F2F' };
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
};

// Options by type of alert (2026-10-12, pending 21). Values in English (API notifications.option).
const attachments = [
	{ value: 'none', text: i18n.t('plugins.WorkshopActivity.activity.none') },
	{ value: 'photo', text: i18n.t('plugins.WorkshopActivity.activity.photo') },
	{ value: 'video', text: i18n.t('plugins.WorkshopActivity.activity.short_video') }
];
const priorities = [
	{ value: 'min', text: i18n.t('plugins.WorkshopActivity.activity.minimum_no_sound') },
	{ value: 'low', text: i18n.t('plugins.WorkshopActivity.activity.low') },
	{ value: 'default', text: i18n.t('plugins.WorkshopActivity.activity.normal') },
	{ value: 'high', text: i18n.t('plugins.WorkshopActivity.activity.high') },
	{ value: 'urgent', text: i18n.t('plugins.WorkshopActivity.activity.urgent') }
];
const MODES_SCHEDULE = [
	{ value: 'mute', text: i18n.t('plugins.WorkshopActivity.activity.don_t_send') },
	{ value: 'soft', text: i18n.t('plugins.WorkshopActivity.activity.send_without_sound') }
];
const SECONDS_VIDEO = [2, 3, 4, 5, 6, 8, 10].map(n => ({ value: n, text: n + ' s' }));

export default {
	components: { ErrorNotice },
	data() {
		return {
			cameras: [], // [{id, name}] of the camera relay (empty = no camera service)
			noticeCamera: 'main', // camera of the photo / video of the notifications (default)
			destServer: '',
			destTopic: '',
			testing: false,
			topicArmed: false,
			noticeError: null, // the last failed call (an Error, or a text of the page)
			hourSince: '22:00',
			hourUntil: '07:00',
			hourSinceMenu: false,
			hourUntilMenu: false,
			testingKind: '', // type whose test is being sent
			resultKind: {}, // type -> {ok, text} of its last test
			PRIORITY_COLORS: PRIORITY_COLORS,
			ATTACHMENTS: attachments, MODES_SCHEDULE: MODES_SCHEDULE, SECONDS_VIDEO: SECONDS_VIDEO
		};
	},
	computed: {
		// the Camera plugin is optional: its page is named only when it is there
		hasCamera() {
			return pluginActive(this.$store, 'camera');
		},
		// Published by the backend (notifier.py) as WorkshopService plugin data.
		notice() {
			return noticeOf(this.$store);
		},
		destinationChanged() {
			return !!this.notice && (this.destServer !== this.notice.config.server || this.destTopic !== this.notice.config.topic);
		},
		scheduleCfg() {
			return (this.notice && this.notice.config.schedule) || { active: false, since: '22:00', until: '07:00', mode: 'mute' };
		},
		scheduleChanged() {
			return this.hourSince !== this.scheduleCfg.since || this.hourUntil !== this.scheduleCfg.until;
		}
	},
	watch: {
		notice: {
			immediate: true,
			handler(n, old) {
				// Fill the fields on load (without overwriting what the user
				// is typing when any update arrives).
				if (n && (!old || this.destServer === old.config.server)) this.destServer = n.config.server;
				if (n && (!old || this.destTopic === old.config.topic)) this.destTopic = n.config.topic;
				const h = n && n.config.schedule;
				const hv = old && old.config.schedule;
				if (h && (!hv || this.hourSince === hv.since)) this.hourSince = h.since;
				if (h && (!hv || this.hourUntil === hv.until)) this.hourUntil = h.until;
			}
		}
	},
	mounted() {
		this.readCameras();
	},
	beforeDestroy() {
		clearTimeout(this._topicTimer);
	},
	methods: {
		styleOf(kind) {
			return styles[kind] || EXTRA_STYLES[kind] || STYLE_OTHER;
		},
		priorityText(value) {
			const p = priorities.find(x => x.value === value);
			return p ? p.text : value;
		},
		attachmentText(value) {
			const a = attachments.find(x => x.value === value);
			return a ? a.text : value;
		},
		labelOf(t) {
			return t.label; // already in the language of this DWC (notice)
		},
		async newTopic() {
			if (!this.topicArmed) {
				this.topicArmed = true;
				clearTimeout(this._topicTimer);
				this._topicTimer = setTimeout(() => { this.topicArmed = false; }, 4000);
				return;
			}
			this.topicArmed = false;
			const data = await this.noticeCmd('new_topic');
			if (data && data.config) this.destTopic = data.config.topic;
		},
		// API of WorkshopService: notifications.<op> (answers the JSON of the settings)
		async noticeCmd(op, args) {
			this.noticeError = null;
			try {
				const data = await api('notifications.' + op, args || {});
				if (data.error) this.noticeError = data.error;
				return data;
			} catch (e) {
				this.noticeError = e;
				return null;
			}
		},
		setActive(v) {
			return this.noticeCmd('active', { on: !!v });
		},
		setKind(kind, v) {
			return this.noticeCmd('type', { type: kind, on: !!v });
		},
		option(kind) {
			return (this.notice && this.notice.config.options && this.notice.config.options[kind]) || null;
		},
		priorities(t) {
			// the factory one of each type marked, to be able to go back to it
			return priorities.map(p => (p.value === t.priority ? { value: p.value, text: p.text + i18n.t('plugins.WorkshopActivity.activity.default') } : p));
		},
		// cameras known by the relay and the one the notifications use by default
		async readCameras() {
			try {
				const r = await api('camera.status');
				this.cameras = Array.isArray(r.cameras) ? r.cameras : [];
				this.noticeCamera = (r.service && r.service.notice_camera) || 'main';
			} catch (e) {
				this.cameras = [];
			}
		},
		cameraItems(withDefault) {
			const items = this.cameras.map(c => ({ value: c.id, text: c.name || c.id }));
			if (!withDefault) return items;
			const by = this.cameras.find(c => c.id === this.noticeCamera);
			return [{ value: '', text: by ? i18n.t('plugins.WorkshopActivity.activity.default_camera_named', { name: by.name || by.id }) : i18n.t('plugins.WorkshopActivity.activity.default_camera') }].concat(items);
		},
		async setCameraNotice(id) {
			// camera relay service settings (API camera.service with the changes)
			try {
				await api('camera.service', { changes: { notice_camera: id } });
			} catch (e) {
				this.noticeError = e;
			}
			this.readCameras();
		},
		setOption(kind, letter, v) {
			// letter of the old command -> argument of notifications.option
			const name = { A: 'attachment', R: 'priority', H: 'quiet_hours', K: 'camera' }[letter] || letter;
			const value = letter === 'H' ? !!v : letter === 'K' ? (v || 'auto') : v;
			return this.noticeCmd('option', { type: kind, [name]: value });
		},
		setVideo(seconds) {
			return this.noticeCmd('video', { seconds: Number(seconds) });
		},
		saveSchedule(changes) {
			const h = Object.assign({}, this.scheduleCfg, { since: this.hourSince, until: this.hourUntil }, changes);
			if (!/^\d{2}:\d{2}$/.test(h.since) || !/^\d{2}:\d{2}$/.test(h.until)) {
				this.noticeError = i18n.t('plugins.WorkshopActivity.activity.the_time_must_be_hh_mm');
				return null;
			}
			return this.noticeCmd('quiet_hours', { on: !!h.active, from: h.since, to: h.until, mode: h.mode });
		},
		saveDestination() {
			const s = this.destServer.replace(/"/g, '').trim();
			const t = this.destTopic.replace(/"/g, '').trim();
			return this.noticeCmd('destination', { server: s, topic: t });
		},
		async test() {
			this.testing = true;
			const data = await this.noticeCmd('test');
			if (data && data.test && !data.test.ok) this.noticeError = i18n.t('plugins.WorkshopActivity.activity.test_failed', { error: data.test.error });
			this.testing = false;
		},
		// ---- test of one notification type: what a real event of that type would send
		async testKind(kind) {
			this.testingKind = kind;
			const data = await this.noticeCmd('test', { type: kind });
			const pr = data && data.test;
			let text;
			if (pr && pr.ok) text = i18n.t('plugins.WorkshopActivity.activity.' + (pr.video ? 'test_sent_video' : pr.with_photo ? 'test_sent_photo' : 'test_sent'));
			else text = i18n.t('plugins.WorkshopActivity.activity.test_failed', { error: (pr && pr.error) || (this.noticeError && this.noticeError.message) || this.noticeError || '?' });
			this.$set(this.resultKind, kind, { ok: !!(pr && pr.ok), text: text });
			this.testingKind = '';
			setTimeout(() => this.$delete(this.resultKind, kind), 12000);
		}
	}
};
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
