module.exports = {
  'NEW_BOUNTY': (eth, stellar) => {
    let message = ""

    message += "For **Funders**, you can now deposit bounty amount on these addresses:\n"
    message += "- **For ETH:** \n"
    message += "Contract Address: [`" + eth.address + "`](https://ropsten.etherscan.io/address/" + eth.address + ")\n"
    message += "- **For XLM:** \n"
    message += "Address: [`" + stellar.address + "`](https://stellar.expert/explorer/testnet/account/" + stellar.address + ")\n"
    message += "Memo: `" + stellar.memo + "`\n\n"
    message += "For **Developers**, you can now start working on this issue. Once you're done, submit a pull request and reference this issue on the description. e.g.`This fixes issue #1`"

    return message
  },
  'BOUNTY_READY_TO_CLAIM': (issueId) => {
    let message = "Yay! The bounty for this issue can now be claimed on this [link](http://localhost:3000/bounty/" + issueId + "/claim)"

    return message
  }
}
