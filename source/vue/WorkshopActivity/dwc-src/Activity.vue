<template>
	<v-container :style="{ '--wf-sec': sectionColor(section) }" fluid class="pa-0 workshop-theme">
		<service-notice />
		<!-- header: always visible, whatever section of the side bar is open -->
		<page-header :lead="$t('plugins.WorkshopActivity.activity.lead')" icon="mdi-history" :title="$t('plugins.WorkshopActivity.activity.header_title')" :reasons="headerReasons">
			<v-chip size="small" variant="outlined">{{ $t('plugins.WorkshopActivity.activity.events_n', { n: activityTotal }) }}</v-chip>
			<v-chip size="small" variant="outlined" :color="notice && notice.config.active ? 'success' : undefined">
				<v-icon size="x-small" start>{{ notice && notice.config.active ? 'mdi-bell-ring-outline' : 'mdi-bell-off-outline' }}</v-icon>
				{{ notice && notice.config.active ? $t('plugins.WorkshopActivity.activity.alerts_on') : $t('plugins.WorkshopActivity.activity.alerts_off') }}
			</v-chip>
			<template #right>
				<span v-if="lastEvent" class="text-body-small text-medium-emphasis">{{ $t('plugins.WorkshopActivity.activity.last_event_at', { time: lastEvent }) }}</span>
			</template>
			<template #startup><startup-panel plugin="WorkshopActivity" :defs="rowsStartup" /></template>
		</page-header>
		<div class="st-layout">
		<side-tabs v-model="section" :items="sections" />
		<div class="st-body">
		<div v-if="section === 'today'">
		<v-card class="mb-3">
			<v-card-title class="text-title-medium">
				<v-icon class="mr-2">mdi-calendar-today</v-icon>{{ $t('plugins.WorkshopActivity.activity.summary_title') }}
				<v-spacer />
				<v-btn-toggle v-model="summarySpan" mandatory density="compact" color="primary" class="mr-2">
					<v-btn size="small" value="today">{{ $t('plugins.WorkshopActivity.activity.summary_today') }}</v-btn>
					<v-btn size="small" value="yesterday">{{ $t('plugins.WorkshopActivity.activity.summary_yesterday') }}</v-btn>
					<v-btn size="small" value="week">{{ $t('plugins.WorkshopActivity.activity.summary_week') }}</v-btn>
				</v-btn-toggle>
				<v-btn size="small" variant="outlined" :loading="summaryLoading" @click="loadSummary"><v-icon size="small" start>mdi-refresh</v-icon>{{ $t('plugins.WorkshopActivity.activity.refresh_summary') }}</v-btn>
			</v-card-title>
			<v-card-text>
				<error-notice v-if="summaryError" :error="summaryError" retry @retry="loadSummary" />
				<div v-else-if="!summary" class="text-medium-emphasis">{{ $t('plugins.WorkshopActivity.activity.summary_loading') }}</div>
				<template v-else>
					<v-row density="compact">
						<v-col v-for="t in cardsSummary" :key="t.k" cols="6" sm="3">
							<v-card variant="outlined" class="pa-3 fill-height">
								<div class="text-body-small text-medium-emphasis">{{ t.label }}</div>
								<div class="text-headline-small" :class="t.color">{{ t.value }}</div>
							</v-card>
						</v-col>
					</v-row>
					<div class="text-title-small mt-4 mb-1">{{ $t('plugins.WorkshopActivity.activity.summary_jobs') }}</div>
					<div v-if="!summary.jobs.length" class="text-body-small text-medium-emphasis">{{ $t('plugins.WorkshopActivity.activity.summary_no_jobs') }}</div>
					<v-table v-else density="compact">
						<tbody>
							<tr v-for="j in summary.jobs" :key="j.id">
								<td class="text-no-wrap">{{ hourRow(j.ts) }}</td>
								<td>
									<v-icon size="x-small" start :color="isCancelled(j) ? 'warning' : 'success'">{{ isCancelled(j) ? 'mdi-cancel' : 'mdi-check-circle' }}</v-icon>{{ nameJob(j) }}
								</td>
								<td>{{ j.mode }}</td>
								<td class="text-right text-no-wrap">{{ duration(j.duration_s) }}</td>
								<td class="text-right text-no-wrap">{{ j.consumption_kwh != null ? j.consumption_kwh.toFixed(3) + ' kWh' : '' }}</td>
							</tr>
						</tbody>
					</v-table>
					<div class="text-title-small mt-4 mb-1">{{ $t('plugins.WorkshopActivity.activity.summary_failures') }}</div>
					<div v-if="!summary.faults.length" class="text-body-small text-success"><v-icon size="x-small" start color="success">mdi-check-circle</v-icon>{{ $t('plugins.WorkshopActivity.activity.summary_no_failures') }}</div>
					<div v-for="f in summary.faults" :key="f.id" class="d-flex align-start py-1" style="gap:8px">
						<span class="text-body-small text-no-wrap text-medium-emphasis">{{ hourRow(f.ts) }}</span>
						<v-icon size="small" :color="f.kind === 'emergency' ? 'error' : 'warning'">{{ f.kind === 'emergency' ? 'mdi-alert-octagon' : 'mdi-alert-circle' }}</v-icon>
						<span class="text-body-medium">{{ textEvent(f) }}</span>
					</div>
				</template>
			</v-card-text>
		</v-card>
		</div>
		<div v-if="section === 'history'">
		<v-card class="mb-3">
			<v-card-title><v-icon class="mr-2">mdi-history</v-icon>{{ $t('plugins.WorkshopActivity.activity.activity_history') }}</v-card-title>
			<v-card-text>
				<v-row density="compact">
					<v-col cols="12" sm="3">
						<v-menu v-model="actSinceMenu" :close-on-content-click="false" transition="scale-transition" min-width="auto">
							<template #activator="{ props: activator }">
								<v-text-field
									v-model="actSince" :label="$t('plugins.WorkshopActivity.activity.from')" readonly density="compact" hide-details color="primary"
									v-bind="activator"
								>
									<template #prepend-inner>
										<v-icon color="primary">mdi-calendar-outline</v-icon>
									</template>
								</v-text-field>
							</template>
							<v-date-picker v-model="sinceDate" hide-header color="primary" @update:model-value="actSinceMenu = false" />
						</v-menu>
					</v-col>
					<v-col cols="12" sm="3">
						<v-menu v-model="actUntilMenu" :close-on-content-click="false" transition="scale-transition" min-width="auto">
							<template #activator="{ props: activator }">
								<v-text-field
									v-model="actUntil" :label="$t('plugins.WorkshopActivity.activity.to')" readonly density="compact" hide-details color="primary"
									v-bind="activator"
								>
									<template #prepend-inner>
										<v-icon color="primary">mdi-calendar-outline</v-icon>
									</template>
								</v-text-field>
							</template>
							<v-date-picker v-model="untilDate" hide-header color="primary" @update:model-value="actUntilMenu = false" />
						</v-menu>
					</v-col>
					<v-col cols="12" sm="3">
						<v-select v-model="actKind" :items="kindItems" item-title="text" item-value="value" :label="$t('plugins.WorkshopActivity.activity.type')" density="compact" hide-details />
					</v-col>
					<v-col cols="12" sm="3" class="d-flex align-center">
						<v-btn size="small" color="primary" :loading="activityLoading" @click="searchActivity(0)">{{ $t('plugins.WorkshopActivity.activity.find') }}</v-btn>
						<v-checkbox
							v-model="hideService" density="compact" hide-details class="ml-3"
							:label="$t('plugins.WorkshopActivity.activity.hide_service_restarts')" @update:model-value="searchActivity(0)"
						/>
					</v-col>
				</v-row>

				<!-- Quick filter by type: the types present in the range, with their color -->
				<div v-if="activityKinds.length" class="mt-3">
					<v-chip
						size="small" class="mr-1 mb-1" variant="outlined" :class="{ 'wf-on': actKind === kindAll }"
						@click="filterKind(kindAll)"
					>{{ $t('plugins.WorkshopActivity.activity.all') }}</v-chip>
					<v-chip
						v-for="t in activityKinds" :key="t" size="small" class="mr-1 mb-1"
						:style="{ '--wf-dotc': style(t).color, '--wf-dotd': 'inline-block' }" :class="{ 'wf-on': actKind === t }" variant="outlined"
						:title="kindLabel(t)" @click="filterKind(t)"
					>
						{{ style(t).short }}
					</v-chip>
				</div>

				<!-- what is filtering the list right now, so a selected filter is never hidden -->
				<div v-if="activeFilters.length" class="d-flex flex-wrap align-center mt-2" style="gap:6px">
					<span class="text-body-small font-weight-medium">{{ $t('plugins.WorkshopActivity.activity.filters_on') }}</span>
					<v-chip v-for="f in activeFilters" :key="f" size="small" variant="outlined" class="wf-on">{{ f }}</v-chip>
					<v-btn size="x-small" variant="text" color="primary" @click="clearFilters">{{ $t('plugins.WorkshopActivity.activity.clear_filters') }}</v-btn>
				</div>

				<div class="d-flex flex-wrap align-center mt-2" style="gap:8px 16px">
					<v-text-field
						v-model="actText" :label="$t('plugins.WorkshopActivity.activity.search')" prepend-inner-icon="mdi-magnify" clearable density="compact" hide-details
						style="max-width:280px" @keyup.enter="searchActivity(0)" @click:clear="actText = ''; searchActivity(0)"
					/>
					<v-checkbox v-model="group" density="compact" hide-details :label="$t('plugins.WorkshopActivity.activity.group_repeated')" />
					<v-checkbox v-if="me" v-model="onlyMine" density="compact" hide-details :label="$t('plugins.WorkshopActivity.activity.only_mine')" :title="$t('plugins.WorkshopActivity.activity.only_mine_hint')" />
					<v-btn size="x-small" variant="outlined" :loading="exporting" @click="exportCsv"><v-icon size="x-small" start>mdi-download</v-icon>{{ $t('plugins.WorkshopActivity.activity.export_csv') }}</v-btn>
				</div>

				<error-notice v-if="historyError" :error="historyError" retry class="mt-2" @retry="searchActivity(actOffset)" />
				<v-table v-if="rowsVisible.length > 0" density="compact" class="mt-2 act-table">
					<thead>
						<tr>
							<th style="width:64px">{{ $t('plugins.WorkshopActivity.activity.time') }}</th>
							<th style="width:140px">{{ $t('plugins.WorkshopActivity.activity.type') }}</th>
							<th>{{ $t('plugins.WorkshopActivity.activity.description') }}</th>
							<th class="text-right act-secondary" style="width:84px">{{ $t('plugins.WorkshopActivity.activity.duration') }}</th>
							<th class="text-right act-secondary" style="width:64px">kWh</th>
							<th style="width:70px"></th>
						</tr>
					</thead>
					<tbody>
						<template v-for="it in rowsShow" :key="it.key">
							<tr v-if="it.k === 'day'" class="act-day">
								<td colspan="6">{{ it.text }}</td>
							</tr>
							<tr
								v-else-if="it.k === 'group'" class="act-row act-click"
								@click="toggle(it.key)"
							>
								<td class="text-no-wrap">{{ it.since }}-{{ it.until }}</td>
								<td>
									<v-chip size="x-small" label :style="{ '--wf-dotc': styleEv(it.ev).color, '--wf-dotd': 'inline-block' }" :title="kindLabel(it.ev.kind)">
										{{ styleEv(it.ev).short }}
									</v-chip>
								</td>
								<td><v-chip size="x-small" variant="outlined" class="mr-1">{{ $t('plugins.WorkshopActivity.activity.repeated', { n: it.n }) }}</v-chip>{{ textEvent(it.ev) }}</td>
								<td class="act-secondary"></td>
								<td class="act-secondary"></td>
								<td class="text-right"><v-icon size="small">{{ open[it.key] ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon></td>
							</tr>
							<tr
								v-else-if="it.k === 'ev'" class="act-row act-click" :class="{ 'act-sub': it.sub }"
								@click="toggle('e' + it.ev.id)"
							>
								<td class="text-no-wrap" :title="it.ev.ts.replace('T', ' ')">{{ it.ev.ts.slice(11, 16) }}</td>
								<td>
									<v-chip size="x-small" label :style="{ '--wf-dotc': styleEv(it.ev).color, '--wf-dotd': 'inline-block' }" :title="kindLabel(it.ev.kind)">
										{{ styleEv(it.ev).short }}
									</v-chip>
								</td>
								<td>
									<v-chip v-if="it.ev.mode" size="x-small" variant="outlined" class="mr-1" :color="modeColor(it.ev.mode)">{{ it.ev.mode }}</v-chip><v-chip v-if="it.ev.user" size="x-small" variant="outlined" class="mr-1" :title="$t('plugins.WorkshopActivity.activity.done_by')"><v-icon start size="x-small">mdi-account-outline</v-icon>{{ it.ev.user }}</v-chip>
									{{ textEvent(it.ev) }}
								</td>
								<td class="text-right text-no-wrap act-secondary">{{ duration(it.ev.duration_s) }}</td>
								<td class="text-right act-secondary">{{ it.ev.consumption_kwh != null ? it.ev.consumption_kwh.toFixed(3) : '' }}</td>
								<td class="text-right" style="white-space:nowrap">
									<v-icon v-if="it.ev.detail" size="small" class="mr-1" :title="$t('plugins.WorkshopActivity.activity.details')">{{ open['e' + it.ev.id] ? 'mdi-chevron-up' : 'mdi-information-outline' }}</v-icon>
									<v-btn
										v-if="it.ev.id != null && canDo('activity.delete')" size="x-small" :variant="armedId === it.ev.id ? 'flat' : 'text'" :color="armedId === it.ev.id ? 'error' : 'grey'"
										:title="armedId === it.ev.id ? $t('plugins.WorkshopActivity.activity.tap_again_to_delete_this_event') : $t('plugins.WorkshopActivity.activity.delete_this_event')"
										@click.stop="deleteRow(it.ev)"
									>{{ armedId === it.ev.id ? $t('plugins.WorkshopActivity.activity.delete') : $t('plugins.WorkshopActivity.activity.delete_2') }}</v-btn>
								</td>
							</tr>
							<tr v-else class="act-detail">
								<td colspan="6">
									<div v-if="!it.ev.detail" class="text-body-small text-medium-emphasis">{{ $t('plugins.WorkshopActivity.activity.no_details') }}</div>
									<div v-else class="d-flex flex-wrap" style="gap:4px 24px">
										<div v-for="g in detailGroups(it.ev)" :key="g.title" class="act-det-group">
											<div class="text-label-small text-medium-emphasis">{{ g.title }}</div>
											<div v-for="r in g.rows" :key="r.k" class="text-body-small"><span class="text-medium-emphasis">{{ r.k }}:</span> {{ r.v }}</div>
										</div>
									</div>
									<div class="text-body-small text-medium-emphasis mt-1">{{ it.ev.ts.replace('T', ' ') }}  #{{ it.ev.id }}<span v-if="it.ev.user"> - {{ $t('plugins.WorkshopActivity.activity.done_by') }}: {{ it.ev.user }}</span><span v-if="it.ev.duration_s != null"> - {{ $t('plugins.WorkshopActivity.activity.duration') }}: {{ duration(it.ev.duration_s) }}</span><span v-if="it.ev.consumption_kwh != null"> - {{ it.ev.consumption_kwh.toFixed(3) }} kWh</span></div>
								</td>
							</tr>
						</template>
					</tbody>
				</v-table>
				<div v-else-if="!historyError" class="text-body-small text-medium-emphasis mt-2">{{ $t('plugins.WorkshopActivity.activity.no_events_in_range_filter') }}</div>

				<div class="d-flex align-center mt-2" v-if="activityTotal > 0">
					<v-btn size="x-small" variant="text" :disabled="actOffset === 0" @click="searchActivity(Math.max(0, actOffset - actLimit))">{{ $t('plugins.WorkshopActivity.activity.previous') }}</v-btn>
					<span class="text-body-small text-medium-emphasis mx-2">
						{{ $t('plugins.WorkshopActivity.activity.range_of_total', { from: actOffset + 1, to: Math.min(actOffset + actLimit, activityTotal), total: activityTotal }) }}
					</span>
					<v-btn size="x-small" variant="text" :disabled="actOffset + actLimit >= activityTotal" @click="searchActivity(actOffset + actLimit)">{{ $t('plugins.WorkshopActivity.activity.next') }}</v-btn>
					<v-spacer />
					<v-btn
						v-if="canDo('activity.clear')" size="x-small" :variant="cleanArmed ? 'flat' : 'outlined'" :color="cleanArmed ? 'error' : 'grey'"
						:title="$t('plugins.WorkshopActivity.activity.delete_filtered_hint')"
						@click="cleanFiltered"
					>{{ cleanArmed ? $t('plugins.WorkshopActivity.activity.tap_again_to_delete_n_events', { n: activityTotal }) : $t('plugins.WorkshopActivity.activity.delete_filtered_n', { n: activityTotal }) }}</v-btn>
				</div>
				<div v-if="deleteMsg" class="text-body-small mt-1" :class="deleteErr ? 'text-error' : 'text-success'">{{ deleteMsg }}</div>

				<div class="text-body-small text-medium-emphasis mt-2">
					{{ $t('plugins.WorkshopActivity.activity.filters_apply_to_whole_history') }}
				</div>
			</v-card-text>
		</v-card>

		</div>
		<activity-notices v-if="section === 'notices'" />
		<div v-if="section === 'live'">
		<v-card class="mb-3">
			<v-card-title>{{ $t('plugins.WorkshopActivity.activity.log_live_jobs') }}</v-card-title>
			<v-card-text>
				<div class="text-body-medium">
					{{ $t('plugins.WorkshopActivity.activity.a_live_job_streamed_line_by') }} <b>GCode</b>{{ $t('plugins.WorkshopActivity.activity.each_job_goes_into_the_history') }}
				</div>
				<div class="text-body-small mt-2">{{ $t('plugins.WorkshopActivity.activity.at_the_start_of_the') }} <b>Start GCode</b>:</div>
				<code class="d-block pa-2">M118 P0 S"BRIDGE JOB START Trabajo en vivo"</code>
				<div class="text-body-small mt-2">{{ $t('plugins.WorkshopActivity.activity.at_the_end_of_the') }} <b>End GCode</b>:</div>
				<code class="d-block pa-2">M118 P0 S"BRIDGE JOB END"</code>
				<div class="text-body-small text-medium-emphasis mt-2">
					{{ $t('plugins.WorkshopActivity.activity.if_you_stop_a_job_by') }}
				</div>
			</v-card-text>
		</v-card>
		</div>
		</div>
		</div>
	</v-container>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useTheme } from 'vuetify'
import { KIND_ALL, isCancelledEvent, kindFilter, eventText, readableKind } from './event-kinds.js' // decisions by event code (test/event-kinds.test.js)
import { i18n } from './dwc-host.js'
import PageHeader from './PageHeader.vue' // header of every page (vue/_shared)
import ServiceNotice from './ServiceNotice.vue'
import StartupPanel from './StartupPanel.vue' // start-up card (vue/_shared)
import SideTabs from './SideTabs.vue'
import ErrorNotice from './ErrorNotice.vue' // vue/_shared
import ActivityNotices from './ActivityNotices.vue'
import { rowsActivity } from './startup-rows.js'
import { colorMode } from './colors.js'
import { api } from './workshop-api.js'
import { useRole } from './use-role.js' // what the role sees and may do (vue/_shared)
import { visibleItems } from './role-view.js'
import { currentIdentity } from './workshop-auth.js'
import { errorText } from './friendly-error.js'
import { ts } from './shared-t.js'
import { noticeOf } from './activity-notice.js'
import { styles, STYLE_OTHER, cancelled } from './event-styles.js'
import { sectionColor } from './section-colors.js' // the color of each section (--wf-sec)

const { canDo, identityTick } = useRole()
const theme = useTheme()

const today0 = new Date()
const sevenDaysAgo = new Date(today0.getTime() - 7 * 24 * 60 * 60 * 1000)
const asDate = d => d.toISOString().slice(0, 10)

const armedId = ref(null)
const cleanArmed = ref(false)
const deleteMsg = ref('')
const deleteErr = ref(false)
const actSince = ref(asDate(sevenDaysAgo))
const actUntil = ref(asDate(today0))
const actSinceMenu = ref(false)
const actUntilMenu = ref(false)
const kindAll = KIND_ALL
const actKind = ref(KIND_ALL)
const activityRows = ref([])
const activityTotal = ref(0)
const historyOk = ref(null) // start-up card: did the history answer? (null = not asked yet)
const section = ref('today') // the section chosen in the side bar (the card on top is the header and always shows)
const summarySpan = ref('today') // 'today' | 'yesterday' | 'week'
const summary = ref(null) // answer of activity.summary
const summaryLoading = ref(false)
const summaryError = ref(null)
const actOffset = ref(0)
const actLimit = 50
const activityKinds = ref([])
const actText = ref('') // free text filter (description, type, detail)
const group = ref(true) // collapse repeated events (same type and text, 3 or more in a row)
const open = ref({}) // expanded rows / groups
const exporting = ref(false)
const activityLoading = ref(false)
// Service restarts (deploys, DCS relaunching it) are hidden by default: they used to be 87 of 91 events and covered everything else.
const hideService = ref(true)
const mineClient = ref(false) // true when the service is old and does not know `mine`
const onlyMine = ref(false) // only the events done by the person who is logged in (the service filters with `mine`; an old one is filtered here)
const historyError = ref(null) // the last failure of the history (an Error): said in words, with a button to try again
let armTimer = null

// v-date-picker of Vuetify 4 works with Date objects; the page keeps the day as 'YYYY-MM-DD'
function dayModel(source) {
	return computed({
		get: () => (source.value ? new Date(source.value + 'T12:00:00') : null),
		set: d => { if (d) source.value = dateLocal(d instanceof Date ? d : new Date(d)) }
	})
}
const sinceDate = dayModel(actSince)
const untilDate = dayModel(actUntil)

// the filters that are on now (the dates only when they are not the default last 7 days): shown above the list with a way to clear them
const defaultSince = asDate(sevenDaysAgo)
const defaultUntil = asDate(today0)
const activeFilters = computed(() => {
	const t = (k, p) => i18n.t('plugins.WorkshopActivity.activity.' + k, p)
	const out = []
	if (actKind.value !== kindAll) out.push(t('filter_type', { t: kindLabel(actKind.value) }))
	if ((actText.value || '').trim()) out.push(t('filter_text', { t: actText.value.trim() }))
	if (onlyMine.value) out.push(t('filter_mine'))
	if (actSince.value !== defaultSince || actUntil.value !== defaultUntil) out.push(t('filter_range', { from: actSince.value, to: actUntil.value }))
	return out
})
function clearFilters() {
	actKind.value = kindAll
	actText.value = ''
	onlyMine.value = false
	actSince.value = defaultSince
	actUntil.value = defaultUntil
	searchActivity(0)
}
const kindItems = computed(() => [{ text: i18n.t('plugins.WorkshopActivity.activity.all_paren'), value: kindAll }, ...activityKinds.value])

const sections = computed(() => {
	const t = k => i18n.t('plugins.WorkshopActivity.activity.' + k)
	// F3-V (2026-10-21): everybody reads the summary and the history; the phone alerts and the live-job instructions are a technician's
	return visibleItems([
		{ id: 'today', icon: 'mdi-calendar-today', label: t('nav_today') },
		{ id: 'history', icon: 'mdi-history', label: t('nav_history') },
		{ id: 'notices', icon: 'mdi-bell-outline', label: t('nav_alerts'), min: 'technician' },
		{ id: 'live', icon: 'mdi-play-circle-outline', label: t('nav_live'), min: 'technician' }
	], op => canDo(op))
})
// the tiles of the summary
const cardsSummary = computed(() => {
	const r = summary.value
	if (!r) return []
	const t = k => i18n.t('plugins.WorkshopActivity.activity.' + k)
	return [
		{ k: 'ini', label: t('tile_started'), value: r.started, color: '' },
		{ k: 'end', label: t('tile_finished'), value: r.finished, color: r.finished ? 'text-success' : '' },
		{ k: 'can', label: t('tile_cancelled'), value: r.cancelled, color: r.cancelled ? 'text-warning' : '' },
		{ k: 'tie', label: t('tile_time'), value: r.seconds ? duration(r.seconds) : '0', color: '' },
		{ k: 'ene', label: t('tile_energy'), value: r.kwh.toFixed(3) + ' kWh', color: '' },
		{ k: 'err', label: t('tile_errors'), value: r.errors, color: r.errors ? 'text-error' : '' },
		{ k: 'par', label: t('tile_stops'), value: r.emergencies, color: r.emergencies ? 'text-error' : '' },
		{ k: 'avi', label: t('tile_warnings'), value: r.notices, color: r.notices ? 'text-warning' : '' }
	]
})
// name of the person logged in ('' = nobody, or the machine has no users): the history can be narrowed to what they did
const me = computed(() => {
	void identityTick.value
	const id = currentIdentity()
	return (id && id.user && id.user.name) || ''
})
const rowsVisible = computed(() => (onlyMine.value && me.value ? activityRows.value.filter(e => e.user === me.value) : activityRows.value))
// errors and emergency stops among the events of the chosen range
const faults = computed(() => activityRows.value.filter(e => e.kind === 'error' || e.kind === 'emergency').length)
// what the page header counts as attention (the service problem and the session are added by the header)
const headerReasons = computed(() => (faults.value ? [{ level: 'warn', text: i18n.t('plugins.WorkshopActivity.activity.failures_n', { n: faults.value }) }] : []))
const lastEvent = computed(() => {
	const e = activityRows.value[0]
	return e ? String(e.ts).replace('T', ' ').slice(0, 16) : ''
})
// display list: day separators, groups of repeated events, events and their detail rows
const rowsShow = computed(() => {
	const out = []
	const rows = rowsVisible.value
	const norm = ev => ev.kind + '|' + String(ev.description).replace(/\d+/g, '#')
	let lastDay = null
	let i = 0
	while (i < rows.length) {
		const ev = rows[i]
		const d = day(ev.ts)
		if (d !== lastDay) {
			out.push({ k: 'day', key: 'd' + d, text: dayText(ev.ts) })
			lastDay = d
		}
		let j = i + 1
		if (group.value) while (j < rows.length && norm(rows[j]) === norm(ev) && day(rows[j].ts) === d) j++
		const n = j - i
		const members = rows.slice(i, j)
		if (n >= 3) {
			const key = 'g' + ev.id
			out.push({ k: 'group', key, ev, n, since: members[n - 1].ts.slice(11, 16), until: ev.ts.slice(11, 16) })
			if (open.value[key]) {
				members.forEach(m => {
					out.push({ k: 'ev', key: 'e' + m.id, ev: m, sub: true })
					if (open.value['e' + m.id]) out.push({ k: 'det', key: 'x' + m.id, ev: m })
				})
			}
		} else {
			members.forEach(m => {
				out.push({ k: 'ev', key: 'e' + m.id, ev: m })
				if (open.value['e' + m.id]) out.push({ k: 'det', key: 'x' + m.id, ev: m })
			})
		}
		i = j
	}
	return out
})
// Published by the backend (notifier.py) as WorkshopService plugin data.
const notice = computed(() => noticeOf())
// start-up card: the history answers, and the phone alerts (optional) have a server and a topic
const rowsStartup = computed(() => {
	const c = notice.value && notice.value.config
	return rowsActivity({
		history: historyOk.value,
		events: activityTotal.value,
		notices: c ? { active: !!c.active, server: c.server, topic: c.topic } : null
	})
})
const labels = computed(() => {
	const out = {}
	;(notice.value ? notice.value.catalog : []).forEach(t => { out[t.kind] = t.label }) // already in the language of this DWC
	return out
})

watch(summarySpan, () => loadSummary())
watch(onlyMine, () => searchActivity(0))
watch(section, v => {
	if (v === 'today') loadSummary()
})
// the role changed and the open section is no longer for it: back to the summary
watch(sections, list => {
	if (!list.some(x => x.id === section.value)) section.value = 'today'
})

onMounted(() => {
	loadSummary()
	searchActivity(0)
})
onBeforeUnmount(() => {
	clearTimeout(armTimer)
})

function textEvent(ev) {
	return eventText(ev, i18n.locale)
}
function kindLabel(kind) {
	return labels.value[kind] || kind
}
function style(kind) {
	const e = styles[kind]
	return e || Object.assign({}, STYLE_OTHER, { short: labels.value[kind] || readableKind(kind) })
}
function styleEv(ev) {
	if (ev.kind === 'job_end' && isCancelledEvent(ev)) return cancelled
	return style(ev.kind)
}
function modeColor(mode) {
	// the mode's color in Lights, in screen version (DESIGN.md 2)
	return colorMode(mode, theme.global.current.value.dark ? 'text' : 'bright')
}
function duration(s) {
	if (s == null) return ''
	s = Math.round(s)
	if (s < 60) return s + ' s'
	const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
	return h ? `${h} h ${m} min` : `${m} min ${s % 60 ? (s % 60) + ' s' : ''}`.trim()
}
function day(t) {
	return (t || '').slice(0, 10)
}
function dayText(t) {
	const d = day(t)
	const now = new Date()
	const iso = x => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
	const yesterday = new Date(now.getTime() - 86400000)
	const f = new Date(d + 'T12:00:00')
	const long = i18n.t('plugins.WorkshopActivity.activity.weekday_date', { weekday: i18n.t('plugins.WorkshopActivity.activity.weekdays').split(',')[f.getDay()], day: f.getDate(), month: i18n.t('plugins.WorkshopActivity.activity.months_short').split(',')[f.getMonth()] })
	if (d === iso(now)) return i18n.t('plugins.WorkshopActivity.activity.today_date', { date: long })
	if (d === iso(yesterday)) return i18n.t('plugins.WorkshopActivity.activity.yesterday_date', { date: long })
	return long.charAt(0).toUpperCase() + long.slice(1)
}
function filterKind(t) {
	actKind.value = t
	searchActivity(0)
}
// Delete (2026-10-09): double tap to confirm, no dialogs.
function arm(fn) {
	clearTimeout(armTimer)
	armTimer = setTimeout(() => { armedId.value = null; cleanArmed.value = false }, 4000)
	fn()
}
async function deleteRow(ev) {
	if (armedId.value !== ev.id) return arm(() => { armedId.value = ev.id; cleanArmed.value = false })
	armedId.value = null
	await executeDeleted('activity.delete', { id: Number(ev.id) })
}
async function cleanFiltered() {
	if (!cleanArmed.value) return arm(() => { cleanArmed.value = true; armedId.value = null })
	cleanArmed.value = false
	await executeDeleted('activity.clear', queryFilter())
}
async function executeDeleted(op, args) {
	deleteMsg.value = ''
	deleteErr.value = false
	try {
		const data = await api(op, args)
		if (data.error) throw new Error(data.error)
		deleteMsg.value = i18n.t('plugins.WorkshopActivity.activity.deleted_n_events', { n: data.deleted })
	} catch (e) {
		deleteErr.value = true
		deleteMsg.value = i18n.t('plugins.WorkshopActivity.activity.could_not_delete', { error: errorText(e, ts) })
	}
	const off = actOffset.value >= activityTotal.value - 1 ? Math.max(0, actOffset.value - actLimit) : actOffset.value
	searchActivity(off)
}
function toggle(key) {
	open.value[key] = !open.value[key]
}
// label of a detail key (translated when it is a known one)
function labelDetail(k) {
	const key = 'plugins.WorkshopActivity.detail_keys.' + k
	return i18n.te(key) ? i18n.t(key) : k
}
function detailGroups(ev) {
	const d = ev.detail || {}
	const fmt = v => (v !== null && typeof v === 'object' ? JSON.stringify(v) : String(v))
	const rows = o => Object.keys(o || {}).map(k => ({ k: labelDetail(k), v: fmt(o[k]) }))
	const out = []
	if (d.data && Object.keys(d.data).length) out.push({ title: i18n.t('plugins.WorkshopActivity.activity.event_data'), rows: rows(d.data) })
	if (d.context && Object.keys(d.context).length) out.push({ title: i18n.t('plugins.WorkshopActivity.activity.machine_then'), rows: rows(d.context) })
	if (d.origin) out.push({ title: i18n.t('plugins.WorkshopActivity.activity.origin'), rows: [{ k: i18n.t('plugins.WorkshopActivity.activity.origin'), v: d.origin }] })
	return out
}
// arguments of activity.list / activity.clear for the current filter
function queryFilter(withText = true, forList = false) {
	const a = { from: actSince.value, to: actUntil.value }
	const type = kindFilter(actKind.value)
	if (type) a.type = type
	if (hideService.value) a.exclude = ['service']
	if (forList && onlyMine.value && me.value && !mineClient.value) a.mine = true
	if (withText && actText.value && actText.value.trim()) a.query = actText.value.trim()
	return a
}
// downloads every event of the current filter (up to 5000) as CSV
async function exportCsv() {
	exporting.value = true
	try {
		const all = []
		let total = Infinity
		for (let off = 0; off < Math.min(total, 5000); off += 200) {
			const r = await listActivity({ limit: 200, offset: off })
			total = r.total || 0
			all.push(...(r.rows || []))
		}
		const esc = v => {
			const t = v === null || v === undefined ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v))
			return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t
		}
		const lines = ['id,ts,type,mode,description,duration_s,energy_kwh,detail,user'].concat(
			all.map(f => [f.id, f.ts, f.kind, f.mode, f.description, f.duration_s, f.consumption_kwh, f.detail, f.user].map(esc).join(','))
		)
		const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
		const a = document.createElement('a')
		a.href = URL.createObjectURL(blob)
		a.download = 'activity-' + actSince.value + '_' + actUntil.value + '.csv'
		document.body.appendChild(a)
		a.click()
		a.remove()
		setTimeout(() => URL.revokeObjectURL(a.href), 5000)
	} catch (e) {
		deleteErr.value = true
		deleteMsg.value = errorText(e, ts)
	} finally {
		exporting.value = false
	}
}
// ---- summary of the day (activity.summary)
function dateLocal(d) {
	const p = n => String(n).padStart(2, '0')
	return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
}
function spanSummary() {
	const now = new Date()
	const oneDay = 24 * 60 * 60 * 1000
	if (summarySpan.value === 'yesterday') {
		const yesterday = dateLocal(new Date(now.getTime() - oneDay))
		return [yesterday, yesterday]
	}
	if (summarySpan.value === 'week') return [dateLocal(new Date(now.getTime() - 6 * oneDay)), dateLocal(now)]
	const h = dateLocal(now)
	return [h, h]
}
async function loadSummary() {
	summaryLoading.value = true
	summaryError.value = null
	const [since, until] = spanSummary()
	try {
		summary.value = await api('activity.summary', { from: since, to: until, exclude: ['service'] })
	} catch (e) {
		summaryError.value = e
	} finally {
		summaryLoading.value = false
	}
}
function hourRow(t) {
	const s = String(t || '').replace('T', ' ')
	return summarySpan.value === 'today' ? s.slice(11, 16) : s.slice(5, 16)
}
function isCancelled(ev) {
	return isCancelledEvent(ev)
}
function nameJob(ev) {
	const text = textEvent(ev) || ''
	const i = text.indexOf(': ')
	return i >= 0 ? text.slice(i + 2) : text
}
// activity.list with the filter; an old service refuses the argument `mine` (invalid_args): from then on this page filters
async function listActivity(paging) {
	try {
		return await api('activity.list', Object.assign(queryFilter(true, true), paging))
	} catch (e) {
		if (e && e.code === 'invalid_args' && onlyMine.value && !mineClient.value) {
			mineClient.value = true
			return await api('activity.list', Object.assign(queryFilter(true, true), paging))
		}
		throw e
	}
}
async function searchActivity(offset) {
	activityLoading.value = true
	actOffset.value = offset
	try {
		const data = await listActivity({ limit: actLimit, offset })
		activityRows.value = data.rows || []
		activityTotal.value = data.total || 0
		activityKinds.value = data.kinds || []
		historyOk.value = true
		historyError.value = null
	} catch (e) {
		historyOk.value = false
		historyError.value = e // said in words with a button to try again (never retried by itself)
		activityRows.value = []
		activityTotal.value = 0
	} finally {
		activityLoading.value = false
	}
}
</script>

<style scoped>
.act-click { cursor: pointer; }
/* narrow screens: the secondary columns (duration, kWh) leave the table so the delete button stays in view; both show in the opened row */
@media (max-width: 600px) {
	.act-table .act-secondary { display: none; }
}
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
