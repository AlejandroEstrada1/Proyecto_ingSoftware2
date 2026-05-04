function CheckoutButton({ disabled, loading, onClick, children }) {
  return (
    <button
      type="button"
      className="btn btn--primary btn--block"
      data-testid="checkout-btn"
      disabled={disabled}
      onClick={onClick}
    >
      {loading ? "…" : children ?? "Simular pago"}
    </button>
  )
}

export default CheckoutButton
