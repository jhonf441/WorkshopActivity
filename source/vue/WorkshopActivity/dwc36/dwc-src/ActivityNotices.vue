<template>
	<v-card class="mb-3">
		<v-card-title>
			{{ $t('plugins.WorkshopActivity.activity.notices_title') }}
			<v-spacer />
			<span v-if="notice" class="text-caption mr-3">{{ $t('plugins.WorkshopActivity.activity.phone_label') }}</span>
			<v-switch
				v-if="notice" :key="'alerts-switch-' + switchKey" :input-value="notice.config.active" :disabled="!activeAllowed" dense hide-details class="mt-0"
				:label="notice.config.active ? $t('plugins.WorkshopActivity.activity.on_plural') : $t('plugins.WorkshopActivity.activity.off_plural')"
				@change="setActive"
			/>
		</v-card-title>
		<wf-result v-if="activate.state === 'sending' || activate.state === 'done'" class="mx-4 mb-2" :action="activate" />
		<lock-reason v-if="notice" :ops="activeOps" min="technician" class="mx-4 mb-2" :subject="$t('plugins.WorkshopActivity.subjects.phone_alerts')" />
		<!-- Turning the alerts on sends data to a third-party server: the owner confirms it once, here (the service refuses without it too) -->
		<wf-confirm
			:confirm="activate.confirm" :effects="[$t('plugins.WorkshopActivity.activity.outbound_photos'), $t('plugins.WorkshopActivity.activity.outbound_topic')]"
			:verb="$t('plugins.WorkshopActivity.activity.outbound_enable')" @accept="activate.accept()" @cancel="cancelOutbound"
		/>
		<v-card-text v-if="!notice" class="grey--text">
			{{ $t('plugins.WorkshopActivity.activity.waiting_for_backend') }}
		</v-card-text>
		<v-card-text v-else>
			<div class="wf-note is-info mb-3" role="note"><v-icon :size="16" class="wf-note-icon" aria-hidden="true">mdi-information-outline</v-icon><span>{{ $t('plugins.WorkshopActivity.activity.every_event_in_this_list_is') }}
				<a href="https://ntfy.sh" target="_blank" rel="noopener">ntfy</a>
				{{ $t('plugins.WorkshopActivity.activity.android_ios_install_and_subscribe') }}</span></div>
			<!-- one reason for every control that waits for the alerts to be on / for a topic (N3), not one under each -->
			<div v-if="usesPhone && (!notice.config.active || !notice.config.topic_set)" class="wf-note is-warn mb-3" role="note"><v-icon :size="16" class="wf-note-icon" aria-hidden="true">mdi-alert-outline</v-icon><span>{{ $t(notice.config.active ? 'plugins.WorkshopActivity.activity.topic_missing_reason' : 'plugins.WorkshopActivity.activity.alerts_off_reason') }}</span></div>

			<!-- Where to notify: the phone (ntfy, sent by the service), this device (a card of the notices center of this screen) or both -->
			<section class="act-section" style="--act-sec:#00897B">
				<div class="act-section-title">
					<span class="act-badge"><v-icon small color="white">mdi-bell-badge-outline</v-icon></span>
					{{ $t('plugins.WorkshopActivity.activity.notify_where_title') }}
				</div>
				<v-radio-group :value="channel" row hide-details class="act-channel mt-0 pt-0" :disabled="!channelAllowed" @change="setChannel">
					<v-radio value="phone" :disabled="!phoneReadyNow" :label="$t('plugins.WorkshopActivity.activity.notify_phone')" />
					<v-radio value="device" :label="$t('plugins.WorkshopActivity.activity.notify_device')" />
					<v-radio value="both" :disabled="!phoneReadyNow" :label="$t('plugins.WorkshopActivity.activity.notify_both')" />
				</v-radio-group>
				<div class="wf-note is-info mt-3" role="note"><v-icon :size="16" class="wf-note-icon" aria-hidden="true">mdi-information-outline</v-icon><span>{{ $t('plugins.WorkshopActivity.activity.notify_where_hint') }}</span></div>
				<div v-if="!phoneReadyNow" class="wf-note is-warn mt-2" role="note">
					<v-icon :size="16" class="wf-note-icon" aria-hidden="true">mdi-alert-outline</v-icon>
					<span>{{ $t('plugins.WorkshopActivity.activity.notify_phone_unavailable') }}
						<a href="#" @click.prevent="goPhoneSetup">{{ $t('plugins.WorkshopActivity.activity.notify_phone_setup_link') }}</a></span>
				</div>
				<!-- note 13 (2026-11-23): how a card looks, where it shows and how many wait is ONE choice of this screen for every notice (NoticeOptions.vue):
				     the way to it on the service page, or the options here when that page is not in this DWC -->
				<div v-if="usesDevice" class="mt-2">
					<p class="wf-help wf-help-line mb-2">{{ $t('plugins.WorkshopActivity.activity.notify_device_look') }}</p>
					<v-btn v-if="screenPage" small outlined :to="screenPage"><v-icon small left>mdi-monitor-cellphone</v-icon>{{ $t('plugins.WorkshopActivity.activity.notify_device_look_open') }}</v-btn>
					<notice-options v-else />
				</div>
				<div class="act-actions mt-3">
					<v-btn small outlined :loading="testing" :disabled="!phoneReadyNow || !testAllowed" @click="test"><v-icon small left>mdi-cellphone-message</v-icon>{{ $t('plugins.WorkshopActivity.activity.notify_test_phone') }}</v-btn>
					<v-btn small outlined @click="previewDevice"><v-icon small left>mdi-monitor-dashboard</v-icon>{{ $t('plugins.WorkshopActivity.activity.notify_test_device') }}</v-btn>
				</div>
				<lock-reason :ops="channelOps" min="technician" class="mt-2" :subject="$t('plugins.WorkshopActivity.subjects.notice_channel')" />
			</section>

			<!-- Destination -->
			<section ref="phoneSetup" class="act-section" style="--act-sec:#1E88E5">
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
					<v-btn small color="primary" :disabled="!destinationChanged || !destinationAllowed" @click="saveDestination">{{ $t('plugins.WorkshopActivity.activity.save_destination') }}</v-btn>
					<v-btn small outlined :loading="testing" :disabled="!testAllowed" @click="test"><v-icon small left>mdi-send-check-outline</v-icon>{{ $t('plugins.WorkshopActivity.activity.test') }}</v-btn>
					<wf-action-button
						:action="topicAction" :label="$t('plugins.WorkshopActivity.activity.generate_new_topic')" :arm-label="$t('plugins.WorkshopActivity.activity.tap_again_to_change_topic')" danger
						:disabled="!destinationAllowed" :title="$t('plugins.WorkshopActivity.activity.new_topic_hint')" @run="newTopic"
					/>
				</div>
				<div class="text-caption mt-2" v-if="notice.config.topic_set && savedTopic">
					<a target="_blank" rel="noopener"
						:href="notice.config.server.replace(/\/$/, '') + '/' + savedTopic"
					>{{ $t('plugins.WorkshopActivity.activity.open_subscribe', { url: notice.config.server.replace(/^https?:\/\//, '').replace(/\/$/, '') + '/' + savedTopic }) }}</a>
				</div>
				<div class="text-caption mt-1" v-if="notice.last">
					{{ $t('plugins.WorkshopActivity.activity.last_sent', { time: notice.last.ts.replace('T', ' '), title: notice.last.title }) }}
					<span :class="notice.last.ok ? 'success--text' : 'error--text'">
						{{ notice.last.ok ? $t('plugins.WorkshopActivity.activity.sent') : $t('plugins.WorkshopActivity.activity.failed_error', { error: notice.last.error }) }}
					</span>
				</div>
				<lock-reason :ops="destinationOps" min="technician" class="mt-2" :subject="$t('plugins.WorkshopActivity.subjects.alert_destination')" />
				<lock-reason :ops="testOps" min="operator" class="mt-2" :subject="$t('plugins.WorkshopActivity.subjects.test_alert')" />
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
						:label="scheduleCfg.active ? $t('plugins.WorkshopActivity.activity.on_singular') : $t('plugins.WorkshopActivity.activity.off_singular')" :disabled="hoursOff"
						@change="v => saveSchedule({ active: v })"
					/>
				</div>
				<div class="act-grid">
					<!-- a time written as HH:MM, the same field in every plugin (TimeField.vue, owner 2026-11-23): the Vuetify clock was the only way in -->
					<time-field v-model="hourSince" :label="$t('plugins.WorkshopActivity.activity.from')" :disabled="hoursOff" />
					<time-field v-model="hourUntil" :label="$t('plugins.WorkshopActivity.activity.to')" :disabled="hoursOff" />
					<v-select
						:value="scheduleCfg.mode" :items="MODES_SCHEDULE" :label="$t('plugins.WorkshopActivity.activity.during_those_hours')" dense outlined hide-details
						:disabled="hoursOff"
						@change="v => saveSchedule({ mode: v })"
					/>
				</div>
				<div class="act-actions mt-3">
					<v-btn small outlined :disabled="!scheduleChanged || hoursOff" @click="saveSchedule({})">{{ $t('plugins.WorkshopActivity.activity.save_hours') }}</v-btn>
				</div>
				<lock-reason :ops="hoursOps" min="technician" class="mt-2" :subject="$t('plugins.WorkshopActivity.subjects.quiet_hours')" />
				<div class="wf-note is-info mt-2" role="note"><v-icon :size="16" class="wf-note-icon" aria-hidden="true">mdi-information-outline</v-icon><span>{{ $t('plugins.WorkshopActivity.activity.events_are_still_saved_in_the') }}</span></div>
			</section>

			<!-- Events -->
			<section class="act-section" style="--act-sec:#FB8C00">
				<div class="act-section-title">
					<span class="act-badge"><v-icon small color="white">mdi-bell-ring-outline</v-icon></span>
					{{ $t('plugins.WorkshopActivity.activity.which_events_to_notify_and_how') }}
				</div>
				<div class="wf-note is-info mb-3" role="note"><v-icon :size="16" class="wf-note-icon" aria-hidden="true">mdi-information-outline</v-icon><span>{{ $t(hasCamera ? 'plugins.WorkshopActivity.activity.attachment_hint' : 'plugins.WorkshopActivity.activity.attachment_hint_no_camera', { s: notice.config.video_s }) }}</span></div>
				<div class="act-grid mb-3">
					<v-select
						v-if="cameras.length"
						:value="noticeCamera" :items="cameraItems(false)" :label="$t('plugins.WorkshopActivity.activity.notification_camera')" dense outlined hide-details
						:disabled="eventsOff"
						@change="setCameraNotice"
					/>
					<v-select
						:value="notice.config.video_s" :items="SECONDS_VIDEO" :label="$t('plugins.WorkshopActivity.activity.video_length')" dense outlined hide-details
						:disabled="eventsOff"
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
								<span class="act-tag" :style="tagStyle(PRIORITY_COLORS[option(t.kind).priority] || '#78909C')">
									{{ priorityText(option(t.kind).priority) }}
								</span>
								<span v-if="option(t.kind).attachment !== 'none'" class="act-tag" :style="tagStyle('#00897B')">
									<v-icon x-small class="mr-1">{{ option(t.kind).attachment === 'video' ? 'mdi-video-outline' : 'mdi-camera-outline' }}</v-icon>{{ attachmentText(option(t.kind).attachment) }}
								</span>
							</span>
						</span>
						<v-switch
							:input-value="!!notice.config.kinds[t.kind]" dense hide-details class="mt-0 pt-0 flex-grow-0"
							:disabled="eventsOff"
							@change="v => setKind(t.kind, v)"
						/>
						<span v-if="resultKind[t.kind]" class="text-caption" :class="resultKind[t.kind].ok ? 'success--text' : 'error--text'">{{ resultKind[t.kind].text }}</span>
						<v-btn
							small outlined :loading="testingKind === t.kind" :disabled="!notice.config.active || !testAllowed || !notice.config.topic_set || !!testingKind"
							:title="$t('plugins.WorkshopActivity.activity.test_type_help')" @click="testKind(t.kind)"
						>
							<v-icon small left>mdi-send-check-outline</v-icon>{{ $t('plugins.WorkshopActivity.activity.test') }}
						</v-btn>
					</div>
					<div v-if="notice.config.kinds[t.kind] && option(t.kind)" class="act-grid act-notice-options">
						<v-select
							:value="option(t.kind).attachment" :items="ATTACHMENTS" :label="$t('plugins.WorkshopActivity.activity.attachment')" dense outlined hide-details
							:disabled="eventsOff"
							@change="v => setOption(t.kind, 'A', v)"
						/>
						<v-select
							:value="option(t.kind).priority" :items="priorities(t)" :label="$t('plugins.WorkshopActivity.activity.priority')" dense outlined hide-details
							:disabled="eventsOff"
							@change="v => setOption(t.kind, 'R', v)"
						/>
						<v-select
							v-if="cameras.length && option(t.kind).attachment !== 'none'"
							:value="option(t.kind).camera || ''" :items="cameraItems(true)" :label="$t('plugins.WorkshopActivity.activity.camera')" dense outlined hide-details
							:disabled="eventsOff"
							@change="v => setOption(t.kind, 'K', v)"
						/>
						<v-checkbox
							:input-value="option(t.kind).schedule" :label="$t('plugins.WorkshopActivity.activity.hours')" dense hide-details class="mt-0 pt-0"
							:disabled="eventsOff || !scheduleCfg.active"
							:title="$t('plugins.WorkshopActivity.activity.respects_quiet_hours')"
							@change="v => setOption(t.kind, 'H', v)"
						/>
					</div>
				</div>
				</div>
				<lock-reason :ops="eventsOps" min="technician" class="mt-2" :subject="$t('plugins.WorkshopActivity.subjects.alert_events')" />
			</section>
			<help-fold class="mt-3" :items="[{ title: ht('where_title'), what: ht('where_what'), why: ht('where_why'), how: ht('where_how') }, { title: ht('notices_title'), what: ht('notices_what'), why: ht('notices_why'), how: ht('notices_how') }, { title: ht('server_title'), what: ht('server_what'), why: ht('server_why'), how: ht('server_how') }, { title: ht('new_topic_title'), what: ht('new_topic_what'), why: ht('new_topic_why'), ifMissing: ht('new_topic_missing'), how: ht('new_topic_how') }, { title: ht('quiet_title'), what: ht('quiet_what'), why: ht('quiet_why'), how: ht('quiet_how') }, { title: ht('quiet_mode_title'), what: ht('quiet_mode_what'), why: ht('quiet_mode_why') }, { title: ht('events_title'), what: ht('events_what'), why: ht('events_why'), how: ht('events_how') }, { title: ht('video_title'), what: ht('video_what'), why: ht('video_why') }, { title: ht('opt_attachment_title'), what: ht('opt_attachment_what'), why: ht('opt_attachment_why'), how: ht('opt_attachment_how') }]" />
		</v-card-text>
	</v-card>
</template>

<script>
import { readablePair } from './readable-text.js'
import i18n from '../../i18n'
'use strict'

// Activity > Alerts: the phone notifications (ntfy) of the workshop: destination, quiet hours, which events notify and how. The
// state comes from the data the service publishes (notifications) and every change is a call notifications.<op>. All of it is a
// technician's (the service refuses it to a lower role, so a viewer or an operator does not even see the section).
// A failed call says so in words (ErrorNotice); nothing is retried by itself.

import ErrorNotice from './ErrorNotice.vue' // vue/_shared
import { accessCanMixin } from './reason-mixin.js' // the answers of the service, by operation (vue/_shared36)
import LockReason from './LockReason.vue' // vue/_shared36
import { ACTIVE_OPS, DESTINATION_OPS, TEST_OPS, HOURS_OPS, CHANNEL_OPS, EVENTS_OPS, groupAllowed } from './access-groups.js'
import HelpFold from './HelpFold.vue' // vue/_shared36
import TimeField from './TimeField.vue' // vue/_shared36
import WfActionButton from './WfActionButton.vue' // vue/_shared36 (FASE2)
import WfConfirm from './WfConfirm.vue' // vue/_shared36 (FASE2)
import WfResult from './WfResult.vue' // vue/_shared36 (FASE2)
import { createAction } from './workshop-action.js' // vue/_shared36 (FASE2)
import { api } from './workshop-api.js'
import { pluginActive } from './workshop-ids.js'
import { noticeOf } from './activity-notice.js'
import { channelOf, deviceOn, phoneOn, phoneReady } from './device-notice.js'
import { previewDeviceNotice } from './notice-host.js'
import NoticeOptions from './NoticeOptions.vue' // vue/_shared36: the options of THIS screen for every notice
import { pathExists } from './workshop-ids.js' // vue/_shared36
import { styles, STYLE_OTHER } from './event-styles.js'

// Colour of the priority tag; icon and colour of the event types the history has no style for
const PRIORITY_COLORS = { min: '#78909C', low: '#546E7A', default: '#1E88E5', high: '#FB8C00', urgent: '#D32F2F' };
const EXTRA_STYLES = {
	camera_load: { color: '#00897B', icon: 'mdi-camera-timer' },
	camera_deleted: { color: '#757575', icon: 'mdi-camera-off-outline' },
	base_deleted: { color: '#757575', icon: 'mdi-database-remove-outline' },
	base_backup: { color: '#3949AB', icon: 'mdi-database-export-outline' }
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
	mixins: [accessCanMixin],
	// nothing of the destination, the last failure or the test results survives a change of person (ESTANDAR 3)
	sessionData: ['cameras', 'destServer', 'destTopic', 'hourSince', 'hourUntil', 'noticeError', 'resultKind', 'testing', 'testingKind'],
	sessionErrors: ['noticeError', 'resultKind'], // what a refusal or a failure said: cleared when the person signs in, out or changes role (role-mixin.js)
	components: { HelpFold, TimeField, ErrorNotice, LockReason, WfActionButton, WfConfirm, WfResult, NoticeOptions },
	data() {
		return {
			cameras: [], // [{id, name}] of the camera relay (empty = no camera service)
			destServer: '',
			destTopic: '',
			savedTopic: '', // the topic as the service has it: it is not in the published data any more (CB-4), a technician asks for it (notifications.get)
			testing: false,
			// turning the alerts on sends data to a third-party server: the action asks first (WfConfirm) and only then tells the service it was confirmed
			activate: createAction({
				run: async (args, ctx) => {
					const data = await this.noticeCmd('active', args.on && ctx.confirmed ? { on: true, acknowledge_outbound: true } : { on: !!args.on });
					if (!data || data.error) { this.switchKey += 1; throw this.noticeError || new Error('notifications.active'); } // the error notice tells it
					return { data };
				},
				confirm: args => (args.on ? { level: 3, title: i18n.t('plugins.WorkshopActivity.activity.outbound_title'), text: i18n.t('plugins.WorkshopActivity.activity.outbound_what', { server: (this.notice && this.notice.config && this.notice.config.server) || 'https://ntfy.sh' }) } : null)
			}),
			topicAction: createAction({ run: async () => ({ data: await this.noticeCmd('new_topic') }), arm: 'double' }),
			switchKey: 0, // re-creates the switch when the confirmation is cancelled, so it goes back to off
			noticeError: null, // the last failed call (an Error, or a text of the page)
			hourSince: '22:00',
			hourUntil: '07:00',
			testingKind: '', // type whose test is being sent
			resultKind: {}, // type -> {ok, text} of its last test
			activeOps: ACTIVE_OPS, destinationOps: DESTINATION_OPS, testOps: TEST_OPS, hoursOps: HOURS_OPS, channelOps: CHANNEL_OPS, eventsOps: EVENTS_OPS,
			PRIORITY_COLORS: PRIORITY_COLORS,
			ATTACHMENTS: attachments, MODES_SCHEDULE: MODES_SCHEDULE, SECONDS_VIDEO: SECONDS_VIDEO
		};
	},
	computed: {
		// the answer of the service for each group (the table of the role until it answers)
		activeAllowed() { return groupAllowed(ACTIVE_OPS, op => this.canDo(op)); },
		destinationAllowed() { return groupAllowed(DESTINATION_OPS, op => this.canDo(op)); },
		testAllowed() { return groupAllowed(TEST_OPS, op => this.canDo(op)); },
		hoursAllowed() { return groupAllowed(HOURS_OPS, op => this.canDo(op)); },
		channelAllowed() { return groupAllowed(CHANNEL_OPS, op => this.canDo(op)); },
		eventsAllowed() { return groupAllowed(EVENTS_OPS, op => this.canDo(op)); },
		// where the notices go: the phone (ntfy), this device (a card here) or both; the phone needs the alerts on and a destination
		channel() { return channelOf(this.notice); },
		usesPhone() { return phoneOn(this.channel); },
		usesDevice() { return deviceOn(this.channel); },
		phoneReadyNow() { return phoneReady(this.notice); },
		// something announces: the phone alerts are on, or this device is a destination (it needs no topic and no outbound confirmation)
		noticesOn() { return !!this.notice && (!!this.notice.config.active || this.usesDevice); },
		// the controls of a section stay off while nothing announces or the service says no
		hoursOff() { return !this.noticesOn || !this.hoursAllowed; },
		eventsOff() { return !this.noticesOn || !this.eventsAllowed; },
		// the Camera plugin is optional: its page is named only when it is there
		hasCamera() {
			return pluginActive(this.$store, 'camera');
		},
		// Published by the backend (notifier.py) as WorkshopService plugin data.
		notice() {
			return noticeOf(this.$store);
		},
		// the camera of the photo / video of every type that does not choose its own: the notifier's (config.default_camera of notifications.get)
		noticeCamera() {
			return (this.notice && this.notice.config.default_camera) || 'main';
		},
		destinationChanged() {
			return !!this.notice && (this.destServer !== this.notice.config.server || this.destTopic !== this.savedTopic);
		},
		scheduleCfg() {
			return (this.notice && this.notice.config.schedule) || { active: false, since: '22:00', until: '07:00', mode: 'mute' };
		},
		// the section "This screen" of the service page, where the notices of every plugin are set; '' when that page is not in this DWC
		screenPage() {
			return pathExists(this.$router, '/Plugins/WorkshopService') ? '/Plugins/WorkshopService?s=screen' : '';
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
				if (n && (!old || n.config.topic_set !== old.config.topic_set)) this.readTopic(); // the topic itself is not published: ask for it when it appears or goes
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
		this.activate.dispose();
		this.topicAction.dispose();
	},
	methods: {
		// the fields are the published state of the service (the watcher of `notice` fills them only when it changes): fill them again for the new person
		onSessionChange() {
			this.activate.reset(); // what was in the air belonged to the person who left
			this.topicAction.reset();
			const n = this.notice;
			if (n) {
				this.destServer = n.config.server;
				this.readTopic();
				if (n.config.schedule) {
					this.hourSince = n.config.schedule.since;
					this.hourUntil = n.config.schedule.until;
				}
			}
			this.readCameras();
		},
		ht(k) {
			return this.$t('plugins.WorkshopActivity.activity.help_' + k)
		},
		// the tag colour and the text on it, always readable (readable-text.js)
		tagStyle(bg) {
			const p = readablePair(bg)
			return { '--tag': p.background, color: p.color }
		},
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
			await this.topicAction.run({});
			const data = this.topicAction.data;
			if (this.topicAction.state === 'done' && data && data.config) this.useTopic(data.config.topic);
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
			return this.activate.run({ on: !!v }); // on: asks first (the confirmation), off: goes through
		},
		cancelOutbound() {
			this.activate.cancel();
			this.switchKey += 1;
		},
		setChannel(v) {
			if (v === this.channel) return null;
			return this.noticeCmd('option', { channel: v });
		},
		// the phone setup (server, topic) is the next section: the person who cannot choose Phone yet is taken there
		goPhoneSetup() {
			const el = this.$refs.phoneSetup;
			if (!el || typeof el.scrollIntoView !== 'function') return;
			const calm = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
			el.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
		},
		previewDevice() {
			previewDeviceNotice();
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
		// cameras of the list of the camera service (the one the notifications use by default is the notifier's: noticeCamera)
		async readCameras() {
			try {
				const r = await api('camera.status');
				this.cameras = Array.isArray(r.cameras) ? r.cameras : [];
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
			// the notifier's option, not a setting of the camera service
			await this.noticeCmd('option', { default_camera: id || 'auto' });
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
		async saveDestination() {
			const s = this.destServer.replace(/"/g, '').trim();
			const t = this.destTopic.replace(/"/g, '').trim();
			const data = await this.noticeCmd('destination', { server: s, topic: t });
			if (data && data.config) this.useTopic(data.config.topic);
			return data;
		},
		// the topic as the service has it (technician): the field follows it unless the person is typing another one
		useTopic(topic) {
			const was = this.savedTopic;
			this.savedTopic = topic || '';
			if (!this.destTopic || this.destTopic === was) this.destTopic = this.savedTopic;
		},
		async readTopic() {
			if (!this.destinationAllowed) return; // only a technician gets the topic; the others see "set" or "not set"
			const data = await this.noticeCmd('get');
			if (data && data.config) this.useTopic(data.config.topic);
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
.act-channel {
	gap: 4px 24px;
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
	font-size: 12px;
	font-weight: 600;
	color: #fff;
	background: var(--tag, #78909C);
}
.act-tag .v-icon {
	color: inherit !important; /* the icon takes the text colour chosen for the tag (readable-text.js), not the theme's white */
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
