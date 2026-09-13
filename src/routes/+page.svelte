<script lang="ts">
	import { onMount, tick } from 'svelte';
	import ChapterNav from '$lib/components/ChapterNav.svelte';
	import InterviewCard from '$lib/components/InterviewCard.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import OceanLayers from '$lib/components/OceanLayers.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import { cards } from '$lib/stores/card.svelte';
	import { loader } from '$lib/stores/loader.svelte';
	import { depthFor, depthFactor } from '$lib/ocean/depth';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let profile = $derived(data.profile);
	let projects = $derived(data.projects);
	let dy = $state(28);
	let coarse = $state(false);

	const current = $derived(profile.cards[cards.current]);
	const currentDepthInfo = $derived(depthFor(cards.current, profile.cards.length));
	const currentDepthFactor = $derived(depthFactor(cards.current, profile.cards.length));

	$effect(() => {
		document.documentElement.style.setProperty('--depth', String(currentDepthFactor));
	});

	async function focusCurrentCard() {
		await tick();
		const el = document.getElementById(`card-question-${cards.current}`);
		el?.focus({ preventScroll: true });
	}

	function nav(i: number, focusAfter = true) {
		if (i < 0 || i >= profile.cards.length || i === cards.current) return;
		dy = i > cards.current ? 28 : -28;
		cards.go(i);
		if (focusAfter) {
			void focusCurrentCard();
		}
	}

	const next = () => {
		if (!cards.total) return;
		dy = 28;
		cards.next();
		void focusCurrentCard();
	};

	const prev = () => {
		if (!cards.total) return;
		dy = -28;
		cards.prev();
		void focusCurrentCard();
	};

	function isTypingTarget(target: EventTarget | null) {
		const el = target instanceof HTMLElement ? target : null;
		return !!el?.closest('input, textarea, select, [contenteditable="true"]');
	}

	let y0: number | null = null;
	let swipeInField = false;

	function onTouchStart(e: TouchEvent) {
		if (!loader.finished) return;
		const el = e.target instanceof Element ? e.target : null;
		swipeInField = !!el?.closest('input, textarea, select, button, [contenteditable="true"]');
		y0 = e.touches[0]?.clientY ?? null;
	}

	function onTouchEnd(e: TouchEvent) {
		if (y0 === null) return;
		const dySwipe = e.changedTouches[0].clientY - y0;
		const blocked = swipeInField;
		y0 = null;
		swipeInField = false;
		if (blocked) return;
		if (Math.abs(dySwipe) > 48) {
			// свайп вверх = погружение (глубже), свайп вниз = всплытие (мельче)
			(dySwipe < 0 ? next : prev)();
		}
	}

	onMount(() => {
		cards.setTotal(profile.cards.length);
		coarse = matchMedia('(pointer: coarse)').matches;

		function onKey(e: KeyboardEvent) {
			if (isTypingTarget(e.target)) return;
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				next();
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				prev();
			} else if (/^[1-9]$/.test(e.key)) {
				nav(Number(e.key) - 1);
			} else if (e.key === '/') {
				e.preventDefault();
				const i = profile.cards.findIndex((c) => c.kind === 'contact');
				if (i === -1) return;
				nav(i, false);
				void tick().then(() => document.getElementById('f-name')?.focus({ preventScroll: true }));
			}
		}

		window.addEventListener('keydown', onKey);
		window.addEventListener('touchstart', onTouchStart);
		window.addEventListener('touchend', onTouchEnd);
		loader.play().then(() => loader.finish());

		return () => {
			window.removeEventListener('keydown', onKey);
			window.removeEventListener('touchstart', onTouchStart);
			window.removeEventListener('touchend', onTouchEnd);
		};
	});
</script>

<svelte:head>
	<title>{profile.name} — погружение</title>
</svelte:head>

<Loader />
<OceanLayers depth={currentDepthFactor} />

<div
	class="relative z-3 mx-auto grid h-dvh max-w-260 grid-rows-[auto_1fr_auto]
		gap-[clamp(10px,1.6vh,16px)] px-[clamp(16px,4vw,24px)]
		pt-[calc(14px+env(safe-area-inset-top))] pb-[calc(14px+env(safe-area-inset-bottom))]
		md:grid-rows-[auto_1fr_auto_auto]"
>
	<SiteHeader name={profile.name} status={profile.status} />

	<div
		class="relative flex touch-pan-y overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden"
	>
		{#if current}
			{#key cards.current}
				<div class="card-in m-auto min-h-0 w-full" style:--dy="{dy}px">
					<InterviewCard
						card={current}
						{projects}
						questionId={`card-question-${cards.current}`}
						depth={currentDepthInfo.depth}
						zone={currentDepthInfo.zone}
					/>
				</div>
			{/key}
		{:else}
			<p class="m-auto font-mono text-xs uppercase tracking-widest text-mut">
				Карточки пока не заполнены
			</p>
		{/if}
	</div>

	{#if profile.cards.length > 0}
		<ChapterNav items={profile.cards} onNav={nav} />
	{/if}

	<footer
		class="hidden flex-wrap justify-between gap-x-5 gap-y-2 font-mono
		text-[clamp(9.5px,1.2vw,10.5px)] tracking-[0.06em] text-mut md:flex"
	>
		<span>здесь некуда скроллить — только погружаться</span>
		<span>
			{#if coarse}
				свайп ↑↓ · оглавление выше
			{:else}
				↑ ↓ или 1–{profile.cards.length} · «/» — к форме
			{/if}
		</span>
	</footer>
</div>
