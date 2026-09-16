import type { Locale, RoomId } from './rooms';

export type Copy = {
	museum: string;
	langName: string;
	otherLang: Locale;
	continue: string;
	release: string;
	retry: string;
	stopwatch: string;
	startMeasure: string;
	aimHint: string;
	drawCurve: string;
	toMoon: string;
	startAgain: string;
	legendDoor: string;
	methodDoor: string;
	invalid: string;
	tooEarly: string;
	unrecorded: string;
	otherPath: string;
	heChose: string;
	laidFlat: string;
	rooms: Record<RoomId, { title: string; line: string }>;
	archive: { fact: string; detail: string }[];
	reasoning: { premise: string; drag: string; heavier: string; qualifier: string };
	exitLegend: { year: string; line: string }[];
	exitMethod: { year: string; line: string }[];
};

const en: Copy = {
	museum: 'The Drop',
	langName: '中文',
	otherLang: 'zh',
	continue: 'Continue',
	release: 'Release',
	retry: 'Again',
	stopwatch: 'Watch the landing. Press when it hits.',
	startMeasure: 'Begin the official measurement',
	aimHint: 'Watch one mark. Tap the spout when the ball reaches it.',
	drawCurve: 'The data are enough · draw the curve',
	toMoon: 'See it on another world',
	startAgain: 'Start again',
	legendDoor: 'How the story lived',
	methodDoor: 'How the method happened',
	invalid: 'This trial does not count',
	tooEarly: 'The ball has not reached a mark yet',
	unrecorded: 'Not recorded',
	otherPath: 'The other corridor',
	heChose: 'He did not choose the tower.',
	laidFlat: 'So he did something else — he laid the problem flat.',
	rooms: {
		legend: { title: 'The legend', line: 'This is the story you have heard.' },
		cracks: { title: 'The cracks', line: 'No one living then saw it happen.' },
		reasoning: { title: 'The reasoning', line: 'He did not even need a laboratory — logic was enough.' },
		echo: { title: 'The echo', line: 'Free fall is too fast.' },
		incline: { title: 'The plane', line: 'Free fall is too fast. He laid the problem flat.' },
		vacuum: { title: 'The vacuum', line: 'Three centuries later, on another world — the law still holds.' },
		exit: { title: 'Two corridors', line: 'Start again.' }
	},
	archive: [
		{ fact: '1654 · the only source · the author was not yet born', detail: 'Viviani wrote 12–15 years after Galileo died. Published 1717.' },
		{ fact: 'Complete works · leaning tower: none', detail: 'Galileo never mentions the Pisa drop in his own books.' },
		{ fact: '1590 · no such record', detail: 'A year of science. The tower drop is not in it.' },
		{ fact: '1586 · Delft · published', detail: 'Stevin dropped lead balls from a church tower — and printed it.' },
		{ fact: '1640s · Bologna · published', detail: 'Riccioli timed drops from the Asinelli tower with a pendulum.' }
	],
	reasoning: {
		premise: 'Suppose Aristotle is right: the heavy one falls faster.',
		drag: 'Join them and the light one drags.',
		heavier: 'Join them and the whole is heavier, so faster.',
		qualifier: 'If Aristotle were right, contradiction follows — so he cannot be.'
	},
	exitLegend: [
		{ year: '~1590', line: 'Someone says it happened' },
		{ year: '1654', line: 'The biography is begun' },
		{ year: '1717', line: 'It is printed' },
		{ year: '300 years', line: 'Citation copies citation' },
		{ year: 'today', line: 'Still told' }
	],
	exitMethod: [
		{ year: '1586', line: 'Stevin · published' },
		{ year: '~1603', line: 'The inclined plane' },
		{ year: '1638', line: 'Two New Sciences' },
		{ year: '1640s', line: 'Riccioli · published' },
		{ year: '1971', line: 'Apollo 15' },
		{ year: 'today', line: 'The law still holds' }
	]
};

const zh: Copy = {
	museum: 'The Drop',
	langName: 'EN',
	otherLang: 'en',
	continue: '继续',
	release: '松手，释放',
	retry: '再来一次',
	stopwatch: '盯住落地点，球落地瞬间按秒表',
	startMeasure: '开始正式测量',
	aimHint: '盯住一条标记线，球到线瞬间点出水口',
	drawCurve: '数据已齐 · 画出曲线',
	toMoon: '去看看它在另一个天体上',
	startAgain: '从头开始',
	legendDoor: '传说怎么活下来',
	methodDoor: '方法实际走过的路',
	invalid: '这次测量无效',
	tooEarly: '球还没到标记线',
	unrecorded: '本次未记录',
	otherPath: '另一条走廊',
	heChose: '他没有选择塔。',
	laidFlat: '于是他做了另一件事——把问题放平。',
	rooms: {
		legend: { title: '传说', line: '这是你听过的故事。' },
		cracks: { title: '裂缝', line: '没有任何同时代人看到这件事发生。' },
		reasoning: { title: '推理', line: '他甚至不需要实验室——逻辑就够了。' },
		echo: { title: '回响', line: '自由落体太快了。' },
		incline: { title: '斜面', line: '自由落体太快了。他把它放平。' },
		vacuum: { title: '真空', line: '三百年后，在另一个天体上——规律依然成立。' },
		exit: { title: '双走廊', line: '从头开始。' }
	},
	archive: [
		{ fact: '1654 · 唯一来源 · 作者当时没出生', detail: '维维亚尼在伽利略去世 12–15 年后动笔，1717 年才出版。' },
		{ fact: '全部著作 · 斜塔：无', detail: '伽利略自己的书里从未提起比萨斜塔落体。' },
		{ fact: '1590 · 无此记载', detail: '那年的科学事件在，斜塔不在。' },
		{ fact: '1586 · 代尔夫特 · 已出版', detail: 'Stevin 从教堂塔上扔下铅球，并且印成了书。' },
		{ fact: '1640s · 博洛尼亚 · 已出版', detail: 'Riccioli 用摆钟在 Asinelli 塔上计时。' }
	],
	reasoning: {
		premise: '假如亚里士多德是对的：重的比轻的快。',
		drag: '连起来，轻的会拖慢。',
		heavier: '连起来更重，所以该更快。',
		qualifier: '如果亚里士多德是对的，就会出现矛盾——所以亚里士多德必定是错的。'
	},
	exitLegend: [
		{ year: '~1590', line: '有人声称发生过' },
		{ year: '1654', line: '动笔' },
		{ year: '1717', line: '出版' },
		{ year: '三百年', line: '互相引用' },
		{ year: '至今', line: '仍在被讲述' }
	],
	exitMethod: [
		{ year: '1586', line: 'Stevin · 已出版' },
		{ year: '~1603', line: '斜面' },
		{ year: '1638', line: '《两门新科学》' },
		{ year: '1640s', line: 'Riccioli · 已出版' },
		{ year: '1971', line: '阿波罗 15' },
		{ year: '今天', line: '规律仍在' }
	]
};

export function copyFor(locale: Locale): Copy {
	return locale === 'zh' ? zh : en;
}

export function localeFromParam(lang: string | undefined): Locale {
	return lang === 'zh' ? 'zh' : 'en';
}
