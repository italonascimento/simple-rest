const express = require('express')
const path = require('path')
const favicon = require('serve-favicon')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const _ = require('lodash')

const mongo = require('mongodb')
const monk = require('monk')
const db = monk('localhost:27017/simple-rest')

const app = express()

// view engine setup
app.set('views', path.join(__dirname, 'dist'))

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(require('stylus').middleware(path.join(__dirname, 'dist')))
app.use(express.static(path.join(__dirname, 'dist')))

app.use((req,res,next) => {
  req.db = db
  next()
})

app.get('/api/:collection/:entity?', (req, res, next) => {
  const method = req.method
  const collection = req.params.collection
  const entity = req.params.entity
  const db = req.db

  const query = {collection: collection, _id: entity}

  const get = db
    .get('entities')
    .find(_.omit(query, query._id ? '' : '_id'), '-collection')

  get.then(results => {
    const result = entity ? results[0] : results

    sendJSON(res, {
      type: collection,
      data: result
    })
  })

  get.catch(err => {
    next(err)
  })
})

app.use('/*', (req, res, next) => {
  res.render('index')
})

app.use(function(req, res, next) {
  const err = new Error('Not Found')
  err.status = 404
  next(err)
})

app.use(function(err, req, res, next) {
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  res.status(err.status || 500)
  res.render('error')
})

function sendJSON(res, obj) {
  res.setHeader('Content-Type', 'application/json')
  res.send(JSON.stringify(obj))
}

module.exports = app
