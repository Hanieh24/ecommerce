function FormMessage({ message, type }) {
  return (
    <p className={`auth-message ${type || ''}`} aria-live="polite">
      {message}
    </p>
  )
}

export default FormMessage
