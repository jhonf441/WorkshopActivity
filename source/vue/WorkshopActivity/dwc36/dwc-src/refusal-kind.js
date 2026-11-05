'use strict'

// The CAUSE of a refused call (session-note.js decides what a refusal is): 'session' (nobody is signed in, or the token ended) | 'role' (the role
// is too low) | '' (not a refusal: the page keeps its own error). The page draws it with <session-notice> / <lock-reason>, so a refusal is never red.
// `out` = nobody is signed in now (signedOut() of workshop-auth.js): a 403 while nobody is signed in is a session cause too. Pure. Test: test/refusal-kind.test.js.

import { isRefusal } from './session-note.js'

export function refusalKind(e, out) {
	if (!isRefusal(e)) return ''
	return e.code === 'login_required' || out ? 'session' : 'role'
}
