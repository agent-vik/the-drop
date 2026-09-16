import { copyFor, localeFromParam } from '$lib/i18n';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ params }) => {
	const locale = localeFromParam(params.lang);
	return { locale, copy: copyFor(locale) };
};
