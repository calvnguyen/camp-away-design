import { useId } from 'react';
import type { ChangeEventHandler } from 'react';
import styles from './Toggle.module.css';

export interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
  id?: string;
  disabled?: boolean;
}

export function Toggle({ label, checked, onChange, id, disabled }: ToggleProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label className={styles.toggle} htmlFor={inputId}>
      <input
        id={inputId}
        type="checkbox"
        role="switch"
        className={styles.input}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span className={styles.track} aria-hidden="true">
        <span className={styles.knob} />
      </span>
      <span className={styles.text}>{label}</span>
    </label>
  );
}
