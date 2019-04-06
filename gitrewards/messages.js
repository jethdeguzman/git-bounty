module.exports = {
  'NEW_BOUNTY': () => {
    let message = ""

    message += "For **Funders**, you can now deposit reward amount on these addresses:\n"
    message += "- **For ETH:** `XXXXXX`\n"
    message += "- **For XLM:** Address: `XXXX`,  Memo: `test - memo`\n"
    message += "- **For IOST:** Address: `XXXX`, Memo: `test - memo`\n\n"
    message += "For **Developers**, you can now start working on this issue. Once you're done, submit a pull request and reference this issue on the description. e.g.`This fixes issue #1`"

    return message
  },
  'BOUNTY_READY_TO_CLAIM': () => {
    let message = "Yay! The reward for this issue can now be claimed on this link http://localhost:3000/rewards/XXX-XXX-XXX/claim"

    return message
  }
}
