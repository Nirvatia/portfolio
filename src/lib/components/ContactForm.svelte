<script lang="ts">
	import type { ContactPayload } from '$lib/types';

	type FormState = 'idle' | 'sending' | 'sent' | 'error';
	type FieldErrors = { name: string; email: string; message: string };

	let formState: FormState = $state('idle');
	let sentName = $state('');
	let sentEmail = $state('');
	let errors: FieldErrors = $state({ name: '', email: '', message: '' });

	let nameEl: HTMLInputElement | undefined = $state();
	let emailEl: HTMLInputElement | undefined = $state();
	let messageEl: HTMLTextAreaElement | undefined = $state();

	const field =
		'w-full border-0 border-b border-line bg-transparent py-1 font-serif text-base text-ink ' +
		'caret-mark outline-none transition-colors focus:border-mark focus-visible:outline-none';

	const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	const validateName = (v: string) => (!v ? 'представься — хотя бы одним словом' : '');
	const validateEmail = (v: string) =>
		!v ? 'куда отвечать?' : EMAIL_RE.test(v) ? '' : 'это не похоже на почту';
	const validateMessage = (v: string) => (!v ? 'напиши хоть пару строк' : '');

	function liveCheck(k: keyof FieldErrors, value: string) {
		if (!errors[k]) return;
		errors[k] =
			k === 'name'
				? validateName(value)
				: k === 'email'
					? validateEmail(value)
					: validateMessage(value);
	}

	async function handleSubmit(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
		e.preventDefault();
		if (formState === 'sending') return;

		const fd = new FormData(e.currentTarget);
		const payload = {
			name: String(fd.get('name') ?? '').trim(),
			email: String(fd.get('email') ?? '').trim(),
			message: String(fd.get('message') ?? '').trim(),
			website: String(fd.get('website') ?? '')
		} satisfies ContactPayload & { website: string };

		errors.name = validateName(payload.name);
		errors.email = validateEmail(payload.email);
		errors.message = validateMessage(payload.message);

		if (errors.name || errors.email || errors.message) {
			(errors.name ? nameEl : errors.email ? emailEl : messageEl)?.focus();
			return;
		}

		formState = 'sending';

		try {
			const res = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			const out = (await res.json().catch(() => ({ ok: false }))) as { ok: boolean };
			if (res.ok && out.ok) {
				sentName = payload.name;
				sentEmail = payload.email;
				formState = 'sent';
			} else {
				formState = 'error';
			}
		} catch {
			formState = 'error';
		}
	}
</script>

{#if formState === 'sent'}
	<div class="card-in">
		<p class="hang ml-[-2ch] mb-4 mt-[clamp(18px,3vh,28px)] font-mono text-[13px] text-mut">
			— И что дальше?
		</p>
		<p
			role="status"
			class="dropcap font-serif text-[clamp(21px,min(4.6vw,6vh),38px)] leading-[1.3] tracking-[-0.01em] wrap-anywhere"
		>
			Спасибо, {sentName}. Сообщение ушло. Отвечу на {sentEmail}.
		</p>
	</div>
{:else}
	<form
		novalidate
		class="relative mt-[clamp(14px,2.4vh,26px)] grid max-w-115 gap-[clamp(12px,1.8vh,18px)]"
		aria-busy={formState === 'sending'}
		onsubmit={handleSubmit}
	>
		<div class="absolute left-[-9999px]" aria-hidden="true">
			<label>
				не заполняйте это поле
				<input type="text" name="website" tabindex="-1" autocomplete="off" />
			</label>
		</div>

		<label class="grid gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-mut">
			имя
			<input
				bind:this={nameEl}
				id="f-name"
				name="name"
				maxlength="200"
				autocomplete="name"
				class="{field} {errors.name ? 'border-mark' : ''}"
				aria-invalid={errors.name ? true : undefined}
				aria-describedby={errors.name ? 'err-name' : undefined}
				oninput={(e) => liveCheck('name', e.currentTarget.value)}
			/>
			<p
				id="err-name"
				role="alert"
				class="min-h-[1.5em] leading-normal normal-case text-[11px] tracking-[0.06em] text-mark
					transition-opacity duration-200 {errors.name ? 'opacity-100' : 'opacity-0'}"
			>
				{errors.name}
			</p>
		</label>

		<label class="grid gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-mut">
			почта
			<input
				bind:this={emailEl}
				type="email"
				name="email"
				maxlength="320"
				autocomplete="email"
				class="{field} {errors.email ? 'border-mark' : ''}"
				aria-invalid={errors.email ? true : undefined}
				aria-describedby={errors.email ? 'err-email' : undefined}
				oninput={(e) => liveCheck('email', e.currentTarget.value)}
			/>
			<p
				id="err-email"
				role="alert"
				class="min-h-[1.5em] leading-normal normal-case text-[11px] tracking-[0.06em] text-mark
					transition-opacity duration-200 {errors.email ? 'opacity-100' : 'opacity-0'}"
			>
				{errors.email}
			</p>
		</label>

		<label class="grid gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-mut">
			о чём речь
			<textarea
				bind:this={messageEl}
				name="message"
				maxlength="4000"
				class="{field} min-h-[clamp(56px,10vh,80px)] resize-y leading-normal {errors.message
					? 'border-mark'
					: ''}"
				aria-invalid={errors.message ? true : undefined}
				aria-describedby={errors.message ? 'err-message' : undefined}
				oninput={(e) => liveCheck('message', e.currentTarget.value)}></textarea>
			<p
				id="err-message"
				role="alert"
				class="min-h-[1.5em] leading-normal normal-case text-[11px] tracking-[0.06em] text-mark
					transition-opacity duration-200 {errors.message ? 'opacity-100' : 'opacity-0'}"
			>
				{errors.message}
			</p>
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

		<p
			role="alert"
			aria-hidden={formState === 'error' ? undefined : 'true'}
			class="min-h-[1.5em] text-sm leading-normal text-mut transition-opacity duration-200
		{formState === 'error' ? 'opacity-100' : 'opacity-0'}"
		>
			Не ушло. Попробуй ещё раз.
		</p>
	</form>
{/if}
