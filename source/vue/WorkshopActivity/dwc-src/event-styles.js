'use strict'

// Label, color and icon of each type of event of the history (Activity page). The texts are read when the page loads: DWC reloads
// the plugin when the language changes (language-reload.js), so they are never stale.

import { i18n } from './dwc-host.js'

// Short label, color and icon per event type (2026-10-09). Red =
// something failed, orange = attention, green = finished well, blue = job,
// gray = system routine.
export const styles = {
	job_start: { short: i18n.t('plugins.WorkshopActivity.activity.start'), color: '#1E88E5', icon: 'mdi-play' },
	job_end: { short: i18n.t('plugins.WorkshopActivity.activity.finished'), color: '#43A047', icon: 'mdi-check-circle' },
	job_pause: { short: i18n.t('plugins.WorkshopActivity.activity.pause'), color: '#FB8C00', icon: 'mdi-pause-circle' },
	emergency: { short: i18n.t('plugins.WorkshopActivity.activity.emergency'), color: '#D32F2F', icon: 'mdi-alert-octagon' },
	error: { short: i18n.t('plugins.WorkshopActivity.activity.error'), color: '#E53935', icon: 'mdi-alert-circle' },
	notice: { short: i18n.t('plugins.WorkshopActivity.activity.warning'), color: '#F9A825', icon: 'mdi-alert' },
	power: { short: i18n.t('plugins.WorkshopActivity.activity.energy'), color: '#8E24AA', icon: 'mdi-power' },
	system: { short: i18n.t('plugins.WorkshopActivity.activity.system_powered_on'), color: '#546E7A', icon: 'mdi-raspberry-pi' },
	service: { short: i18n.t('plugins.WorkshopActivity.activity.service'), color: '#78909C', icon: 'mdi-restart' },
	mode: { short: i18n.t('plugins.WorkshopActivity.activity.mode'), color: '#3949AB', icon: 'mdi-swap-horizontal' },
	zone: { short: i18n.t('plugins.WorkshopActivity.activity.zones'), color: '#00897B', icon: 'mdi-vector-square' },
	config: { short: i18n.t('plugins.WorkshopActivity.activity.config'), color: '#00ACC1', icon: 'mdi-wrench' },
	preset: { short: i18n.t('plugins.WorkshopActivity.activity.preset'), color: '#757575', icon: 'mdi-content-save' },
	// 2026-10-10: active risk (level 4: starts / ends with its duration) and
	// calibrations the pages note (API activity.log type calibration)
	risk: { short: i18n.t('plugins.WorkshopActivity.activity.risk'), color: '#C62828', icon: 'mdi-shield-alert' },
	calibration: { short: i18n.t('plugins.WorkshopActivity.activity.calibration'), color: '#5E35B1', icon: 'mdi-ruler' },
	// F3: the operator's manual checklist (activity.log safety_check) and the protection guard (guard = a protection stopped answering,
	// guard_alarm = it happened during a laser / CNC job)
	safety_check: { short: i18n.t('plugins.WorkshopActivity.activity.safety_check'), color: '#00897B', icon: 'mdi-clipboard-check' },
	guard: { short: i18n.t('plugins.WorkshopActivity.activity.guard'), color: '#FB8C00', icon: 'mdi-shield-alert-outline' },
	guard_alarm: { short: i18n.t('plugins.WorkshopActivity.activity.guard_alarm'), color: '#B71C1C', icon: 'mdi-shield-off' },
	fire: { short: i18n.t('plugins.WorkshopActivity.activity.fire'), color: '#D84315', icon: 'mdi-fire-alert' },
	health_temp: { short: i18n.t('plugins.WorkshopActivity.activity.system_temp'), color: '#F4511E', icon: 'mdi-thermometer-alert' },
	health_voltage: { short: i18n.t('plugins.WorkshopActivity.activity.voltage'), color: '#D81B60', icon: 'mdi-flash-alert' },
	health_wifi: { short: 'WiFi', color: '#FB8C00', icon: 'mdi-wifi-alert' },
	health_service: { short: i18n.t('plugins.WorkshopActivity.activity.service_down'), color: '#E53935', icon: 'mdi-server-off' },
	camera: { short: i18n.t('plugins.WorkshopActivity.activity.kind_camera'), color: '#039BE5', icon: 'mdi-camera' },
	maintenance: { short: i18n.t('plugins.WorkshopActivity.activity.kind_maintenance'), color: '#6D4C41', icon: 'mdi-hammer-wrench' },
	note: { short: i18n.t('plugins.WorkshopActivity.activity.kind_note'), color: '#546E7A', icon: 'mdi-note-text' },
	box_black: { short: i18n.t('plugins.WorkshopActivity.activity.kind_box_black'), color: '#37474F', icon: 'mdi-package-variant-closed' },
	meter_alarm: { short: i18n.t('plugins.WorkshopActivity.activity.kind_meter_alarm'), color: '#FB8C00', icon: 'mdi-gauge-low' },
	health_disk: { short: i18n.t('plugins.WorkshopActivity.activity.kind_health_disk'), color: '#F4511E', icon: 'mdi-harddisk-remove' },
	health_restart: { short: i18n.t('plugins.WorkshopActivity.activity.system_restart'), color: '#C62828', icon: 'mdi-restart-alert' }
};

export const STYLE_OTHER = { short: '', color: '#9E9E9E', icon: 'mdi-circle-small' };
export const cancelled = { short: i18n.t('plugins.WorkshopActivity.activity.cancelled'), color: '#EF6C00', icon: 'mdi-cancel' };
