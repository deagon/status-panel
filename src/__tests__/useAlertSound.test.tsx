import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { StatusLevel, SoundConfig } from '../types';
import { clearSnooze, readUnmuteAt } from '../utils/alertSnooze';
import { createAlertLoop, playStatusSound } from '../utils/soundPlayer';
import { useAlertSound } from '../hooks/useAlertSound';

jest.mock('../utils/soundPlayer', () => ({
  createAlertLoop: jest.fn(() => ({
    start: jest.fn(),
    stop: jest.fn(),
  })),
  playStatusSound: jest.fn(() => Promise.resolve()),
}));

const SOUND: SoundConfig = {
  information: { mode: 'builtin', customUrl: '' },
  warning: { mode: 'builtin', customUrl: '' },
  average: { mode: 'builtin', customUrl: '' },
  high: { mode: 'custom', customUrl: 'https://example.com/high.mp3' },
  disaster: { mode: 'builtin', customUrl: '' },
};

function latestLoop(): { start: jest.Mock; stop: jest.Mock } {
  const results = (createAlertLoop as jest.Mock).mock.results.filter(
    (result: { type: string }) => result.type === 'return'
  );
  return results[results.length - 1].value;
}

function Probe({ status, enabled = true }: { status: StatusLevel; enabled?: boolean }) {
  const api = useAlertSound(status, enabled, 70, SOUND);
  return (
    <div>
      <span data-testid="snoozed">{api.snoozed ? 'yes' : 'no'}</span>
      <button type="button" onClick={() => api.snoozeFor(60_000)}>
        snooze
      </button>
      <button type="button" onClick={() => api.resume()}>
        resume
      </button>
    </div>
  );
}

describe('useAlertSound', () => {
  beforeEach(() => {
    (createAlertLoop as jest.Mock).mockClear();
    (playStatusSound as jest.Mock).mockClear();
    clearSnooze();
    localStorage.clear();
  });

  it('starts a loop immediately while Warning or higher', () => {
    const { rerender } = render(<Probe status="warning" />);
    expect(latestLoop().start).toHaveBeenCalledWith('warning', 70, SOUND.warning);

    latestLoop().start.mockClear();
    rerender(<Probe status="disaster" />);
    expect(latestLoop().start).toHaveBeenCalledWith('disaster', 70, SOUND.disaster);

    latestLoop().start.mockClear();
    rerender(<Probe status="high" />);
    expect(latestLoop().start).toHaveBeenCalledWith('high', 70, SOUND.high);
  });

  it('stops the loop when the status clears and does not one-shot OK', () => {
    const { rerender } = render(<Probe status="warning" />);
    const loop = latestLoop();
    loop.start.mockClear();
    loop.stop.mockClear();

    rerender(<Probe status="ok" />);

    expect(loop.stop).toHaveBeenCalled();
    expect(loop.start).not.toHaveBeenCalled();
    expect(playStatusSound).not.toHaveBeenCalled();
  });

  it('plays Information once on transition and does not loop it', () => {
    const { rerender } = render(<Probe status="ok" />);
    expect(latestLoop().start).not.toHaveBeenCalled();

    rerender(<Probe status="information" />);

    expect(playStatusSound).toHaveBeenCalledWith('information', 70, SOUND.information);
    expect(latestLoop().start).not.toHaveBeenCalled();
  });

  it('does not start a loop when sound is disabled', () => {
    render(<Probe status="disaster" enabled={false} />);
    expect(latestLoop().start).not.toHaveBeenCalled();
  });

  it('snoozes into localStorage and stays quiet until resume', () => {
    render(<Probe status="warning" />);
    const loop = latestLoop();
    loop.start.mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'snooze' }));

    expect(screen.getByTestId('snoozed')).toHaveTextContent('yes');
    expect(readUnmuteAt()).toBeGreaterThan(Date.now());
    expect(loop.stop).toHaveBeenCalled();
    expect(loop.start).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'resume' }));

    expect(screen.getByTestId('snoozed')).toHaveTextContent('no');
    expect(readUnmuteAt()).toBeNull();
    expect(loop.start).toHaveBeenCalledWith('warning', 70, SOUND.warning);
  });

  it('resumes the loop when the snooze deadline passes and the panel is still alerting', () => {
    jest.useFakeTimers();
    try {
      render(<Probe status="disaster" />);
      const loop = latestLoop();

      fireEvent.click(screen.getByRole('button', { name: 'snooze' }));
      loop.start.mockClear();

      act(() => {
        jest.advanceTimersByTime(60_000);
      });

      expect(screen.getByTestId('snoozed')).toHaveTextContent('no');
      expect(loop.start).toHaveBeenCalledWith('disaster', 70, SOUND.disaster);
    } finally {
      jest.useRealTimers();
    }
  });

  it('stays quiet after expiry when the status is already OK', () => {
    jest.useFakeTimers();
    try {
      const { rerender } = render(<Probe status="warning" />);
      fireEvent.click(screen.getByRole('button', { name: 'snooze' }));
      rerender(<Probe status="ok" />);
      const loop = latestLoop();
      loop.start.mockClear();

      act(() => {
        jest.advanceTimersByTime(60_000);
      });

      expect(screen.getByTestId('snoozed')).toHaveTextContent('no');
      expect(loop.start).not.toHaveBeenCalled();
      expect(playStatusSound).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('keeps a snooze across remount', () => {
    const first = render(<Probe status="warning" />);
    fireEvent.click(screen.getByRole('button', { name: 'snooze' }));
    first.unmount();

    render(<Probe status="warning" />);

    expect(screen.getByTestId('snoozed')).toHaveTextContent('yes');
    expect(latestLoop().start).not.toHaveBeenCalled();
  });
});
