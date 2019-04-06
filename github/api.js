const createApp = require('github-app');

class GithubApi {
  constructor (appId, cert) {
    if (!appId || !cert) {
      throw new Error("Missing credentials")
    }

    this.app = this.createApp(appId, cert)
  }

  createApp (appId, cert) {
    return createApp({
      id: appId,
      cert: cert
    })
  }

  commentIssue (installId, repo, issueNumber, message) {
    return this.app.asInstallation(installId)
      .then(github => {
        github.issues.createComment({
          owner: repo.owner,
          repo: repo.name,
          number: issueNumber,
          body: message
        })
      })
  }

  getTaggedIssueFromPull (installId, repo, pr) {
    return this.app.asInstallation(installId)
      .then(github => {
        let issueNumber = null;

        if (pr.body.includes("fixes issue") || pr.body.includes("closes issue") || pr.body.includes("#")) {
          pr.body.split(' ').forEach(txt => {
            if (txt.charAt(0) == "#") {
              issueNumber = txt.substring(1)
            }
          })
        }

        return issueNumber
      })
  }
}

module.exports = GithubApi;
