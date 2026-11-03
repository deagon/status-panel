import { resolveAlertSound, BUNDLED_DISASTER_ALERT_URL } from '../utils/soundPlayer';

describe('resolveAlertSound', () => {
  it('plays the bundled firetruck file for Disaster built-in', () => {
    expect(resolveAlertSound('disaster', { mode: 'builtin', customUrl: '' })).toEqual({
      kind: 'file',
      url: BUNDLED_DISASTER_ALERT_URL,
    });
  });

  it('maps the unserved plugin static path to the bundled file', () => {
    expect(
      resolveAlertSound('disaster', {
        mode: 'custom',
        customUrl: '/public/plugins/toropovav-status-panel/alert-disaster.mp3',
      })
    ).toEqual({ kind: 'file', url: BUNDLED_DISASTER_ALERT_URL });
  });

  it('keeps a real custom URL and leaves other built-ins as tones', () => {
    expect(resolveAlertSound('disaster', { mode: 'custom', customUrl: 'https://example.com/other.mp3' })).toEqual({
      kind: 'file',
      url: 'https://example.com/other.mp3',
    });
    expect(resolveAlertSound('warning', { mode: 'builtin', customUrl: '' })).toEqual({ kind: 'tone' });
    expect(resolveAlertSound('high', { mode: 'off', customUrl: '' })).toEqual({ kind: 'off' });
  });
});
