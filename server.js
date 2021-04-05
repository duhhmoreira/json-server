const fs = require('fs')
const bodyParser = require('body-parser')
const jsonServer = require('json-server')
const jwt = require('jsonwebtoken')

const server = jsonServer.create()
const router = jsonServer.router('./db.json')
const futureSalesDb = JSON.parse(fs.readFileSync('./future-sales.json', 'UTF-8'))

server.use(jsonServer.defaults())
server.use(bodyParser.urlencoded({ extended: true }))
server.use(bodyParser.json())

const SECRET_KEY = 'BOTICARIO2021'
const expiresIn = '2h'

function createToken(payload) {
    return jwt.sign(payload, SECRET_KEY, { expiresIn })
}

function isTokenValid(token) {
    return jwt.verify(token, SECRET_KEY, (err, decode) => decode !== undefined ? true : false)
}

function isAuthenticated({ email, password }) {
    return router.db.getState().users.findIndex(user => user.email === email && user.password === password) !== -1
}

server.post('/auth/login', (req, res) => {
    const { email, password } = req.body
    console.log(req.body)
    if (isAuthenticated({ email, password }) === false) {
        const status = 401
        const message = 'Incorrect email or password'
        res.status(status).json({ status, message })
        return
    }
    const access_token = createToken({ email, password })
    const seller_id = router.db.getState().users.find(user => user.email === email).id
    res.status(200).json({ access_token, seller_id })
})

server.use(/^(?!\/auth).*$/ && /^(?!\/users).*$/, (req, res, next) => {
    if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
        const status = 401
        const message = 'Bad authorization header'
        res.status(status).json({ status, message })
        return
    }
    if (isTokenValid(req.headers.authorization.split(' ')[1])) {
        next()
    } else {
        const status = 401
        const message = 'Error: access_token is not valid'
        res.status(status).json({ status, message })
    }
})

server.use('/sales', (req, res, next) => {
    if (req.method === 'POST') {
        const index = futureSalesDb.sales.findIndex(sale => sale.id == req.body.id)
        if (index !== -1) {
            const sale = {
                "id": req.body.id,
                "totalValue": req.body.totalValue,
                "date": req.body.date,
                "sellerId": req.body.sellerId,
                "totalPercentCashback": futureSalesDb.sales[index].totalPercentCashback,
                "totalValueCashback": ((req.body.totalValue / 100) * futureSalesDb.sales[index].totalPercentCashback).toFixed(2),
                "status": "approved"
            }
            insert(router.db, 'sales', sale)
        } else {
            const sale = {
                "id": req.body.id,
                "totalValue": req.body.totalValue,
                "date": req.body.date,
                "sellerId": req.body.sellerId,
                "totalPercentCashback": '',
                "totalValueCashback": '',
                "status": "reproved"
            }
            insert(router.db, 'sales', sale)
        }
        function insert(db, collection, data) {
            let status
            let message
            const table = db.get(collection)
            if (db.getState().sales.findIndex(sale => sale.id === data.id) === -1) {
                table.push(data).write();
                status = 201
                message = 'Sale created'
            } else {
                status = 409
                message = 'Sale already created'
            }
            res.status(status).json({ status, message })
        }
    } else {
        next()
    }
})

server.use(router)

server.listen(4000, () => {
    console.log('Run Auth API Server')
})