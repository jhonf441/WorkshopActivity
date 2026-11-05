'use strict'

// The text colour that reads best on a background of any colour: white or near black, whichever has the higher WCAG contrast (a fixed white
// failed on the light colours: 2.3:1 on orange). Pure: test/readable-text.test.js.

function channel(v) {
	const c = v / 255
	return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

// '#rgb' or '#rrggbb' -> relative luminance 0..1, or null when it is not a hex colour
export function luminance(hex) {
	const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex || '').trim())
	if (!m) return null
	let h = m[1]
	if (h.length === 3) h = h.split('').map(c => c + c).join('')
	const r = parseInt(h.slice(0, 2), 16)
	const g = parseInt(h.slice(2, 4), 16)
	const b = parseInt(h.slice(4, 6), 16)
	return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrast(a, b) {
	const la = luminance(a)
	const lb = luminance(b)
	if (la === null || lb === null) return 0
	return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

export const LIGHT_TEXT = '#ffffff'
export const DARK_TEXT = '#1b1b1b'

export function readableText(background) {
	if (luminance(background) === null) return LIGHT_TEXT
	return contrast(LIGHT_TEXT, background) >= contrast(DARK_TEXT, background) ? LIGHT_TEXT : DARK_TEXT
}

function mixBlack(hex, amount) {
	let h = hex.replace('#', '')
	if (h.length === 3) h = h.split('').map(c => c + c).join('')
	const out = [0, 2, 4].map(i => Math.round(parseInt(h.slice(i, i + 2), 16) * (1 - amount)))
	return '#' + out.map(v => v.toString(16).padStart(2, '0')).join('')
}

// { background, color } that reads at 4.5:1 or better: the colour asked for when white or near black already reads on it, else the same colour
// darkened a little at a time (a mid tone like teal reads at 4.3 with either) until white reads on it. Not a hex colour: returned as it is.
export function readablePair(background) {
	if (luminance(background) === null) return { background, color: LIGHT_TEXT }
	let color = readableText(background)
	if (contrast(color, background) >= 4.5) return { background, color }
	let bg = background
	for (let i = 1; i <= 20 && contrast(LIGHT_TEXT, bg) < 4.5; i++) bg = mixBlack(background, i * 0.04)
	return { background: bg, color: LIGHT_TEXT }
}
