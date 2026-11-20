'use strict'

// The operations each group of sensitive buttons of the Activity page asks of the service (auth.can), so ONE sentence under the group says why it is
// locked (reason-mixin.js, access-reason.js). Pure: no imports. The names are the ones of dsf/permissions.json; a test compares both and the API contract.
//
//   DELETE_OPS        delete one event, delete the filtered events (history; not drawn for the people who may not, the sentence says why)
//   ACTIVE_OPS        the switch that turns the phone alerts on and off
//   DESTINATION_OPS   server and topic: save the destination, generate a new topic
//   TEST_OPS          send a test alert (the general one and the one of each type)
//   HOURS_OPS         the quiet hours
//   EVENTS_OPS        which events notify, their options, the camera and the length of the video
//   READ_OPS          the readings (history, summary, camera list): no group of buttons, asked once so the page opens with one call
//   SCREEN_OPS        everything the page asks when it opens, in one call

export const DELETE_OPS = Object.freeze(['activity.delete', 'activity.clear'])
export const ACTIVE_OPS = Object.freeze(['notifications.active'])
export const DESTINATION_OPS = Object.freeze(['notifications.destination', 'notifications.new_topic'])
export const TEST_OPS = Object.freeze(['notifications.test'])
export const HOURS_OPS = Object.freeze(['notifications.quiet_hours'])
export const EVENTS_OPS = Object.freeze(['notifications.type', 'notifications.option', 'notifications.video'])
export const READ_OPS = Object.freeze(['activity.list', 'activity.summary', 'camera.status'])

// the groups that carry a sentence, by name: the structure test walks this list
export const GROUPS = Object.freeze({ delete: DELETE_OPS, active: ACTIVE_OPS, destination: DESTINATION_OPS, test: TEST_OPS, hours: HOURS_OPS, events: EVENTS_OPS })

export const SCREEN_OPS = Object.freeze(Array.from(new Set([].concat(DELETE_OPS, ACTIVE_OPS, DESTINATION_OPS, TEST_OPS, HOURS_OPS, EVENTS_OPS, READ_OPS))))

// every operation of the group is allowed by `can` (a function op -> boolean)
export function groupAllowed(ops, can) {
	return ops.every(op => can(op))
}
