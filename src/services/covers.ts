import type { EventKind } from '@/types/domain';

const fallbacks: Record<EventKind, string> = {
  party: 'https://images.unsplash.com/photo-1763651961188-17479f1760e9?auto=format&fit=crop&fm=jpg&q=80&w=1600',
  home: 'https://images.unsplash.com/photo-1671116810339-1b58cf241509?auto=format&fit=crop&fm=jpg&q=80&w=1600',
  bar: 'https://images.unsplash.com/photo-1632089039714-3615e5dbca91?auto=format&fit=crop&fm=jpg&q=80&w=1600',
  music: 'https://images.unsplash.com/photo-1450044804117-534ccd6e6a3a?auto=format&fit=crop&fm=jpg&q=80&w=1600',
  games: 'https://images.unsplash.com/photo-1743623786012-51b0b367d8ab?auto=format&fit=crop&fm=jpg&q=80&w=1600',
  social: 'https://images.unsplash.com/photo-1697906038774-31d5a817fef6?auto=format&fit=crop&fm=jpg&q=80&w=1600',
  spontaneous: 'https://images.unsplash.com/photo-1659657317469-5774e5d98b99?auto=format&fit=crop&fm=jpg&q=80&w=1600',
};

export function eventCover(kind: EventKind, coverUrl?: string | null) {
  return coverUrl || fallbacks[kind] || fallbacks.party;
}
