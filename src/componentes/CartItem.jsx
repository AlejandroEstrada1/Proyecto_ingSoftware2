import { formatMoney } from "../lib/formatMoney.js"

/**
 * @param {{ line: { id: number, nombre: string, unitPrice: number, quantity: number, stockAvailable: number, lineTotal: number }, onQuantityChange: (lineId: number, quantity: number) => void, onDelete: (lineId: number) => void }} props
 */
function CartItem({ line, onQuantityChange, onDelete }) {
  return (
    <li className="cart-line" data-testid="cart-item">
      <div>
        <strong>{line.nombre}</strong>
        <div className="muted small">
          {formatMoney(line.unitPrice)} × {line.quantity}
        </div>
      </div>
      <div className="cart-line__controls">
        <div className="qty-stepper" role="group" aria-label="Cantidad">
          <button
            type="button"
            className="qty-stepper__btn"
            data-testid="qty-minus"
            disabled={line.quantity <= 1}
            onClick={() => onQuantityChange(line.id, line.quantity - 1)}
          >
            −
          </button>
          <span className="qty-stepper__val">{line.quantity}</span>
          <button
            type="button"
            className="qty-stepper__btn"
            data-testid="qty-plus"
            disabled={line.quantity >= line.stockAvailable}
            onClick={() => onQuantityChange(line.id, line.quantity + 1)}
          >
            +
          </button>
        </div>
        <button
          type="button"
          className="link-btn danger"
          data-testid="delete-item"
          onClick={() => onDelete(line.id)}
        >
          Quitar
        </button>
      </div>
      <div className="cart-line__total">{formatMoney(line.lineTotal)}</div>
    </li>
  )
}

export default CartItem
