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
      const url = `https://github.com/${repo.owner}/${repo.name}/issues/${issue.number}`
      const meta = JSON.stringify({ avatarUrl: issue.user.avatar_url })

      console.log()
      Bounty.create(url, meta).then(address => {
        const eth = { address }
        const stellar = { address: Stellar.address(), memo: url }

        return { eth, stellar }
      }).then(({ eth, stellar }) => {
        const message = messages['NEW_BOUNTY'](eth, stellar)

        return Promise.all(
          githubApi.commentIssue(installId, repo, issue.number, message),
          Bifrost.ethereumWebhook(eth.address, {})
        )
      }).then(([g, b]) => { resolve(true) })
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
  }
}