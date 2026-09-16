export type RoomId = 'legend' | 'cracks' | 'reasoning' | 'echo' | 'incline' | 'vacuum' | 'exit';
export type Locale = 'en' | 'zh';

export type Room = {
	id: RoomId;
	path: string;
	gallery: '1' | '2' | '3' | '4.1' | '4.2' | '5' | 'exit';
	background: string;
};

export const rooms: Room[] = [
	{ id: 'legend', path: '', gallery: '1', background: '#211a12' },
	{ id: 'cracks', path: 'cracks', gallery: '2', background: '#14100a' },
	{ id: 'reasoning', path: 'reasoning', gallery: '3', background: '#131210' },
	{ id: 'echo', path: 'echo', gallery: '4.1', background: '#1f160d' },
	{ id: 'incline', path: 'incline', gallery: '4.2', background: '#1f160d' },
	{ id: 'vacuum', path: 'vacuum', gallery: '5', background: '#050508' },
	{ id: 'exit', path: 'exit', gallery: 'exit', background: '#050508' }
];

export function roomPath(locale: Locale, path: string): string {
	const prefix = locale === 'zh' ? '/zh' : '';
	if (!path) return prefix || '/';
	return `${prefix}/${path}`;
}

export function roomByPath(segment: string | undefined): Room {
	const key = segment ?? '';
	return rooms.find((room) => room.path === key) ?? rooms[0];
}

export function nextRoom(id: RoomId): Room | undefined {
	const index = rooms.findIndex((room) => room.id === id);
	return rooms[index + 1];
}
