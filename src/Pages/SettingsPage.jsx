import { useEffect, useState } from 'react';

/**
 * @param {object} props
 * @param {import('../Transmission').default} props.transmission
 * @param {Record<string, any>} props.sessionData
 * @param {(data: Record<string, any>) => void} props.onSessionUpdated
 */
export function SettingsPage ({ transmission, sessionData, onSessionUpdated }) {
  const [ form, setForm ] = useState({
    speedLimitDownEnabled: false,
    speedLimitDown: 0,
    speedLimitUpEnabled: false,
    speedLimitUp: 0,
    altSpeedEnabled: false,
    altSpeedDown: 0,
    altSpeedUp: 0,
  });
  const [ saving, setSaving ] = useState(false);
  const [ status, setStatus ] = useState("");

  useEffect(() => {
    setForm({
      speedLimitDownEnabled: !!sessionData['speed-limit-down-enabled'],
      speedLimitDown: Number(sessionData['speed-limit-down'] || 0),
      speedLimitUpEnabled: !!sessionData['speed-limit-up-enabled'],
      speedLimitUp: Number(sessionData['speed-limit-up'] || 0),
      altSpeedEnabled: !!sessionData['alt-speed-enabled'],
      altSpeedDown: Number(sessionData['alt-speed-down'] || 0),
      altSpeedUp: Number(sessionData['alt-speed-up'] || 0),
    });
  }, [sessionData]);

  /**
   * @param {number} value
   */
  function toLimit(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.floor(value));
  }

  /**
   * @param {import('react').FormEvent<HTMLFormElement>} event
   */
  async function handleSave (event) {
    event.preventDefault();
    setSaving(true);
    setStatus("");

    const values = {
      'speed-limit-down-enabled': form.speedLimitDownEnabled,
      'speed-limit-down': toLimit(form.speedLimitDown),
      'speed-limit-up-enabled': form.speedLimitUpEnabled,
      'speed-limit-up': toLimit(form.speedLimitUp),
      'alt-speed-enabled': form.altSpeedEnabled,
      'alt-speed-down': toLimit(form.altSpeedDown),
      'alt-speed-up': toLimit(form.altSpeedUp),
    };

    try {
      await transmission.setSessionFields(values);
      const updatedSession = await transmission.getSession();
      onSessionUpdated(updatedSession);
      setStatus('Saved');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save settings';
      setStatus(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="SettingsPage">
      <h1>Settings</h1>
      <p className="hint">Bandwidth values are in KB/s.</p>

      <form className="SettingsPage-Form" onSubmit={handleSave}>
        <section className="SettingsPage-Section">
          <h2>Bandwidth Limits</h2>
          <label className="SettingsPage-Field SettingsPage-Field--checkbox">
            <input
              type="checkbox"
              checked={form.speedLimitDownEnabled}
              onChange={e => setForm(f => ({ ...f, speedLimitDownEnabled: e.target.checked }))}
            />
            Enable download limit
          </label>
          <label className="SettingsPage-Field">
            <span>Download limit (KB/s)</span>
            <input
              type="number"
              min={0}
              step={1}
              value={form.speedLimitDown}
              onChange={e => setForm(f => ({ ...f, speedLimitDown: Number(e.target.value) }))}
            />
          </label>
          <label className="SettingsPage-Field SettingsPage-Field--checkbox">
            <input
              type="checkbox"
              checked={form.speedLimitUpEnabled}
              onChange={e => setForm(f => ({ ...f, speedLimitUpEnabled: e.target.checked }))}
            />
            Enable upload limit
          </label>
          <label className="SettingsPage-Field">
            <span>Upload limit (KB/s)</span>
            <input
              type="number"
              min={0}
              step={1}
              value={form.speedLimitUp}
              onChange={e => setForm(f => ({ ...f, speedLimitUp: Number(e.target.value) }))}
            />
          </label>
        </section>

        <section className="SettingsPage-Section">
          <h2>Alternative Speed Limits</h2>
          <label className="SettingsPage-Field SettingsPage-Field--checkbox">
            <input
              type="checkbox"
              checked={form.altSpeedEnabled}
              onChange={e => setForm(f => ({ ...f, altSpeedEnabled: e.target.checked }))}
            />
            Enable alternative speed mode
          </label>
          <label className="SettingsPage-Field">
            <span>Alternative download limit (KB/s)</span>
            <input
              type="number"
              min={0}
              step={1}
              value={form.altSpeedDown}
              onChange={e => setForm(f => ({ ...f, altSpeedDown: Number(e.target.value) }))}
            />
          </label>
          <label className="SettingsPage-Field">
            <span>Alternative upload limit (KB/s)</span>
            <input
              type="number"
              min={0}
              step={1}
              value={form.altSpeedUp}
              onChange={e => setForm(f => ({ ...f, altSpeedUp: Number(e.target.value) }))}
            />
          </label>
        </section>

        <div className="SettingsPage-Actions">
          <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>
          {status && <span className="hint">{status}</span>}
        </div>
      </form>
    </div>
  );
}
