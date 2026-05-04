const { parseRegister, parseLogin } = require("../validators/auth.validator")
const { registerUser, loginUser, signToken } = require("../services/auth.service")

async function register(req, res) {
  const body = parseRegister(req.body)
  const user = registerUser(body)
  const token = signToken(user)
  res.status(201).json({ user, token })
}

async function login(req, res) {
  const body = parseLogin(req.body)
  const user = loginUser(body)
  const token = signToken(user)
  res.json({ user, token })
}

module.exports = { register, login }
