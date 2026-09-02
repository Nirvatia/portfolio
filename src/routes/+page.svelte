<script lang="ts">
	import { onMount, tick } from 'svelte';
	import ChapterNav from '$lib/components/ChapterNav.svelte';
	import InterviewCard from '$lib/components/InterviewCard.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import { cards } from '$lib/stores/card.svelte';
	import { loader } from '$lib/stores/loader.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let profile = $derived(data.profile);
	let projects = $derived(data.projects);
	let dy = $state(16);
	let coarse = $state(false);

	const current = $derived(profile.cards[cards.current]);

	function nav(i: number) {
		if (i < 0 || i >= profile.cards.length || i === cards.current) return;
		dy = i > cards.current ? 16 : -16;
		cards.go(i);
	}

	const next = () => {
		dy = 16;
		cards.next();
	};

	const prev = () => {
		dy = -16;
		cards.prev();
	};

	function isInteractiveTarget(target: EventTarget | null) {
		const el = target instanceof HTMLElement ? target : null;

		return !!el?.closest(
			'input, textarea, select, button, a[href], [contenteditable="true"], [role="button"], [role="link"]'
		);
	}

	let x0: number | null = null;
	let swipeInField = false;

	function onTouchStart(e: TouchEvent) {
		if (!loader.finished) return;

		const el = e.target instanceof Element ? e.target : null;

		swipeInField = !!el?.closest('input, textarea, select, button, [contenteditable="true"]');
		x0 = e.touches[0]?.clientX ?? null;
	}

	function onTouchEnd(e: TouchEvent) {
		if (x0 === null) return;

		const dx = e.changedTouches[0].clientX - x0;
		const blocked = swipeInField;

		x0 = null;
		swipeInField = false;

		if (blocked) return;

		if (Math.abs(dx) > 48) {
			(dx < 0 ? next : prev)();
		}
	}

	onMount(() => {
		cards.setTotal(profile.cards.length);
		coarse = matchMedia('(pointer: coarse)').matches;

		function onKey(e: KeyboardEvent) {
			if (isInteractiveTarget(e.target)) return;

			if (e.key === 'ArrowRight') {
				e.preventDefault();
				next();
			} else if (e.key === 'ArrowLeft') {
				e.preventDefault();
				prev();
			} else if (/^[1-9]$/.test(e.key)) {
				nav(Number(e.key) - 1);
			} else if (e.key === '/') {
				e.preventDefault();

				const i = profile.cards.findIndex((c) => c.kind === 'contact');
				if (i === -1) return;

				nav(i);
				tick().then(() => document.getElementById('f-name')?.focus({ preventScroll: true }));
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
	<title>{profile.name} — интервью вместо портфолио</title>
</svelte:head>

<Loader />

<div
	class="mx-auto grid h-dvh max-w-260 grid-rows-[auto_1fr_auto]
		gap-[clamp(10px,1.6vh,16px)] px-[clamp(16px,4vw,24px)]
		pt-[calc(14px+env(safe-area-inset-top))] pb-[calc(14px+env(safe-area-inset-bottom))]
		md:grid-rows-[auto_1fr_auto_auto]"
>
	<SiteHeader name={profile.name} status={profile.status} />

	<div
		class="relative flex touch-pan-y overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden"
		aria-live="polite"
	>
		{#key cards.current}
			<div class="card-in m-auto min-h-0 w-full" style:--dy="{dy}px">
				<InterviewCard card={current} {projects} />
			</div>
		{/key}
	</div>

	<ChapterNav items={profile.cards} onNav={nav} />

	<footer
		class="hidden flex-wrap justify-between gap-x-5 gap-y-2 font-mono
		text-[clamp(9.5px,1.2vw,10.5px)] tracking-[0.06em] text-mut md:flex"
	>
		<span>здесь некуда скроллить — и это осознанно</span>
		<span>
			{#if coarse}
				свайп · оглавление выше
			{:else}
				← → или 1–{profile.cards.length} · «/» — к форме
			{/if}
		</span>
	</footer>
</div>
