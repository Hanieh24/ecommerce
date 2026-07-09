function AuthField({
  id,
  label,
  name,
  type = 'text',
  value,
  onChange,
  autoComplete,
  maxLength,
  placeholder,
  required = true,
  className = '',
}) {
  return (
    <label className={className} htmlFor={id}>
      {label}
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
      />
    </label>
  );
}

export default AuthField;
