const {
  parseAddCartItem,
  parseUpdateCartItem,
  parseCartItemIdParam,
  parseCheckout,
} = require("../validators/cart.validator")
const cartService = require("../services/cart.service")

async function getCart(req, res) {
  const cart = cartService.getCart(req.userId)
  res.json(cart)
}

async function postItem(req, res) {
  const input = parseAddCartItem(req.body)
  const cart = cartService.addCartItem(req.userId, input)
  res.status(201).json(cart)
}

async function putItem(req, res) {
  const id = parseCartItemIdParam(req.params.id)
  const input = parseUpdateCartItem(req.body)
  const cart = cartService.updateCartItem(req.userId, id, input)
  res.json(cart)
}

async function deleteItem(req, res) {
  const id = parseCartItemIdParam(req.params.id)
  const cart = cartService.deleteCartItem(req.userId, id)
  res.json(cart)
}

async function clearCart(req, res) {
  const cart = cartService.clearCart(req.userId)
  res.json(cart)
}

async function postCheckout(req, res) {
  const input = parseCheckout(req.body)
  const result = cartService.checkout(req.userId, input.payment)
  res.status(201).json({
    mensaje: "Pago aprobado (simulado)",
    orderId: result.orderId,
    total: result.total,
    payment: result.payment,
  })
}

module.exports = {
  getCart,
  postItem,
  putItem,
  deleteItem,
  clearCart,
  postCheckout,
}
