import type { Bindings } from '../types';
import type { RealtimeEnvelope } from '../realtime';

function hub(env: Bindings) {
  const id = env.REALTIME.idFromName('vibe-main');
  return env.REALTIME.get(id);
}

async function publish(env: Bindings, body: { userIds?: string[]; broadcast?: boolean; event: RealtimeEnvelope }) {
  try {
    await hub(env).fetch('https://realtime.internal/publish', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (error) {
    console.warn('Realtime publish failed', error);
  }
}

export const realtime = {
  all(env: Bindings, event: RealtimeEnvelope) {
    return publish(env, { broadcast: true, event });
  },
  users(env: Bindings, userIds: Array<string | null | undefined>, event: RealtimeEnvelope) {
    const unique = [...new Set(userIds.filter((x): x is string => !!x))];
    if (!unique.length) return Promise.resolve();
    return publish(env, { userIds: unique, event });
  }
};
