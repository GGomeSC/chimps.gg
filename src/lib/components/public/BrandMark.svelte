<svg viewBox="0 0 48 48" aria-hidden="true">
	<path
		d="M12 14.5C12 8.7 17.2 4 23.5 4S35 8.7 35 14.5c0 1.4-.3 2.8-.9 4 4.7 1.9 7.9 6.2 7.9 11.2C42 37.6 34.1 44 24.5 44S7 37.6 7 29.7c0-4.6 2.7-8.7 6.9-10.8A9.7 9.7 0 0 1 12 14.5Z"
	/>
	<circle cx="18" cy="27" r="3" />
	<circle cx="31" cy="27" r="3" />
	<path class="smile" d="M17 35c4.7 3.3 9.3 3.3 14 0" />
	<path class="leaf" d="M25 6c2-4 6-5 10-4-1 4-4 7-9 7" />
</svg>

<style>
	svg {
		display: block;
		width: 2.5rem;
		height: 2.5rem;
		fill: var(--brand);
		filter: drop-shadow(0 3px 0 var(--brand-shadow));
	}

	circle {
		fill: var(--ink);
	}

	.smile {
		fill: none;
		stroke: var(--ink);
		stroke-width: 3;
		stroke-linecap: round;
	}

	.leaf {
		fill: var(--accent);
	}
</style>
