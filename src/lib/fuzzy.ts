/** Case-insensitive substring-or-subsequence match for small client-side lists. */
export function fuzzyMatch(query: string, text: string): boolean {
	const q = query.trim().toLowerCase();
	if (!q) return true;
	const t = text.toLowerCase();
	if (t.includes(q)) return true;
	let matched = 0;
	for (const char of t) {
		if (char === q[matched]) matched += 1;
		if (matched === q.length) return true;
	}
	return false;
}
