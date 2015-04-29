var jwt = require('jsonwebtoken')
  , jwtSecret = require('./lib/jwt').jwtSecret
  , jwtAuthHeaderPrefix = require('./lib/jwt').jwtAuthHeaderPrefix
  , Joi = require('joi')
  , debug = require('debug')('jwtAuth:controllers:authentication')
  , UnauthorizedError = require('./lib/errors/UnauthorizedError')


/**
 * An Express.js middleware that ensures that a has supplied an authorization header.
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */ 
exports.ensureAuthorizationHeader = function(req, res, next){ 
  if (!(req.headers && req.headers.authorization)){
    return res.status(401).send(new UnauthorizedError())
  }
  var auth = req.headers.authorization.split(' ') 

  if (auth.length === 1){
    return res.status(401).send(
      new UnauthorizedError('Invalid Authorization header. No credentials provided.'))
  }

  if(auth.length > 2){
    return res.status(401).send(new UnauthorizedError('Invalid Authorization header. Credentials string '
                  + 'should not contain spaces.'))
  }

  req.auth = auth
  next()
}


/**
 * An Express.js middleware validates a JWT token.
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */ 
exports.validateJWTAuth = function(req, res, next){
  var auth = req.auth

  // exit early if auth is not JWT
  if (auth[0].toLowerCase() !== jwtAuthHeaderPrefix){
    debug('Not JWT auth')
    return next()
  }

  var jwtToken = auth[1]
  jwt.verify(jwtToken, jwtSecret, function(err, decodedUser) {
    if (err) { 
      debug('Error %j',err)
      return res.status(401).send(err)
    }
    debug('decoded token: %j', decodedUser)
    req.user = decodedUser
    next()
  })
}


/**
 * An Express.js middleware that ensures that a has supplied an authorization header.
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */ 
exports.ensureAuthorized = function(req, res, next){ 
  if (!req.user){
    debug('req.user is not defined!')
    return res.status(401).send(new UnauthorizedError())
  }
  next()
}


/**
 * The grouped middleware need to enforce jwt Auth
 */ 
exports.jwtAuthProtected  = [ exports.ensureAuthorizationHeader
                            , exports.validateJWTAuth
                            , exports.ensureAuthorized
                            ]
