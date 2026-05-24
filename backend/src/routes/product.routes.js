const express = require("express")
const { asyncHandler } = require("../middleware/asyncHandler")
const productController = require("../controllers/product.controller")

const router = express.Router()

router.get("/", asyncHandler(productController.list))

module.exports = router
