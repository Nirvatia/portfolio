<script lang="ts">
	import { onMount, tick } from 'svelte'
	import ChapterNav from '$lib/components/ChapterNav.svelte'
	import InterviewCard from '$lib/components/InterviewCard.svelte'
	import Loader from '$lib/components/Loader.svelte'
	import SiteHeader from '$lib/components/SiteHeader.svelte'
	import { cards } from '$lib/stores/card.svelte'
	import { loader } from '$lib/stores/loader.svelte'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()
	const { profile, projects } = data

	let dy = $state(16)
	let printing = $state(false)
	let coarse = $state(false)

	const current = $derived(profile.cards[cards.current])

	function nav(i: number) {
		if (i < 0 || i >= profile.cards.length || i === cards.current) return
		dy = i > cards.current ? 16 : -16
		cards.go(i)
	}
	const next = () => { dy = 16; cards.next() }
	const prev = () => { dy = -16; cards.prev() }

	let x0: number | null = null
	function onTouchStart(e: TouchEvent) { x0 = e.touches[0].clientX }
	function onTouchEnd(e: TouchEvent) {
		if (x0 == null) return
		const dx = e.changedTouches[0].clientX - x0
		if (Math.abs(dx) > 48) (dx < 0 ? next : prev)()
		x0 = null
	}

	onMount(() => {
		cards.setTotal(profile.cards.length)
		coarse = matchMedia('(pointer: coarse)').matches

		function onKey(e: KeyboardEvent) {
			if ((e.target as HTMLElement | null)?.matches('input, textarea')) return
			if (e.key === 'ArrowRight') { e.preventDefault(); next() }
			else if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
			else if (/^[1-9]$/.test(e.key)) nav(Number(e.key) - 1)
			else if (e.key === '/') {
				e.preventDefault()
				const i = profile.cards.findIndex((c) => c.kind === 'contact')
				if (i === -1) return
				nav(i)
				tick().then(() => document.getElementById('f-name')?.focus({ preventScroll: true }))
			}
		}
		const onBeforePrint = () => (printing = true)
		const onAfterPrint = () => (printing = false)

		window.addEventListener('keydown', onKey)
		window.addEventListener('beforeprint', onBeforePrint)
		window.addEventListener('afterprint', onAfterPrint)

		// звукопроверка — асинхронная часть, колбэк при этом остаётся синхронным
		loader.play().then(() => loader.finish())

		return () => {
			window.removeEventListener('keydown', onKey)
			window.removeEventListener('beforeprint', onBeforePrint)
			window.removeEventListener('afterprint', onAfterPrint)
		}
	})
</script>

<svelte:head>
	<title>{profile.name} — интервью вместо портфолио</title>
</svelte:head>

<Loader />

<div
	class="mx-auto grid h-dvh max-w-[1040px] grid-rows-[auto_1fr_auto_auto]
		gap-[clamp(10px,1.6vh,16px)] px-[clamp(16px,4vw,24px)]
		pt-[calc(14px+env(safe-area-inset-top))] pb-[calc(14px+env(safe-area-inset-bottom))]
		print:block print:h-auto"
>
	<SiteHeader name={profile.name} status={profile.status} />

	<div
		class="relative flex touch-pan-y overflow-y-auto [scrollbar-width:none]
			[&::-webkit-scrollbar]:hidden print:block print:overflow-visible"
		ontouchstart={onTouchStart}
		ontouchend={onTouchEnd}
		aria-live="polite"
	>
		{#if printing}
			{#each profile.cards as card (card.no)}
				<div class="mb-11">
					<InterviewCard {card} {projects} />
				</div>
			{/each}
		{:else}
			{#key cards.current}
				<div class="card-in m-auto min-h-0 w-full" style:--dy="{dy}px">
					<InterviewCard card={current} {projects} />
				</div>
			{/key}
		{/if}
	</div>

	<ChapterNav items={profile.cards} onNav={nav} />

	<footer
		class="flex flex-wrap justify-between gap-x-5 gap-y-2 font-mono
			text-[clamp(9.5px,1.2vw,10.5px)] tracking-[0.06em] text-mut print:hidden"
	>
		<span>здесь некуда скроллить — и это осознанно</span>
		<span>
			{#if coarse}
				свайп · оглавление выше
			{:else}
				← → или 1–{profile.cards.length} · «/» — к форме
			{/if}
			·
			<button
				type="button"
				onclick={() => window.print()}
				class="cursor-pointer underline underline-offset-2 hover:text-ink"
			>печать</button>
		</span>
	</footer>
</div>