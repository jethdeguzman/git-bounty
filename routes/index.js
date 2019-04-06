const config = require('config')
const express = require('express')
const passport = require('passport')
const { createBounty, updateBounty } = require('./../gitrewards')
const router = express.Router()
const GitHubStrategy = require('passport-github').Strategy

const parseRepoFullName = (fullName) => {
  const meta = fullName.split('/')

  return {
    owner: meta[0],
    name: meta[1]
  }
}

router.post('/webhook/github', (req, res) => {
  const { action, issue, pull_request, repository, installation } = req.body
  let data = {}

  if (repository && installation) {
    data = {
      repo: parseRepoFullName(repository.full_name),
      installId: installation.id
    }
  }

  if (issue && action == "opened") {
    data = { ...data, issue }

    createBounty(data).then(res.send('OK'))

  } else if (pull_request && action == "closed") {
    const { number, body } = pull_request
    data = { ...data, pr: { number, body } }

    updateBounty(data).then(res.send('OK'))

  } else {
    res.send('OK')
  }
})

router.get('/rewards/:address/claim', (req, res, next) => {
  if (req.session && req.session.passport) {
    const user = req.session.passport.user
    res.render('claim', { username: user.username, avatarUrl: user._json.avatar_url })

  } else {
    const oauthConfig = config.get('Github.oauth')
    const nextUrl = `http://localhost:3000${req.originalUrl}`

    passport.use(new GitHubStrategy({
      clientID: oauthConfig.id,
      clientSecret: oauthConfig.secret,
      callbackURL: `${oauthConfig.callbackUrl}?next=${nextUrl}`
    }, (accessToken, refreshToken, profile, cb) => {
      cb(null, profile)
    }))

    return passport.authenticate('github')(req, res, next)
  }
})

router.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect(req.query.next)
  }
)

router.get('/logout', (req, res, next) => {
  req.session.destroy()
  req.logout()

  res.redirect('/')
})

router.get('/', (req, res) => {
  res.render('index', { title: 'Express' })
})

module.exports = router
