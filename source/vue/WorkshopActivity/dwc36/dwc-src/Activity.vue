<template>
	<v-container :style="{ '--wf-sec': secColor }" fluid class="pa-0 workshop-theme">
		<service-notice />
		<!-- header: always visible, whatever section of the side bar is open -->
		<page-header :lead="$t('plugins.WorkshopActivity.activity.lead')" icon="mdi-history" :title="$t('plugins.WorkshopActivity.activity.header_title')" :reasons="headerReasons">
			<v-chip small outlined>{{ $t('plugins.WorkshopActivity.activity.events_n', { n: activityTotal }) }}</v-chip>
			<v-chip small outlined :color="notice && notice.config.active ? 'success' : 'grey'">
				<v-icon x-small left>{{ notice && notice.config.active ? 'mdi-bell-ring-outline' : 'mdi-bell-off-outline' }}</v-icon>
				{{ notice && notice.config.active ? $t('plugins.WorkshopActivity.activity.alerts_on') : $t('plugins.WorkshopActivity.activity.alerts_off') }}
			</v-chip>
			<template v-slot:right>
				<span v-if="lastEvent" class="text-caption grey--text">{{ $t('plugins.WorkshopActivity.activity.last_event_at', { time: lastEvent }) }}</span>
			</template>
			<template v-slot:startup><startup-panel plugin="WorkshopActivity" :defs="rowsStartup" /></template>
		</page-header>
		<div class="st-layout">
		<side-tabs v-model="section" :items="sections" />
		<div class="st-body">
		<div v-if="section === 'today'">
		<v-card class="mb-3">
			<v-card-title class="text-subtitle-1">
				<v-icon class="mr-2">mdi-calendar-today</v-icon>{{ $t('plugins.WorkshopActivity.activity.summary_title') }}
				<v-spacer />
				<v-btn-toggle v-model="summarySpan" mandatory dense color="primary" class="mr-2">
					<v-btn small value="today">{{ $t('plugins.WorkshopActivity.activity.summary_today') }}</v-btn>
					<v-btn small value="yesterday">{{ $t('plugins.WorkshopActivity.activity.summary_yesterday') }}</v-btn>
					<v-btn small value="week">{{ $t('plugins.WorkshopActivity.activity.summary_week') }}</v-btn>
				</v-btn-toggle>
				<v-btn small outlined :loading="summaryLoading" @click="loadSummary"><v-icon small left>mdi-refresh</v-icon>{{ $t('plugins.WorkshopActivity.activity.refresh_summary') }}</v-btn>
			</v-card-title>
			<v-card-text>
				<error-notice v-if="summaryError" :error="summaryError" retry @retry="loadSummary" />
				<div v-else-if="!summary" class="grey--text">{{ $t('plugins.WorkshopActivity.activity.summary_loading') }}</div>
				<template v-else>
					<v-row dense>
						<v-col v-for="t in cardsSummary" :key="t.k" cols="6" sm="3">
							<v-card outlined class="pa-3 fill-height">
								<div class="text-caption grey--text">{{ t.label }}</div>
								<div class="text-h5" :class="t.color">{{ t.value }}</div>
							</v-card>
						</v-col>
					</v-row>
					<div class="text-subtitle-2 mt-4 mb-1">{{ $t('plugins.WorkshopActivity.activity.summary_jobs') }}</div>
					<div v-if="!summary.jobs.length" class="text-caption grey--text">{{ $t('plugins.WorkshopActivity.activity.summary_no_jobs') }}</div>
					<v-simple-table v-else dense>
						<tbody>
							<tr v-for="j in summary.jobs" :key="j.id">
								<td class="text-no-wrap">{{ hourRow(j.ts) }}</td>
								<td>
									<v-icon x-small left :color="isCancelled(j) ? 'warning' : 'success'">{{ isCancelled(j) ? 'mdi-cancel' : 'mdi-check-circle' }}</v-icon>{{ nameJob(j) }}
								</td>
								<td>{{ j.mode }}</td>
								<td class="text-right text-no-wrap">{{ duration(j.duration_s) }}</td>
								<td class="text-right text-no-wrap">{{ j.consumption_kwh != null ? j.consumption_kwh.toFixed(3) + ' kWh' : '' }}</td>
							</tr>
						</tbody>
					</v-simple-table>
					<div class="text-subtitle-2 mt-4 mb-1">{{ $t('plugins.WorkshopActivity.activity.summary_failures') }}</div>
					<div v-if="!summary.faults.length" class="text-caption success--text"><v-icon x-small left color="success">mdi-check-circle</v-icon>{{ $t('plugins.WorkshopActivity.activity.summary_no_failures') }}</div>
					<div v-for="f in summary.faults" :key="f.id" class="d-flex align-start py-1" style="gap:8px">
						<span class="text-caption text-no-wrap grey--text">{{ hourRow(f.ts) }}</span>
						<v-icon small :color="f.kind === 'emergency' ? 'error' : 'warning'">{{ f.kind === 'emergency' ? 'mdi-alert-octagon' : 'mdi-alert-circle' }}</v-icon>
						<span class="text-body-2">{{ textEvent(f) }}</span>
					</div>
				</template>
			</v-card-text>
		</v-card>
		</div>
		<div v-if="section === 'history'">
		<v-card class="mb-3">
			<v-card-title><v-icon class="mr-2">mdi-history</v-icon>{{ $t('plugins.WorkshopActivity.activity.activity_history') }}</v-card-title>
			<v-card-text>
				<v-row dense>
					<v-col cols="12" sm="3">
						<v-menu v-model="actSinceMenu" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
							<template v-slot:activator="{ on, attrs }">
								<v-text-field
									v-model="actSince" :label="$t('plugins.WorkshopActivity.activity.from')" readonly dense hide-details color="primary"
									v-bind="attrs" v-on="on"
								>
									<template v-slot:prepend-inner>
										<v-icon color="primary">mdi-calendar-outline</v-icon>
									</template>
								</v-text-field>
							</template>
							<v-date-picker v-model="actSince" no-title color="primary" @input="actSinceMenu = false" />
						</v-menu>
					</v-col>
					<v-col cols="12" sm="3">
						<v-menu v-model="actUntilMenu" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
							<template v-slot:activator="{ on, attrs }">
								<v-text-field
									v-model="actUntil" :label="$t('plugins.WorkshopActivity.activity.to')" readonly dense hide-details color="primary"
									v-bind="attrs" v-on="on"
								>
									<template v-slot:prepend-inner>
										<v-icon color="primary">mdi-calendar-outline</v-icon>
									</template>
								</v-text-field>
							</template>
							<v-date-picker v-model="actUntil" no-title color="primary" @input="actUntilMenu = false" />
						</v-menu>
					</v-col>
					<v-col cols="12" sm="3">
						<v-select v-model="actKind" :items="[{ text: $t('plugins.WorkshopActivity.activity.all_paren'), value: kindAll }, ...activityKinds]" :label="$t('plugins.WorkshopActivity.activity.type')" dense hide-details />
					</v-col>
					<v-col cols="12" sm="3" class="d-flex align-center">
						<v-btn small color="primary" @click="searchActivity(0)" :loading="activityLoading">{{ $t('plugins.WorkshopActivity.activity.find') }}</v-btn>
						<v-checkbox
							v-model="hideService" dense hide-details class="ml-3 mt-0 pt-0"
							:label="$t('plugins.WorkshopActivity.activity.hide_service_restarts')" @change="searchActivity(0)"
						/>
					</v-col>
				</v-row>

				<!-- Quick filter by type: the types present in the range, with their color -->
				<div v-if="activityKinds.length" class="mt-3">
					<v-chip
						small class="mr-1 mb-1" outlined :class="{ 'wf-on': actKind === kindAll }"
						@click="filterKind(kindAll)"
					>{{ $t('plugins.WorkshopActivity.activity.all') }}</v-chip>
					<v-chip
						v-for="t in activityKinds" :key="t" small class="mr-1 mb-1"
						:style="{ '--wf-dotc': style(t).color, '--wf-dotd': 'inline-block' }" :class="{ 'wf-on': actKind === t }" outlined
						:title="kindLabel(t)" @click="filterKind(t)"
					>
						{{ style(t).short }}
					</v-chip>
				</div>

				<!-- what is filtering the list right now, so a selected filter is never hidden -->
				<div v-if="activeFilters.length" class="d-flex flex-wrap align-center mt-2" style="gap:6px">
					<span class="text-body-small font-weight-medium">{{ $t('plugins.WorkshopActivity.activity.filters_on') }}</span>
					<v-chip v-for="f in activeFilters" :key="f" small outlined class="wf-on">{{ f }}</v-chip>
					<v-btn x-small text color="primary" @click="clearFilters">{{ $t('plugins.WorkshopActivity.activity.clear_filters') }}</v-btn>
				</div>

				<div class="d-flex flex-wrap align-center mt-2" style="gap:8px 16px">
					<v-text-field
						v-model="actText" :label="$t('plugins.WorkshopActivity.activity.search')" prepend-inner-icon="mdi-magnify" clearable dense hide-details
						style="max-width:280px" @keyup.enter="searchActivity(0)" @click:clear="actText = ''; searchActivity(0)"
					/>
					<v-checkbox v-model="group" dense hide-details class="mt-0 pt-0" :label="$t('plugins.WorkshopActivity.activity.group_repeated')" />
					<v-checkbox v-if="me" v-model="onlyMine" dense hide-details class="mt-0 pt-0" :label="$t('plugins.WorkshopActivity.activity.only_mine')" :title="$t('plugins.WorkshopActivity.activity.only_mine_hint')" />
					<v-btn x-small outlined :loading="exporting" @click="exportCsv"><v-icon x-small left>mdi-download</v-icon>{{ $t('plugins.WorkshopActivity.activity.export_csv') }}</v-btn>
				</div>

				<error-notice v-if="historyError" :error="historyError" retry class="mt-2" @retry="searchActivity(actOffset)" />
				<v-simple-table v-if="rowsVisible.length > 0" dense class="mt-2 act-table">
					<thead>
						<tr>
							<th style="width:64px">{{ $t('plugins.WorkshopActivity.activity.time') }}</th>
							<th style="width:140px">{{ $t('plugins.WorkshopActivity.activity.type') }}</th>
							<th>{{ $t('plugins.WorkshopActivity.activity.description') }}</th>
							<th class="text-right" style="width:84px">{{ $t('plugins.WorkshopActivity.activity.duration') }}</th>
							<th class="text-right" style="width:64px">kWh</th>
							<th style="width:70px"></th>
						</tr>
					</thead>
					<tbody>
						<template v-for="it in rowsShow">
							<tr v-if="it.k === 'day'" :key="it.key" class="act-day">
								<td colspan="6">{{ it.text }}</td>
							</tr>
							<tr
								v-else-if="it.k === 'group'" :key="it.key" class="act-row act-click"
								@click="toggle(it.key)"
							>
								<td class="text-no-wrap">{{ it.since }}-{{ it.until }}</td>
								<td>
									<v-chip x-small label outlined :style="{ '--wf-dotc': styleEv(it.ev).color, '--wf-dotd': 'inline-block' }" :title="kindLabel(it.ev.kind)">
										{{ styleEv(it.ev).short }}
									</v-chip>
								</td>
								<td><v-chip x-small outlined class="mr-1">{{ $t('plugins.WorkshopActivity.activity.repeated', { n: it.n }) }}</v-chip>{{ textEvent(it.ev) }}</td>
								<td></td>
								<td></td>
								<td class="text-right"><v-icon small>{{ open[it.key] ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon></td>
							</tr>
							<tr
								v-else-if="it.k === 'ev'" :key="it.key" class="act-row act-click" :class="{ 'act-sub': it.sub }"
								@click="toggle('e' + it.ev.id)"
							>
								<td class="text-no-wrap" :title="it.ev.ts.replace('T', ' ')">{{ it.ev.ts.slice(11, 16) }}</td>
								<td>
									<v-chip x-small label outlined :style="{ '--wf-dotc': styleEv(it.ev).color, '--wf-dotd': 'inline-block' }" :title="kindLabel(it.ev.kind)">
										{{ styleEv(it.ev).short }}
									</v-chip>
								</td>
								<td>
									<v-chip v-if="it.ev.mode" x-small outlined class="mr-1" :color="colorMode(it.ev.mode)">{{ it.ev.mode }}</v-chip><v-chip v-if="it.ev.user" x-small outlined class="mr-1" :title="$t('plugins.WorkshopActivity.activity.done_by')"><v-icon left x-small>mdi-account-outline</v-icon>{{ it.ev.user }}</v-chip>
									{{ textEvent(it.ev) }}
								</td>
								<td class="text-right text-no-wrap">{{ duration(it.ev.duration_s) }}</td>
								<td class="text-right">{{ it.ev.consumption_kwh != null ? it.ev.consumption_kwh.toFixed(3) : '' }}</td>
								<td class="text-right" style="white-space:nowrap">
									<v-icon v-if="it.ev.detail" small class="mr-1" :title="$t('plugins.WorkshopActivity.activity.details')">{{ open['e' + it.ev.id] ? 'mdi-chevron-up' : 'mdi-information-outline' }}</v-icon>
									<v-btn
										v-if="it.ev.id != null && canDo('activity.delete')" x-small :text="armedId !== it.ev.id" :color="armedId === it.ev.id ? 'error' : 'grey'"
										:title="armedId === it.ev.id ? $t('plugins.WorkshopActivity.activity.tap_again_to_delete_this_event') : $t('plugins.WorkshopActivity.activity.delete_this_event')"
										@click.stop="deleteRow(it.ev)"
									>{{ armedId === it.ev.id ? $t('plugins.WorkshopActivity.activity.delete') : $t('plugins.WorkshopActivity.activity.delete_2') }}</v-btn>
								</td>
							</tr>
							<tr v-else :key="it.key" class="act-detail">
								<td colspan="6">
									<div v-if="!it.ev.detail" class="text-caption grey--text">{{ $t('plugins.WorkshopActivity.activity.no_details') }}</div>
									<div v-else class="d-flex flex-wrap" style="gap:4px 24px">
										<div v-for="g in detailGroups(it.ev)" :key="g.title" class="act-det-group">
											<div class="text-overline grey--text">{{ g.title }}</div>
											<div v-for="r in g.rows" :key="r.k" class="text-caption"><span class="grey--text">{{ r.k }}:</span> {{ r.v }}</div>
										</div>
									</div>
									<div class="text-caption grey--text mt-1">{{ it.ev.ts.replace('T', ' ') }}  #{{ it.ev.id }}<span v-if="it.ev.user"> - {{ $t('plugins.WorkshopActivity.activity.done_by') }}: {{ it.ev.user }}</span></div>
								</td>
							</tr>
						</template>
					</tbody>
				</v-simple-table>
				<div v-else-if="!historyError" class="text-caption grey--text mt-2">{{ $t('plugins.WorkshopActivity.activity.no_events_in_range_filter') }}</div>

				<div class="d-flex align-center mt-2" v-if="activityTotal > 0">
					<v-btn x-small text :disabled="actOffset === 0" @click="searchActivity(Math.max(0, actOffset - actLimit))">{{ $t('plugins.WorkshopActivity.activity.previous') }}</v-btn>
					<span class="text-caption grey--text mx-2">
						{{ $t('plugins.WorkshopActivity.activity.range_of_total', { from: actOffset + 1, to: Math.min(actOffset + actLimit, activityTotal), total: activityTotal }) }}
					</span>
					<v-btn x-small text :disabled="actOffset + actLimit >= activityTotal" @click="searchActivity(actOffset + actLimit)">{{ $t('plugins.WorkshopActivity.activity.next') }}</v-btn>
					<v-spacer />
					<v-btn
						v-if="canDo('activity.clear')" x-small :outlined="!cleanArmed" :color="cleanArmed ? 'error' : 'grey'"
						:title="$t('plugins.WorkshopActivity.activity.delete_filtered_hint')"
						@click="cleanFiltered"
					>{{ cleanArmed ? $t('plugins.WorkshopActivity.activity.tap_again_to_delete_n_events', { n: activityTotal }) : $t('plugins.WorkshopActivity.activity.delete_filtered_n', { n: activityTotal }) }}</v-btn>
				</div>
				<div v-if="deleteMsg" class="text-caption mt-1" :class="deleteErr ? 'error--text' : 'success--text'">{{ deleteMsg }}</div>

				<div class="text-caption grey--text mt-2">
					{{ $t('plugins.WorkshopActivity.activity.filters_by_date_and_type_directly') }}
				</div>
			</v-card-text>
		</v-card>

		</div>
		<activity-notices v-if="section === 'notices'" />
		<div v-if="section === 'live'">
		<v-card class="mb-3">
			<v-card-title>{{ $t('plugins.WorkshopActivity.activity.log_live_jobs') }}</v-card-title>
			<v-card-text>
				<div class="text-body-2">
					{{ $t('plugins.WorkshopActivity.activity.a_live_job_streamed_line_by') }} <b>GCode</b>{{ $t('plugins.WorkshopActivity.activity.each_job_goes_into_the_history') }}
				</div>
				<div class="text-caption mt-2">{{ $t('plugins.WorkshopActivity.activity.at_the_start_of_the') }} <b>Start GCode</b>:</div>
				<code class="d-block pa-2">M118 P0 S"BRIDGE JOB START Trabajo en vivo"</code>
				<div class="text-caption mt-2">{{ $t('plugins.WorkshopActivity.activity.at_the_end_of_the') }} <b>End GCode</b>:</div>
				<code class="d-block pa-2">M118 P0 S"BRIDGE JOB END"</code>
				<div class="text-caption grey--text mt-2">
					{{ $t('plugins.WorkshopActivity.activity.if_you_stop_a_job_by') }}
				</div>
			</v-card-text>
		</v-card>
		</div>
		</div>
		</div>
	</v-container>
</template>

<script>
import i18n from '../../i18n'
import { KIND_ALL, isCancelledEvent, kindFilter, eventText, readableKind } from './event-kinds.js' // decisions by event code (test/event-kinds.test.js)

'use strict'

import ServiceNotice from './ServiceNotice.vue'
import PageHeader from './PageHeader.vue' // header of every page (vue/_shared)
import StartupPanel from './StartupPanel.vue' // start-up card (vue/_shared)
import { rowsActivity } from './startup-rows.js'
import SideTabs from './SideTabs.vue'
import { colorMode } from './colors.js'
import { api } from './workshop-api.js'
import ErrorNotice from './ErrorNotice.vue' // vue/_shared
import ActivityNotices from './ActivityNotices.vue'
import { roleMixin } from './role-mixin.js' // what the role sees and may do (vue/_shared)
import { visibleItems } from './role-view.js'
import { currentIdentity } from './workshop-auth.js'
import { errorText } from './friendly-error.js'
import { ts } from './shared-t.js'
import { noticeOf } from './activity-notice.js'
import { styles, STYLE_OTHER, cancelled } from './event-styles.js'
import { sectionColor } from './section-colors.js' // the color of each section (--wf-sec)

export default {
	mixins: [roleMixin],
	components: { SideTabs, PageHeader, ServiceNotice: ServiceNotice, StartupPanel: StartupPanel, ErrorNotice, ActivityNotices },
	data() {
		const today = new Date();
		const hace7dias = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
		const asDate = d => d.toISOString().slice(0, 10);
		return {
			defaultSince: asDate(hace7dias), defaultUntil: asDate(today), // the dates the page opens with: a different range counts as a filter
			armedId: null, cleanArmed: false, deleteMsg: '', deleteErr: false,
			actSince: asDate(hace7dias),
			actUntil: asDate(today),
			actSinceMenu: false,
			actUntilMenu: false,
			kindAll: KIND_ALL,
			actKind: KIND_ALL,
			activityRows: [],
			activityTotal: 0,
			historyOk: null, // start-up card: did the history answer? (null = not asked yet)
			section: 'today', // the section chosen in the side bar (the card on top is the header and always shows)
			summarySpan: 'today', // 'hoy' | 'ayer' | 'semana'
			summary: null, // answer of activity.summary
			summaryLoading: false,
			summaryError: null,
			actOffset: 0,
			actLimit: 50,
			activityKinds: [],
			actText: '', // free text filter (description, type, detail)
			group: true, // collapse repeated events (same type and text, 3 or more in a row)
			open: {}, // expanded rows / groups
			exporting: false,
			activityLoading: false,
			// Service restarts (deploys, DCS relaunching it) are hidden
			// by default: they used to be 87 of 91 events and covered everything else.
			hideService: true,
			mineClient: false, // true when the service is old and does not know `mine`
			onlyMine: false, // only the events done by the person who is logged in (the service filters with `mine`; an old one is filtered here)
			historyError: null, // the last failure of the history (an Error): said in words, with a button to try again
		};
	},
	computed: {
		// the filters that are on now (the dates only when they are not the default last 7 days): shown above the list with a way to clear them
		activeFilters() {
			const t = (k, p) => i18n.t('plugins.WorkshopActivity.activity.' + k, p);
			const out = [];
			if (this.actKind !== KIND_ALL) out.push(t('filter_type', { t: this.kindLabel(this.actKind) }));
			if ((this.actText || '').trim()) out.push(t('filter_text', { t: this.actText.trim() }));
			if (this.onlyMine) out.push(t('filter_mine'));
			if (this.actSince !== this.defaultSince || this.actUntil !== this.defaultUntil) out.push(t('filter_range', { from: this.actSince, to: this.actUntil }));
			return out;
		},
		secColor() {
			return sectionColor(this.section)
		},
		sections() {
			const t = k => i18n.t('plugins.WorkshopActivity.activity.' + k);
			// F3-V (2026-10-21): everybody reads the summary and the history; the phone alerts and the live-job instructions are a technician's
			return visibleItems([
				{ id: 'today', icon: 'mdi-calendar-today', label: t('nav_today') },
				{ id: 'history', icon: 'mdi-history', label: t('nav_history') },
				{ id: 'notices', icon: 'mdi-bell-outline', label: t('nav_alerts'), min: 'technician' },
				{ id: 'live', icon: 'mdi-play-circle-outline', label: t('nav_live'), min: 'technician' }
			], op => this.canDo(op));
		},
		// the tiles of the summary
		cardsSummary() {
			const r = this.summary;
			if (!r) return [];
			const t = k => i18n.t('plugins.WorkshopActivity.activity.' + k);
			return [
				{ k: 'ini', label: t('tile_started'), value: r.started, color: '' },
				{ k: 'end', label: t('tile_finished'), value: r.finished, color: r.finished ? 'success--text' : '' },
				{ k: 'can', label: t('tile_cancelled'), value: r.cancelled, color: r.cancelled ? 'warning--text' : '' },
				{ k: 'tie', label: t('tile_time'), value: r.seconds ? this.duration(r.seconds) : '0', color: '' },
				{ k: 'ene', label: t('tile_energy'), value: r.kwh.toFixed(3) + ' kWh', color: '' },
				{ k: 'err', label: t('tile_errors'), value: r.errors, color: r.errors ? 'error--text' : '' },
				{ k: 'par', label: t('tile_stops'), value: r.emergencies, color: r.emergencies ? 'error--text' : '' },
				{ k: 'avi', label: t('tile_warnings'), value: r.notices, color: r.notices ? 'warning--text' : '' },
			];
		},
		// name of the person logged in ('' = nobody, or the machine has no users): the history can be narrowed to what they did
		me() {
			void this.identityTick;
			const id = currentIdentity();
			return (id && id.user && id.user.name) || '';
		},
		rowsVisible() {
			return this.onlyMine && this.me ? this.activityRows.filter(e => e.user === this.me) : this.activityRows;
		},
		// errors and emergency stops among the events of the chosen range
		// what the page header counts as attention (the service problem and the session are added by the header)
		headerReasons() {
			return this.faults ? [{ level: 'warn', text: this.$t('plugins.WorkshopActivity.activity.failures_n', { n: this.faults }) }] : [];
		},
		faults() {
			return this.activityRows.filter(e => e.kind === 'error' || e.kind === 'emergency').length;
		},
		lastEvent() {
			const e = this.activityRows[0];
			return e ? String(e.ts).replace('T', ' ').slice(0, 16) : '';
		},
		// display list: day separators, groups of repeated events, events and their detail rows
		rowsShow() {
			const out = [];
			const rows = this.rowsVisible;
			const norm = ev => ev.kind + '|' + String(ev.description).replace(/\d+/g, '#');
			let lastDay = null;
			let i = 0;
			while (i < rows.length) {
				const ev = rows[i];
				const d = this.day(ev.ts);
				if (d !== lastDay) {
					out.push({ k: 'day', key: 'd' + d, text: this.dayText(ev.ts) });
					lastDay = d;
				}
				let j = i + 1;
				if (this.group) while (j < rows.length && norm(rows[j]) === norm(ev) && this.day(rows[j].ts) === d) j++;
				const n = j - i;
				const miembros = rows.slice(i, j);
				if (n >= 3) {
					const key = 'g' + ev.id;
					out.push({ k: 'group', key, ev, n, since: miembros[n - 1].ts.slice(11, 16), until: ev.ts.slice(11, 16) });
					if (this.open[key]) {
						miembros.forEach(m => {
							out.push({ k: 'ev', key: 'e' + m.id, ev: m, sub: true });
							if (this.open['e' + m.id]) out.push({ k: 'det', key: 'x' + m.id, ev: m });
						});
					}
				} else {
					miembros.forEach(m => {
						out.push({ k: 'ev', key: 'e' + m.id, ev: m });
						if (this.open['e' + m.id]) out.push({ k: 'det', key: 'x' + m.id, ev: m });
					});
				}
				i = j;
			}
			return out;
		},
		// Published by the backend (notifier.py) as WorkshopService plugin data.
		notice() {
			return noticeOf(this.$store);
		},
		// start-up card: the history answers, and the phone alerts (optional) have a server and a topic
		rowsStartup() {
			const c = this.notice && this.notice.config;
			return rowsActivity({
				history: this.historyOk,
				events: this.activityTotal,
				notices: c ? { active: !!c.active, server: c.server, topic: c.topic } : null
			});
		},
		labels() {
			const out = {};
			(this.notice ? this.notice.catalog : []).forEach(t => { out[t.kind] = t.label; }); // already in the language of this DWC
			return out;
		}
	},
	watch: {
		summarySpan() {
			this.loadSummary();
		},
		onlyMine() {
			this.searchActivity(0);
		},
		section(v) {
			if (v === 'today') this.loadSummary();
		},
		// the role changed and the open section is no longer for it: back to the summary
		sections(list) {
			if (!list.some(x => x.id === this.section)) this.section = 'today';
		}
	},
	mounted() {
		this.loadSummary();
		this.searchActivity(0);
	},
	beforeDestroy() {
		clearTimeout(this._armTimer);
	},
	methods: {
		clearFilters() {
			this.actKind = KIND_ALL;
			this.actText = '';
			this.onlyMine = false;
			this.actSince = this.defaultSince;
			this.actUntil = this.defaultUntil;
			this.searchActivity(0);
		},
		// the history is stored in Spanish; the service adds description_en for DWC in English
		textEvent(ev) {
			return eventText(ev, this.$i18n.locale);
		},
		kindLabel(kind) {
			return this.labels[kind] || readableKind(kind);
		},
		style(kind) {
			const e = styles[kind];
			return e || Object.assign({}, STYLE_OTHER, { short: this.labels[kind] || readableKind(kind) });
		},
		styleEv(ev) {
			if (ev.kind === 'job_end' && isCancelledEvent(ev)) return cancelled;
			return this.style(ev.kind);
		},
		colorMode(mode) {
			// the mode's color in Lights, in screen version (DESIGN.md 2)
			return colorMode(this.$store, mode, this.$vuetify.theme.dark ? 'text' : 'bright');
		},
		duration(s) {
			if (s == null) return '';
			s = Math.round(s);
			if (s < 60) return s + ' s';
			const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
			return h ? `${h} h ${m} min` : `${m} min ${s % 60 ? (s % 60) + ' s' : ''}`.trim();
		},
		day(ts) {
			return (ts || '').slice(0, 10);
		},
		dayText(ts) {
			const d = this.day(ts);
			const today = new Date();
			const iso = x => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
			const ayer = new Date(today.getTime() - 86400000);
			const f = new Date(d + 'T12:00:00');
			const largo = i18n.t('plugins.WorkshopActivity.activity.weekday_date', { weekday: i18n.t('plugins.WorkshopActivity.activity.weekdays').split(',')[f.getDay()], day: f.getDate(), month: i18n.t('plugins.WorkshopActivity.activity.months_short').split(',')[f.getMonth()] });
			if (d === iso(today)) return i18n.t('plugins.WorkshopActivity.activity.today_date', { date: largo });
			if (d === iso(ayer)) return i18n.t('plugins.WorkshopActivity.activity.yesterday_date', { date: largo });
			return largo.charAt(0).toUpperCase() + largo.slice(1);
		},
		filterKind(t) {
			this.actKind = t;
			this.searchActivity(0);
		},
		// Delete (2026-10-09): double tap to confirm, no dialogs.
		arm(fn) {
			clearTimeout(this._armTimer);
			this._armTimer = setTimeout(() => { this.armedId = null; this.cleanArmed = false; }, 4000);
			fn();
		},
		async deleteRow(ev) {
			if (this.armedId !== ev.id) return this.arm(() => { this.armedId = ev.id; this.cleanArmed = false; });
			this.armedId = null;
			await this.executeDeleted('activity.delete', { id: Number(ev.id) });
		},
		async cleanFiltered() {
			if (!this.cleanArmed) return this.arm(() => { this.cleanArmed = true; this.armedId = null; });
			this.cleanArmed = false;
			await this.executeDeleted('activity.clear', this.queryFilter());
		},
		async executeDeleted(op, args) {
			this.deleteMsg = '';
			this.deleteErr = false;
			try {
				const data = await api(op, args);
				if (data.error) throw new Error(data.error);
				this.deleteMsg = i18n.t('plugins.WorkshopActivity.activity.deleted_n_events', { n: data.deleted });
			} catch (e) {
				this.deleteErr = true;
				this.deleteMsg = i18n.t('plugins.WorkshopActivity.activity.could_not_delete', { error: errorText(e, ts) });
			}
			const off = this.actOffset >= this.activityTotal - 1 ? Math.max(0, this.actOffset - this.actLimit) : this.actOffset;
			this.searchActivity(off);
		},
		toggle(key) {
			this.$set(this.open, key, !this.open[key]);
		},
		// label of a detail key (translated when it is a known one)
		labelDetail(k) {
			const key = 'plugins.WorkshopActivity.detail_keys.' + k;
			return this.$te(key) ? this.$t(key) : k;
		},
		detailGroups(ev) {
			const d = ev.detail || {};
			const fmt = v => (v !== null && typeof v === 'object' ? JSON.stringify(v) : String(v));
			const rows = o => Object.keys(o || {}).map(k => ({ k: this.labelDetail(k), v: fmt(o[k]) }));
			const out = [];
			if (d.data && Object.keys(d.data).length) out.push({ title: this.$t('plugins.WorkshopActivity.activity.event_data'), rows: rows(d.data) });
			if (d.context && Object.keys(d.context).length) out.push({ title: this.$t('plugins.WorkshopActivity.activity.machine_then'), rows: rows(d.context) });
			if (d.origin) out.push({ title: this.$t('plugins.WorkshopActivity.activity.origin'), rows: [{ k: this.$t('plugins.WorkshopActivity.activity.origin'), v: d.origin }] });
			return out;
		},
		// arguments of activity.list / activity.clear for the current filter
		queryFilter(withText = true, forList = false) {
			const a = { from: this.actSince, to: this.actUntil };
			const type = kindFilter(this.actKind);
			if (type) a.type = type;
			if (this.hideService) a.exclude = ['service'];
			if (forList && this.onlyMine && this.me && !this.mineClient) a.mine = true;
			if (withText && this.actText && this.actText.trim()) a.query = this.actText.trim();
			return a;
		},
		// downloads every event of the current filter (up to 5000) as CSV
		async exportCsv() {
			this.exporting = true;
			try {
				const filas = [];
				let total = Infinity;
				for (let off = 0; off < Math.min(total, 5000); off += 200) {
					const r = await this.listActivity({ limit: 200, offset: off });
					total = r.total || 0;
					filas.push(...(r.rows || []));
				}
				const esc = v => {
					const t = v === null || v === undefined ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v));
					return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
				};
				const lines = ['id,ts,type,mode,description,duration_s,energy_kwh,detail,user'].concat(
					filas.map(f => [f.id, f.ts, f.kind, f.mode, f.description, f.duration_s, f.consumption_kwh, f.detail, f.user].map(esc).join(','))
				);
				const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
				const a = document.createElement('a');
				a.href = URL.createObjectURL(blob);
				a.download = 'activity-' + this.actSince + '_' + this.actUntil + '.csv';
				document.body.appendChild(a);
				a.click();
				a.remove();
				setTimeout(() => URL.revokeObjectURL(a.href), 5000);
			} catch (e) {
				this.deleteErr = true;
				this.deleteMsg = errorText(e, ts);
			} finally {
				this.exporting = false;
			}
		},
		// ---- summary of the day (activity.summary)
		dateLocal(d) {
			const p = n => String(n).padStart(2, '0');
			return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
		},
		spanSummary() {
			const today = new Date();
			const day = 24 * 60 * 60 * 1000;
			if (this.summarySpan === 'yesterday') {
				const ayer = this.dateLocal(new Date(today.getTime() - day));
				return [ayer, ayer];
			}
			if (this.summarySpan === 'week') return [this.dateLocal(new Date(today.getTime() - 6 * day)), this.dateLocal(today)];
			const h = this.dateLocal(today);
			return [h, h];
		},
		async loadSummary() {
			this.summaryLoading = true;
			this.summaryError = null;
			const [since, until] = this.spanSummary();
			try {
				this.summary = await api('activity.summary', { from: since, to: until, exclude: ['service'] });
			} catch (e) {
				this.summaryError = e;
			} finally {
				this.summaryLoading = false;
			}
		},
		hourRow(ts) {
			const t = String(ts || '').replace('T', ' ');
			return this.summarySpan === 'today' ? t.slice(11, 16) : t.slice(5, 16);
		},
		isCancelled(ev) {
			return isCancelledEvent(ev);
		},
		nameJob(ev) {
			const text = this.textEvent(ev) || '';
			const i = text.indexOf(': ');
			return i >= 0 ? text.slice(i + 2) : text;
		},
		// activity.list with the filter; an old service refuses the argument `mine` (invalid_args): from then on this page filters
		async listActivity(paging) {
			try {
				return await api('activity.list', Object.assign(this.queryFilter(true, true), paging));
			} catch (e) {
				if (e && e.code === 'invalid_args' && this.onlyMine && !this.mineClient) {
					this.mineClient = true;
					return await api('activity.list', Object.assign(this.queryFilter(true, true), paging));
				}
				throw e;
			}
		},
		async searchActivity(offset) {
			this.activityLoading = true;
			this.actOffset = offset;
			try {
				const data = await this.listActivity({ limit: this.actLimit, offset });
				this.activityRows = data.rows || [];
				this.activityTotal = data.total || 0;
				this.activityKinds = data.kinds || [];
				this.historyOk = true;
				this.historyError = null;
			} catch (e) {
				this.historyOk = false;
				this.historyError = e; // said in words with a button to try again (never retried by itself)
				this.activityRows = [];
				this.activityTotal = 0;
			} finally {
				this.activityLoading = false;
			}
		}
	}
};
</script>

<style scoped>
.act-click { cursor: pointer; }
.act-sub td:first-child { padding-left: 24px !important; }
.act-detail td { background: rgba(255, 255, 255, 0.04); padding-top: 6px !important; padding-bottom: 6px !important; }
.act-det-group { min-width: 200px; }
.act-table .act-day td {
	font-size: 11px !important;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	opacity: 0.7;
	height: 28px !important;
	padding-top: 10px !important;
	background: rgba(128, 128, 128, 0.08);
}
.act-table .act-row td {
	vertical-align: middle;
}
</style>
