<script lang="ts">
	let { data, form } = $props();

	const message = $derived(
		data.error === 'invalid_link'
			? 'The sign-in link is invalid or expired.'
			: data.error === 'not_allowed'
				? 'That account is not allowed to access the studio.'
				: null
	);
</script>

<svelte:head>
	<title>Studio login · chimps.gg</title>
</svelte:head>

<section class="login">
	<h1>Studio login</h1>

	{#if message}
		<p class="error">{message}</p>
	{/if}
	{#if form?.error}
		<p class="error">{form.error}</p>
	{/if}
	{#if form?.sent}
		<p class="ok">Check {form.email} for the sign-in link.</p>
	{/if}

	<form method="POST">
		<input type="hidden" name="redirectTo" value={form?.redirectTo ?? data.redirectTo} />
		<label>
			Email
			<input
				name="email"
				type="email"
				autocomplete="email"
				required
				value={form?.email ?? ''}
			/>
		</label>
		<button type="submit">Send magic link</button>
	</form>
</section>

<style>
	.login {
		max-width: 28rem;
	}

	form {
		display: grid;
		gap: 0.75rem;
	}

	label {
		display: grid;
		gap: 0.35rem;
		font-weight: 600;
	}

	input {
		font: inherit;
		padding: 0.45rem 0.55rem;
		border: 1px solid var(--border-strong);
		border-radius: 4px;
	}

	button {
		width: fit-content;
		font: inherit;
		padding: 0.45rem 0.75rem;
	}

	.error {
		color: var(--error);
	}

	.ok {
		color: var(--ok);
	}
</style>
