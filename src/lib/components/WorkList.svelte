<script lang="ts">
	import type { Project } from '$lib/types';
	
	import Icon from '@iconify/svelte';
	import arrowUpRight from '@iconify-icons/ph/arrow-up-right';

	let { projects }: { projects: Project[] } = $props();
</script>

<div class="mt-[clamp(12px,2vh,20px)]">
	{#if projects.length === 0}
		<p class="text-mut">Пока пусто. Но это пока.</p>
	{:else}
		<ul role="list">
			{#each projects as project (project._id)}
				<li
					class="group relative grid grid-cols-[minmax(0,1fr)_clamp(130px,16vw,175px)] items-start
						gap-x-[clamp(16px,2.6vw,28px)] border-b border-dotted border-line
						py-[clamp(9px,1.4vh,13px)] last:border-0 max-md:grid-cols-1"
				>
					<div class="min-w-0">
						{#if project.liveUrl ?? project.codeUrl}
							<a
								href={project.liveUrl ?? project.codeUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="text-[clamp(16px,2.2vw,22px)] text-ink no-underline transition-colors
		group-hover:text-mark after:absolute after:inset-0 after:content-[''] wrap-anywhere"
							>
								{project.title}<span class="sr-only"> — откроется в новой вкладке</span><span
									aria-hidden="true"
									class="ml-[0.4em] inline-flex -translate-x-1 opacity-0 transition
			group-hover:translate-x-0 group-hover:opacity-100"
									><Icon icon={arrowUpRight} class="text-current" /></span
								>
							</a>
						{:else}
							<span class="text-[clamp(18px,2.2vw,24px)] wrap-anywhere">{project.title}</span>
						{/if}

						<span class="ml-2 font-mono text-xs text-mut md:hidden">{project.year}</span>

						{#if project.description}
							<p class="mt-0.5 text-[clamp(15px,1.5vw,16px)] leading-normal text-mut wrap-anywhere">
								{project.description}
							</p>
						{/if}
					</div>

					<div class="pt-1 text-right font-mono text-[11px] leading-[1.7] text-mut max-md:hidden">
						<span class="font-normal text-ink">{project.year}</span>
						{#if project.tags?.length}<br />{project.tags.join(' · ')}{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
