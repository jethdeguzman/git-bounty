const config = require('config')
const fs = require('fs')
const path = require('path')
const { GithubApi } = require('./../github')
const { Bounty, Stellar, StellarAddress, Bifrost } = require('practice')
const messages = require('./messages')

const APP_ID = config.get('Github.app.id')
const APP_PRIVATE_KEY = fs.readFileSync(path.join(process.cwd(), 'keys/git-rewards.pem'))

const githubApi = new GithubApi(APP_ID, APP_PRIVATE_KEY)

module.exports = {
  createBounty ({ issue, repo, installId }) {
    return new Promise((resolve) => {
      const meta = JSON.stringify({ avatarUrl: issue.user.avatar_url, installId, repo, issueNumber: issue.number })

      Bounty.create(issue.id.toString(), meta).then(address => {
        const eth = { address }
        const stellar = { address: Stellar.address(), memo: issue.id.toString() }

        return { eth, stellar }
      }).then(({ eth, stellar }) => {
        const message = messages['NEW_BOUNTY'](eth, stellar)
        const meta = {
          issueNumber: issue.number,
          installId,
          repo
        }

        console.log()
        console.log(eth.address)
        return Promise.all([
          githubApi.commentIssue(installId, repo, issue.number, message),
          Bifrost.ethereumWebhook(eth.address, meta)
        ])
      }).then(resolve(true))
    })
  },

  updateBounty ({ pr, repo, installId }) {
    // TODO call smart contract to set bounty username

    return new Promise((resolve) => {
      githubApi
        .getTaggedIssueFromPull(installId, repo, pr)
        .then(issueNumber => {
          if (issueNumber) {
            const message = messages['BOUNTY_READY_TO_CLAIM']()

            githubApi
              .commentIssue(installId, repo, issueNumber, message)
              .then(resolve(issueNumber))
          }
          resolve(issueNumber)
        })
    })
  },

  commentIssue ({ installId, repo, issueNumber, message }) {
    return new Promise((resolve) => {
      githubApi
        .commentIssue(installId, repo, issueNumber, message)
        .then(resolve(true))
    })

  }
}