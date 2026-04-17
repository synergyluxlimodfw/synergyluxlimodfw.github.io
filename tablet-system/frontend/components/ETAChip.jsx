import { useState, useEffect } from 'react';

const styles = {
  chip: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    background: 'var(--gold-dim)',
    border: '1px solid var(--border)',
    borderRadius: 20, padding: '5px 13px',
    fontSize: 12, color: 'var(--white)', letterSpacing: '0.3px',
  },
  dot: {
    width: 7, height: 7, borderRadius: '50%',
    background: 'var(--green-accent)',
    boxShadow: '0 0 6px var(--green-accent)',
    flexShrink: 0,
    transition: 'transform 0.3s ease',
  },
};

export default function ETAChip({ etaMinutes }) {
  const [displayed, setDisplayed] = useState(etaMinutes);

  useEffect(() => {
    setDisplayed(etaMinutes);
  }, [etaMinutes]);

  return (
    <span style={styles.chip}>
      <span style={styles.dot} />
      ETA: {displayed} min
    </span>
  );
}
