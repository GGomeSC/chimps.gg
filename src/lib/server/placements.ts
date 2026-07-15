// Shared transport-level validation for the placement JSON endpoints.

export const PATH_PATTERN = /^[0-5]-[0-5]-[0-5]$/;

export function isNormalized(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}
