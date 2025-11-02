import { useState } from 'react';
import './AutoStartToggle.css';

interface AutoStartToggleProps {
  enabled: boolean;
  onToggle: (nextEnabled: boolean) => Promise<void> | void;
}

export default function AutoStartToggle({ enabled, onToggle }: AutoStartToggleProps) {
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    if (pending) {
      return;
    }
    try {
      setPending(true);
      await onToggle(!enabled);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      className={enabled ? 'autostart-toggle autostart-toggle--enabled' : 'autostart-toggle'}
      onClick={handleClick}
      disabled={pending}
    >
      <span className="autostart-toggle__label">Auto-start on login</span>
      <span className="autostart-toggle__state" aria-live="polite">
        {enabled ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}
