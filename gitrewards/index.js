const axios = require('axios')
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

      Bounty.create(issue.id.toString(), meta)
        .then(address => {
          const eth = { address }
          const stellar = { address: Stellar.address(), memo: issue.id.toString() }

          return { eth, stellar }
        })
        .then(({ eth, stellar }) => {
          const message = messages['NEW_BOUNTY'](eth, stellar)
          const meta = {
            issueNumber: issue.number,
            installId,
            repo
          }

          return Promise.all([
            githubApi.commentIssue(installId, repo, issue.number, message),
            Bifrost.ethereumWebhook(eth.address, meta)
          ])
        })
        .then(resolve(true))
        .catch(error => console.log(error))
    })
  },

  updateBounty ({ pr, repo, installId }) {
    return new Promise((resolve) => {
      githubApi
        .getTaggedIssueFromPull(installId, repo, pr)
        .then(issueNumber => {
          const url = `https://api.github.com/repos/${repo.owner}/${repo.name}/issues/${issueNumber}`
          return axios.get(url)
        })
        .then(response => {
          const issue = response.data
          const message = messages['BOUNTY_READY_TO_CLAIM'](issue.id)

          return Promise.all([
            Bounty.addUsername(issue.id.toString(), pr.user.login),
            githubApi.commentIssue(installId, repo, issue.number, message)
          ])
        })
        .then(resolve(true))
        .catch(error => console.log(error))
    })
  },

  commentIssue ({ installId, repo, issueNumber, message }) {
    return new Promise((resolve) => {
      githubApi
        .commentIssue(installId, repo, issueNumber, message)
        .then(resolve(true))
        .catch(error => console.log(error))
    })
  }
}
