'use strict'

// The color of each section of the Activity page, one place (the family reads it as --wf-sec on the page root: the 2 px line on
// top of the cards and the line of the open side item). The badge color of the page bar is in vue/_shared/plugin-colors.js.

export const SECTION_COLORS = {
	today: '#1E88E5',
	history: '#26A69A',
	notices: '#FB8C00',
	live: '#AB47BC'
}

export function sectionColor(id) {
	return SECTION_COLORS[id] || '#1E88E5'
}
