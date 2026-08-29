export const LOADER_LINES = [
	'— Запись идёт?',
	'Идёт.',
	'— Начнём сразу?',
	'Давайте без разминки.',
	'— Тогда начали.'
]

const FIRST_DELAY_MS = 350
const LINE_STEP_MS = 430
const MIN_SHOW_MS = 2500

let shown = $state(0)
let finished = $state(false)

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export const loader = {
	get shown() { return shown },
	get finished() { return finished },

	/** Играет звукопроверку; резолвится не раньше MIN_SHOW_MS. */
	async play() {
		const started = Date.now()
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
			shown = LOADER_LINES.length
		} else {
			for (let i = 0; i < LOADER_LINES.length; i++) {
				const wait = FIRST_DELAY_MS + i * LINE_STEP_MS - (Date.now() - started)
				if (wait > 0) await sleep(wait)
				shown = i + 1
			}
		}
		const rest = MIN_SHOW_MS - (Date.now() - started)
		if (rest > 0) await sleep(rest)
	},
	finish() { finished = true }
}