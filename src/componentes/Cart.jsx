import { formatMoney } from "../lib/formatMoney.js"
import CartItem from "./CartItem.jsx"

function Cart({
  items,
  subtotal,
  emptyLabel = "Carrito vacío.",
  onQuantityChange,
  onDelete,
  afterItems,
  footer,
}) {
  return (
    <div data-testid="cart">
      {items.length === 0 ? (
        <p className="muted">{emptyLabel}</p>
      ) : (
        <ul className="cart-lines">
          {items.map((line) => (
            <CartItem
              key={line.id}
              line={line}
              onQuantityChange={onQuantityChange}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
      {afterItems}
      <div className="cart-drawer__footer">
        <div className="cart-subtotal">
          <span>Subtotal</span>
          <strong data-testid="cart-total">{formatMoney(subtotal)}</strong>
        </div>
        {footer}
      </div>
    </div>
  )
}

export default Cart
