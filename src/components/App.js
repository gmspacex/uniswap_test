import { Tabs, Tab } from 'react-bootstrap'
import React, { Component } from 'react';
import Web3 from 'web3';
import { Contract } from 'ethers';

import WETH from '../abi/WETH.json'
import ChonMarsToken from '../abi/ChonMarsToken.json'
import UniswapV2Pair from "../abi/UniswapV2Pair.json";
import UniswapV2Factory from "../abi/UniswapV2Factory.json";
import UniswapV2Router02 from "../abi/UniswapV2Router02.json";
import { parseEther } from '@ethersproject/units';

import './App.css';
import { web3 } from '@openzeppelin/test-helpers/src/setup';

const CMT_ADDR = "0x55f3b97F7dA672Bfd582893e6d21CC9B91212854";
const WETH_ADDR = "0xCd7C826cEB645f3f480Ee523cAE53394b127bCa8";
const UNI_FACT_ADDR = "0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f";
const UNI_ROUTER_ADDR = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      web3: 'undefined',
      account: '',
      balance: 0,
      liquidityCMTAmount: 0,
      liquidityWETHAmount: 0,
      swapCMTAmount: 0,
      swapWETHAmount: 0,
      cmtWethPair: 'undefined',
      cmt: Contract,
      weth: Contract,
      uniswapV2Factory: Contract,
      uniswapV2Router02: Contract
    }

    this.addLiquidity = this.addLiquidity.bind(this);
    this.swap = this.swap.bind(this);
  }

  async componentWillMount() {
    await this.loadBlockchainData(this.props.dispatch)
  }

  async loadBlockchainData(dispatch) {
    if (typeof window.ethereum !== 'undefined') {
      const web3 = new Web3(window.ethereum)
      const netId = await web3.eth.net.getId()
      const accounts = await web3.eth.getAccounts()

      //load balance
      if (typeof accounts[0] !== 'undefined') {
        const balance = await web3.eth.getBalance(accounts[0])
        this.setState({ account: accounts[0], balance: balance, web3: web3 })
      } else {
        window.ethereum.enable();
        return;
      }

      //load contracts
      try {
        const cmt = new web3.eth.Contract(ChonMarsToken.abi, CMT_ADDR)
        const weth = new web3.eth.Contract(WETH.abi, WETH_ADDR)
        const uniswapV2Factory = new web3.eth.Contract(UniswapV2Factory.abi, UNI_FACT_ADDR)
        const uniswapV2Router02 = new web3.eth.Contract(UniswapV2Router02.abi, UNI_ROUTER_ADDR)
        this.setState({ cmt: cmt, weth: weth, uniswapV2Factory: uniswapV2Factory, uniswapV2Router02: uniswapV2Router02 })
        console.log(uniswapV2Router02._address);
      } catch (e) {
        console.log('Error', e)
        window.alert('Contracts not deployed to the current network')
      }

    } else {
      window.alert('Please install MetaMask')
    }
  }

  async addLiquidity(e) {
    e.preventDefault()
    if (this.state.uniswapV2Router02 !== 'undefined') {
      try {
        let pairAddress = await this.state.uniswapV2Factory.methods.getPair(this.state.cmt._address, this.state.weth._address).call({ from: this.state.account });
        if (pairAddress.includes("0x000000000")) {
          let response = await this.state.uniswapV2Factory.methods.createPair(this.state.cmt._address, this.state.weth._address).send({ from: this.state.account });
          pairAddress = await this.state.uniswapV2Factory.methods.getPair(this.state.cmt._address, this.state.weth._address).call({ from: this.state.account });
        }
        // await this.state.cmt.methods.approve(this.state.uniswapV2Router02._address, this.state.liquidityCMTAmount).send({ from: this.state.account })
        // await this.state.weth.methods.approve(this.state.uniswapV2Router02._address, this.state.liquidityWETHAmount).send({ from: this.state.account })

        console.log(this.state.cmt._address)
        console.log(this.state.weth._address)
        console.log(pairAddress);
        console.log(parseEther(this.state.liquidityCMTAmount).toString());
        console.log(parseEther(this.state.liquidityWETHAmount).toString());
        let response = await this.state.uniswapV2Router02.methods.addLiquidity(
          this.state.cmt._address,
          this.state.weth._address,
          parseEther(this.state.liquidityCMTAmount).toString(),
          parseEther(this.state.liquidityWETHAmount).toString(),
          parseEther(this.state.liquidityCMTAmount).mul(99).div(100).toString(),
          parseEther(this.state.liquidityWETHAmount).mul(99).div(100).toString(),
          this.state.account,
          Math.floor(Date.now() / 1000 + 120)
        ).send({ from: this.state.account });
        console.log(response);
      } catch (e) {
        console.log('Error, add liquidity: ', e)
      }
    }
  }

  async swap(e) {
    e.preventDefault();
    if (this.state.uniswapV2Router02 !== 'undefined') {
      try {
        this.state.uniswapV2Router02.methods.swapExactTokensForTokens(
          parseEther(this.state.swapCMTAmount).toString(), // amountIn
          parseEther(this.state.swapWETHAmount).toString(), // amountOutMin
          [CMT_ADDR, WETH_ADDR],
          this.state.account,
          Math.floor(Date.now() / 1000 + 120)
        ).send({ from: this.state.account });
      } catch (e) {
        console.log('Error, swap: ', e)
      }
    }
  }

  async getPoolStatus() {
    if (this.state.uniswapV2Router02 !== 'undefined') {
      try {
        const pairAddress = await this.state.uniswapV2Factory.methods.getPair(CMT_ADDR, WETH_ADDR).call();
        if (pairAddress) {
          const web3 = new Web3(window.ethereum);
          const pairContract = new web3.eth.Contract(UniswapV2Pair.abi, pairAddress);
          const status = await pairContract.methods.getReserves().call();
          console.log("status", status);
        }
      } catch (e) {
        console.log('Error, swap: ', e)
      }
    }
  }

  render() {
    this.getPoolStatus();
    return (
      <div className='text-monospace'>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            href="http://www.dappuniversity.com/bootcamp"
            target="_blank"
            rel="noopener noreferrer"
          >
          </a>
        </nav>
        <div className="container-fluid mt-5 text-center">
          <br></br>
          <h1>Welcome to ChonMarsToken</h1>
          <h2>{this.state.account}</h2>
          <br></br>
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
                <Tabs defaultActiveKey="profile" id="uncontrolled-tab-example">
                  <Tab eventKey="liquidity" title="Add Liquidity">
                    <div>
                      <br />
                      <form onSubmit={this.addLiquidity}>
                        CMT Amount
                        <div className='form-group mr-sm-2'>
                          <input
                            id='cmtAmount'
                            step="0.01"
                            type='number'
                            className="form-control form-control-md"
                            onChange={(e) => { this.setState({ liquidityCMTAmount: e.target.value }) }}
                            placeholder='CMT amount'
                            required />
                        </div>
                        <br />
                        WETH Amount
                        <div className='form-group mr-sm-2'>
                          <input
                            id='wethAmount'
                            step="0.01"
                            type='number'
                            onChange={(e) => { this.setState({ liquidityWETHAmount: e.target.value }) }}
                            className="form-control form-control-md"
                            placeholder='WETH amount'
                            required />
                        </div>
                        <button type='submit' className='btn btn-primary'>Add Liquidity</button>
                      </form>
                    </div>
                  </Tab>
                  <Tab eventKey="swap" title="Swap">
                    <div>
                      <br />
                      <form onSubmit={this.swap}>
                        CMT Amount
                        <div className='form-group mr-sm-2'>
                          <input
                            id='cmtAmount'
                            step="0.01"
                            type='number'
                            className="form-control form-control-md"
                            onChange={(e) => { this.setState({ swapCMTAmount: e.target.value }) }}
                            placeholder='CMT amount'
                            required />
                        </div>
                        <br />
                        WETH Amount
                        <div className='form-group mr-sm-2'>
                          <input
                            id='wethAmount'
                            step="0.01"
                            type='number'
                            onChange={(e) => { this.setState({ swapWETHAmount: e.target.value }) }}
                            className="form-control form-control-md"
                            placeholder='WETH amount'
                            required />
                        </div>
                        <button type='submit' className='btn btn-primary'>Swap</button>
                      </form>
                    </div>
                  </Tab>
                </Tabs>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
