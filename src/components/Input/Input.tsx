import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  /** Helper text shown below the field when there is no error. */
  helperText?: string;
  /** Error message. When set, the field is marked invalid and styled as an error. */
  error?: string;
  id?: string;
}

export function Input({
  label,
  helperText,
  error,
  id,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedById = `${inputId}-description`;
  const description = error ?? helperText;
  const isInvalid = Boolean(error);

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        className={`${styles.input} ${isInvalid ? styles.inputError : ''}`.trim()}
        aria-invalid={isInvalid || undefined}
        aria-describedby={description ? describedById : undefined}
        {...rest}
      />
      {description ? (
        <p
          id={describedById}
          className={isInvalid ? styles.error : styles.helper}
          role={isInvalid ? 'alert' : undefined}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
