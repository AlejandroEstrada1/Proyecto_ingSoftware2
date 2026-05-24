const express = require("express")
const { asyncHandler } = require("../middleware/asyncHandler")
const { authMiddleware } = require("../middleware/authMiddleware")
const cartController = require("../controllers/cart.controller")

const router = express.Router()

router.use(authMiddleware)

router.get("/", asyncHandler(cartController.getCart))
router.post("/items", asyncHandler(cartController.postItem))
router.put("/items/:id", asyncHandler(cartController.putItem))
router.delete("/items/:id", asyncHandler(cartController.deleteItem))
router.delete("/", asyncHandler(cartController.clearCart))
router.post("/checkout", asyncHandler(cartController.postCheckout))

module.exports = router
