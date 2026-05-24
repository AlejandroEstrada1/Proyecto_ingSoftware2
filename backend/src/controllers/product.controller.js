const { listProducts } = require("../services/product.service")

async function list(req, res) {
  res.json(listProducts())
}

module.exports = { list }
