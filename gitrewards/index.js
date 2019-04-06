const config = require('config')
const fs = require('fs')
const path = require('path')
const { GithubApi } = require('./../github')
const messages = require('./messages')

const APP_ID = config.get('Github.app.id')
const APP_PRIVATE_KEY = fs.readFileSync(path.join(process.cwd(), 'keys/git-rewards.pem'))

const githubApi = new GithubApi(APP_ID, APP_PRIVATE_KEY)

module.exports = {
  createBounty ({ issueNumber, repo, installId }) {
    // TODO: call smart contract create bounty

    const message = messages['NEW_BOUNTY']()

    return new Promise((resolve) => {ss
      githubApi
        .commentIssue(installId, repo, issueNumber, message)
        .then(resolve(true))
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