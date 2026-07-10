/* Hand-maintained signature accent per hero, used for card scrims and glows.
   Stylistic choices (not game data); unknown heroes fall back to the brand. */
const HERO_ACCENTS: Record<string, string> = {
	Quincy: '#b08d57',
	Gwendolin: '#e8563f',
	'Striker Jones': '#7a6f5a',
	'Obyn Greenfoot': '#3f8f4a',
	'Captain Churchill': '#5a6e4e',
	Benjamin: '#37b6a9',
	Ezili: '#7d4bc4',
	'Pat Fusty': '#a4744f',
	Adora: '#c9982e',
	'Admiral Brickell': '#3a6ea8',
	Etienne: '#d98a2b',
	Sauda: '#e07b2a',
	Psi: '#9c64d8',
	Geraldo: '#8a5a36',
	Corvus: '#4a5dbb',
	Rosalia: '#d4556a'
};

export function heroAccent(name: string): string {
	return HERO_ACCENTS[name] ?? 'var(--brand)';
}
