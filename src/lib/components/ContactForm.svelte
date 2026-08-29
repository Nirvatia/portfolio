<script lang="ts">
	import type { ContactPayload } from '$lib/types'

	type FormState = 'idle' | 'sending' | 'sent' | 'error'

	let formState: FormState = $state('idle')
	let sentName = $state('')
	let sentEmail = $state('')

	const field =
		'w-full border-0 border-b border-line bg-transparent py-1 font-serif text-base text-ink ' +
		'caret-mark outline-none transition-colors focus:border-mark focus-visible:outline-none'

	async function handleSubmit(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
		e.preventDefault()
		if (formState === 'sending') return
		formState = 'sending'

		const fd = new FormData(e.currentTarget)
		const payload = {
			name: String(fd.get('name') ?? '').trim(),
			email: String(fd.get('email') ?? '').trim(),
			message: String(fd.get('message') ?? '').trim(),
			website: String(fd.get('website') ?? '')
		} satisfies ContactPayload & { website: string }

		try {
			const res = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			})
			const out = (await res.json().catch(() => ({ ok: false }))) as { ok: boolean }
			if (res.ok && out.ok) {
				sentName = payload.name
				sentEmail = payload.email
				formState = 'sent'
			} else {
				formState = 'error'
			}
		} catch {
			formState = 'error'
		}
	}
</script>

{#if formState === 'sent'}
	<div class="card-in">
		<p class="hang -ml-[2ch] mb-4 mt-[clamp(18px,3vh,28px)] font-mono text-[13px] text-mut">
			— И что дальше?
		</p>
		<p
			role="status"
			class="dropcap font-serif text-[clamp(21px,4.6vw,38px)] leading-[1.3] tracking-[-0.01em]"
		>
			Спасибо, {sentName}. Сообщение ушло. Отвечу на {sentEmail}.
		</p>
	</div>
{:else}
	<form
		class="relative mt-[clamp(14px,2.4vh,26px)] grid max-w-[460px] gap-[clamp(12px,1.8vh,18px)]"
		aria-busy={formState === 'sending'}
		onsubmit={handleSubmit}
	>
		<!-- ханипот: живые люди его не видят, боты заполняют -->
		<div class="absolute -left-[9999px]" aria-hidden="true">
			<label>
				не заполняйте это поле
				<input type="text" name="website" tabindex="-1" autocomplete="off" />
			</label>
		</div>

		<label class="grid gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-mut">
			имя
			<input id="f-name" name="name" required maxlength="200" autocomplete="name" class={field} />
		</label>

		<label class="grid gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-mut">
			почта
			<input type="email" name="email" required maxlength="320" autocomplete="email" class={field} />
		</label>

		<label class="grid gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-mut">
			о чём речь
			<textarea
				name="message"
				required
				maxlength="4000"
				class="{field} min-h-[clamp(56px,10vh,80px)] resize-y leading-normal"
			></textarea>
		</label>

		<button
			type="submit"
			disabled={formState === 'sending'}
			class="cursor-pointer justify-self-start border border-ink bg-transparent px-6 py-2.5
				font-mono text-xs uppercase tracking-[0.14em] text-ink transition-colors
				hover:bg-ink hover:text-paper disabled:cursor-default disabled:opacity-50"
		>
			{formState === 'sending' ? 'Уходит…' : 'Отправить'}
		</button>

		{#if formState === 'error'}
			<p role="alert" class="text-sm text-mut">Не ушло. Попробуй ещё раз.</p>
		{/if}
	</form>
{/if}