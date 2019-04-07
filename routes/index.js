const config = require('config')
const express = require('express')
const passport = require('passport')
const { Bifrost, Bounty, Stellar, StellarAsset } = require('practice')
const { createBounty, updateBounty, commentIssue } = require('./../gitrewards')
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
    const { number, body, user } = pull_request
    data = { ...data, pr: { number, body, user } }

    updateBounty(data).then(res.send('OK'))

  } else {
    res.send('OK')
  }
})

router.get('/bounty/:issueId/claim', (req, res, next) => {
  if (req.session && req.session.passport) {
    const user = req.session.passport.user
    const issueId = req.params.issueId
    const assetIssuer = "GADYDBUGM7VYJTWVQZUH7LJW6D2IQ6KJDEZ5ZASLZAHYSSNVZKDYXXVI"
    const assetCode = "PHP"

    Promise
      .all([
        Bounty.query(issueId),
        Stellar.query(issueId),
        StellarAsset.query(issueId, assetIssuer, assetCode)
      ])
      .then(values => {
        console.log(values)
        const metadata = JSON.parse(values[0].metadata)
        const valid = user.username == values[0].username
        res.render('claim', {
          issueId: issueId,
          avatarUrl: user._json.avatar_url,
          bounty: values,
          metadata,
          valid
        })
      })
    // res.render('claim')
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

router.get('/bounty/:issueId/success-claim', (req, res) => {
  res.render('success', req.query)
})


router.post('/bounty/:issueId/claim/eth', (req, res) => {
  const { issueId } = req.params
  const { username } = req.session.passport.user
  const { ethAddress } = req.body

  Bounty.claimReward(issueId, username, ethAddress)
    .then(txHash => {
      console.log(txHash)
      res.redirect(`/bounty/${issueId}/success-claim?txHash=${txHash}&currency=ETH`)
    })
})

router.post('/bounty/:issueId/claim/stellar', (req, res) => {
  const { issueId } = req.params
  const { stellarAddress } = req.body

  Stellar.claimReward(issueId, stellarAddress)
    .then(txHash => {
      console.log(txHash)
      res.redirect(`/bounty/${issueId}/success-claim?txHash=${txHash}&currency=XLM`)
    }).catch(error => {
      console.log(error)
      res.redirect(`/bounty/${issueId}/success-claim`)
    })
})

router.post('/bounty/:issueId/claim/stellar-asset', (req, res) => {
  const { issueId } = req.params
  const { stellarAddress } = req.body
  const assetIssuer = "GADYDBUGM7VYJTWVQZUH7LJW6D2IQ6KJDEZ5ZASLZAHYSSNVZKDYXXVI"
  const assetCode = "PHP"

  StellarAsset.claimReward(issueId, stellarAddress, assetIssuer, assetCode)
    .then(txHash => {
      console.log(txHash)
      res.redirect(`/bounty/${issueId}/success-claim?txHash=${txHash}&currency=PHP`)
    }).catch(error => {
      console.log(error)
      res.redirect(`/bounty/${issueId}/success-claim`)
    })
})

router.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect(req.query.next)
  }
)

router.post('/bifrost/', (req, res) => {
  const { amount, from, metadata } = Bifrost.ethereumCallback(req.body)
  const message = "Account `" + from + "` deposited `" + amount + " ETH`"
  const data = { installId: metadata.install_id, issueNumber: metadata.issue_number, repo: metadata.repo, message }

  commentIssue(data).then(res.send('OK'))
})

router.post('/stellar/', (req, res) => {
  const { from, amount, url, assetCode } = Bifrost.stellarCallback(req.body)
  const currency = (assetCode) ? assetCode : "XLM"
  const message = "Account `" + from + "` deposited `" + amount + " " + currency + "` "

  Bounty.metadata(url).then(metadata => {
    const meta = JSON.parse(metadata)
    const data = { ...meta, message }

    return commentIssue(data)
  }).then(res.send('OK'))
})

router.get('/logout', (req, res) => {
  req.session.destroy()
  req.logout()

  res.redirect('/')
})

router.get('/', (req, res) => {
  res.render('index', { title: 'Express' })
})

module.exports = router
