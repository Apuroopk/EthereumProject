// Import the page's CSS. Webpack will know what to do with it.
import '../styles/app.css'

// Import libraries we need.
import { default as Web3 } from 'web3'
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import simpleArtifact from '../../build/contracts/SimpleWallet.json'

// SimpleWalletContract is our usable abstraction, which we'll use through the code below.
const SimpleWalletContract = contract(simpleArtifact)

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
let accounts
let account

const App = {
  start: function () {
    const self = this

    // Bootstrap the SimpleWalletContract abstraction for Use.
    SimpleWalletContract.setProvider(web3.currentProvider)

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function (err, accs) {
      if (err != null) {
        alert('There was an error fetching your accounts.')
        return
      }

      if (accs.length === 0) {
        alert("Couldn't get any accounts! Make sure simpleWalletInstanceMask is unlocked or your Ethereum Node contains accounts.")
        return
      }

      accounts = accs;
      account = accounts[0];
      
      document.getElementById('currentAccount').innerHTML = account;

      self.refreshBalance();
      self.updateAddressAllowedToSend();
    })
  },

  setStatus: function (message) {
    const status = document.getElementById('status')
    status.innerHTML = message
  },

  refreshBalance: function () {
    const self = this
    SimpleWalletContract.deployed().then(function (instance) {

      web3.eth.getBalance(instance.address,function(error,result){
        document.getElementById('walletBalance').innerHTML = web3.fromWei(result, "ether")+" Ether";
      })

    }).catch(function (e) {
      console.error(e);
      self.setStatus('Error getting balance; see log.')
    })
  },

//This function identifies account 1 as owner and allows him to send money
  allowSender: function () {
    const self = this

    const receiver = document.getElementById('addressAllowSender').value

    this.setStatus('Initiating transaction... (please wait)')

    let simpleWalletInstance
    SimpleWalletContract.deployed().then(function (instance) {
      simpleWalletInstance = instance
      return simpleWalletInstance.allowAddressToSendMoney(receiver, { from: account })
    }).then(function () {
      self.setStatus('Sender allowed succesfully!')
      self.refreshBalance();
      self.updateAddressAllowedToSend();
    }).catch(function (e) {
      console.error(e);
      self.setStatus('Error allowing sender; see log.')
    })


  },
  depositEther: function() {
    const self = this

    const amount = document.getElementById('amountDeposit').value;

    SimpleWalletContract.deployed().then(i => {
      return i.sendTransaction({from:account, value:web3.toWei(amount, "ether")});
    }).then(res => {
      self.setStatus('Sender allowed succesfully!')
      document.getElementById('amountDeposit').value = null;
      self.refreshBalance();
    }).catch(function (e) {
      console.error(e);
      self.setStatus('Error allowing sender; see log.')
    })

  },
  withdrawalEther: function() {
    const self = this

    const amountWithdrawal = document.getElementById('amountWithdrawal').value;
    const addressWithdrawal = document.getElementById('addressWithdrawal').value;

    SimpleWalletContract.deployed().then(i => {
      return i.sendFunds(web3.toWei(amountWithdrawal, "ether"), addressWithdrawal, { from: account, gas:1000000 });
    }).then(res => {
      self.setStatus('Ether sent successfully')
      document.getElementById('amountWithdrawal').value = null;
      document.getElementById('addressWithdrawal').value = null;
      self.refreshBalance();
    }).catch(function (e) {
      console.error(e);
      self.setStatus('Error allowing sender; see log.')
    })

  },

  //Allows all other addresses/accounts to send money.
  updateAddressAllowedToSend: function () {
    const self = this
    this.setStatus('Initiating transaction... (please wait)')

    let simpleWalletInstance
    SimpleWalletContract.deployed().then(function (instance) {
      simpleWalletInstance = instance
      return simpleWalletInstance.isAllowedToSend(account, { from: account })
    }).then(function (boolIsAllowed) {
      if(!boolIsAllowed) {
        document.getElementById('allowedToSend').innerHTML = "<strong>not</strong>";
      }
    }).catch(function (e) {
      console.error(e);
      self.setStatus('Error allowing Account; see log.')
    })


  }

}

window.App = App

window.addEventListener('load', function () {
  // Checking if Web3 has been injected by the browser (Mist/simpleWalletInstanceMask)
  if (typeof web3 !== 'undefined') {
    console.warn(
      'Using web3 detected from external source.' +
      ' If you find that your accounts don\'t appear or you have 0 SimpleWalletContract,' +
      ' ensure you\'ve configured that source properly.' +
      ' If using simpleWalletInstanceMask, see the following link.' +
      ' Feel free to delete this warning. :)' +
      ' http://truffleframework.com/tutorials/truffle-and-simpleWalletInstancemask'
    )
    // Use Mist/simpleWalletInstanceMask's provider
    window.web3 = new Web3(web3.currentProvider)
  } else {
    console.warn(
      'No web3 detected. Falling back to http://127.0.0.1:9545.' +
      ' You should remove this fallback when you deploy live, as it\'s inherently insecure.' +
      ' Consider switching to simpleWalletInstancemask for development.' +
      ' More info here: http://truffleframework.com/tutorials/truffle-and-simpleWalletInstancemask'
    )
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'))
  }

  App.start()
})
