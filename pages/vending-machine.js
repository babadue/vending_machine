import Head from 'next/head'
import { useState, useEffect } from 'react'  //useEffect -> trigger at page load
import Web3 from 'web3'
// import vmContract from '@/blockchain/vending'
import vendingMachineContract from '../blockchain/vending'
import 'bulma/css/bulma.css'
import styles from '../styles/VendingMachine.module.css'

// export default function VendingMachine() {
const VendingMachine = () => {
    const [error, setError] = useState('')
    const [successMsg, setSuccessMsg] = useState('')
    const [inventory, setInventory] = useState('')
    const [myDonutCount, setMyDonutCount] = useState('')
    const [buyCount, setBuyCount] = useState('')
    const [web3, setWeb3] = useState(null)
    const [address, setAddress] = useState(null)
    const [vmContract, setVmContract] = useState(null)
    const [restockCount, setRestockCount] = useState('')
    const [ethPrice, setEthPrice] = useState('')
    const [donutPriceEth, setDonutPriceEth] = useState('')
    const [donutPriceUSD, setDonutPriceUSD] = useState('')
    const [customers, setCustomers] = useState('')
    const [pricingModel, setPricingModel] = useState('')
    const [menuType, setMenuType] = useState('')

    // useEffect shown upon page loaded
    useEffect(() => {
        if (vmContract) getInventoryHandler()
        if (vmContract && address) getMyDonutCountHandler()
        getCurrentEthPrice()
        if (vmContract) getDonutPrice()
        if (vmContract) getCustomers()
        if (vmContract) getPricingModel()
        // console.log(`useEffect  donutPrice: ${donutPrice}`)
        setOwnerMenuDisplay()

    }, [vmContract, address])

    const getCurrentEthPrice = async () => {
        console.log(`getCurrentEthPrice `)
        if (vmContract) {
            const price = await vmContract.methods.getPrice().call()
            console.log(`getCurrentEthPrice eth price :: ${price}`)
            // setEthPrice(price / 100)
            setEthPrice(price)
            console.log(`getCurrentEthPrice ethPrice in USD :: $${ethPrice}`)
        }
    }

    const setOwnerMenuDisplay = async () => {
        console.log(`setOwnerMenuDisplay model:: ${pricingModel}`)
        document.getElementById("rs").style.display = "none"  //block to display
        document.getElementById("donut_price_eth").style.display = "none"
        document.getElementById("donut_price_usd").style.display = "none"
        document.getElementById("pricing_model").style.display = "none"
        console.log(`setRestockDisplay `)
        if (vmContract) {
            const isOwner = await vmContract.methods.isOnwer(address).call()
            setMenuType("Vending machine inventory Customer Menu")
            if (isOwner) {
                document.getElementById("rs").style.display = "block"  //block to display
                document.getElementById("donut_price_eth").style.display = "block"
                document.getElementById("donut_price_usd").style.display = "block"
                document.getElementById("pricing_model").style.display = "block"
                setMenuType("Vending machine inventory Owner Menu")
                // console.log(`setOwnerMenuDisplay model 2:: ${pricingModel}`)
            }
        }

    }

    const getInventoryHandler = async () => {
        const inventory = await vmContract.methods.getVendingMachineBalance().call()
        setInventory(inventory)
    }

    const getMyDonutCountHandler = async () => {
        const count = await vmContract.methods.donutBalances(address).call()
        setMyDonutCount(count)
    }

    const getDonutPrice = async () => {
        const donut_price_eth = await vmContract.methods.getDonutPriceEth().call()
        const donut_price_usd = await vmContract.methods.getDonutPriceUSD().call()
        console.log(`getDonutPrice donut in wei :: ${donut_price_eth}`)
        setDonutPriceEth(donut_price_eth / 10 ** 18)
        setDonutPriceUSD(donut_price_usd / 10 ** 18)
        // setDonutPrice(web3.utils.toEth(donut_price.toString(), 'wei'))
        // web3.utils.toWei(donutPrice.toString(), 'ether')
        console.log(`getDonutPrice donut in either :: ${donut_price_eth}  USD :$${donut_price_usd}`)
    }

    const getPricingModel = async () => {
        const pricing_model = await vmContract.methods.getPricingModel().call()
        console.log(`getPricingModel pricing_model:: ${pricing_model}`)
        setPricingModel(pricing_model)
        switch (Number(pricing_model)) {
            case 0: //fixed pricing model
                console.log(`getPricingModel case 00:: `)
                document.getElementById("fixedpricing").checked = true
                console.log(`getPricingModel case 0:: `)
                break;
            case 1: //variable pricing model
                console.log(`getPricingModel case 1:: `)
                document.getElementById("variablepricing").checked = true
                break;
            default:
                console.log(`getPricingModel case default:: `)
        }
        // setOwnerMenuDisplay()

    }

    const getCustomers = async () => {
        const customers = await vmContract.methods.getCustomers().call()
        console.log(`customers list count :: ${customers.length}`)
        for (let i = 0; i < customers.length; i++) {
            console.log(`customer  ${i} :: ${customers[i]}  ${new Date(customers[i][4] * 1000)}`)
        }
        // console.log(`customer 0 date1 :: ${customers[0][4]}`)

        const myowner = await vmContract.methods.owner().call()
        const thisaddress = await vmContract.methods.this_address().call()
        console.log(`get owner of the contract or store  :: ${myowner}`)
        console.log(`get address of this contract :: ${thisaddress}`)

    }

    const updateDonutQty = event => {
        // console.log(`donut qty :: ${event.target.value}`)
        setBuyCount(event.target.value)
        console.log(`updateDonutQty buyCount :: ${buyCount}`)
    }

    const updateRestockQty = event => {
        console.log(`restock qty :: ${event.target.value}`)
        setRestockCount(event.target.value)
    }

    const updateDonutPriceEth = event => {
        console.log(`updateDonutPriceEth price :: ${event.target.value}`)
        setDonutPriceEth(event.target.value)

    }

    const updateDonutPriceUSD = event => {
        console.log(`updateDonutPriceUSD price :: ${event.target.value}`)
        setDonutPriceUSD(event.target.value)

    }

    const buyDonutsHandler = async () => {
        let donut_price = 0
        switch (Number(pricingModel)) {
            case 0:
                donut_price = donutPriceEth
                break
            case 1:
                donut_price = donutPriceUSD / ethPrice
                break
            default:
                console.log('buyDonutsHandler error')
        }
        try {
            await vmContract.methods.purchase(buyCount).send({
                from: address,
                value: web3.utils.toWei(donut_price.toString(), 'ether') * buyCount
            })
            getInventoryHandler()
            getMyDonutCountHandler()
            setSuccessMsg(`${buyCount} donuts purchased!!!`)
            document.getElementById("bd_box").value = ""
            console.log(`buy ${buyCount} at ${donut_price} eth per donut for ${donut_price * buyCount} eth.`)
        } catch (err) {
            setError(err.message)
        }
    }

    const restockHandler = async () => {
        console.log(`restockHandler 1 :: ${restockCount} address :: ${address}`)
        try {
            await vmContract.methods.restock(restockCount).send({
                from: address
            })
            console.log(`restockHandler 3 :: ${restockCount}`)
            getInventoryHandler()
            document.getElementById("rs_box").value = ''
        } catch (err) {
            console.log(`restockHandler 4 :: ${restockCount}`)
            setError(err.message)
        }
    }

    const updateDonutPriceEthHandler = async () => {
        console.log(`updateDonutPriceEthHandler 1 :: ${donutPriceEth} address :: ${address}`)
        try {
            await vmContract.methods.updateDonutPriceEth(web3.utils.toWei(donutPriceEth.toString(), 'ether')).send({
                from: address
            })
        } catch (err) {
            console.log(`updateDonutPriceEthHandler 4 :: ${donutPriceEth}`)
            setError(err.message)
        }
    }

    const updateDonutPriceUSDHandler = async () => {
        console.log(`updateDonutPriceUSDHandler 1 :: ${donutPriceUSD} address :: ${address}`)
        try {
            await vmContract.methods.updateDonutPriceUSD(web3.utils.toWei(donutPriceUSD.toString(), 'ether')).send({
                from: address
            })
        } catch (err) {
            console.log(`updateDonutPriceUSDHandler 4 :: ${donutPriceUSD}`)
            setError(err.message)
        }
    }

    const updatePricingModelHandler = async event => {
        console.log(`updatePricingModelHandler radio button value :: ${event.target.value}`)
        try {
            await vmContract.methods.updatePricingModel(Number(event.target.value)).send({
                from: address
            })
        } catch (err) {
            console.log(`updatePricingModelHandler 4 :: ${donutPrice}`)
            setError(err.message)
        }
    }

    //window.ethereum
    const connectWalletHandler = async () => {
        /* check if MetaMask is available */
        if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
            try {
                /* request wallet connect */
                // console.log("connectWalletHandler 1")
                await window.ethereum.request({ method: "eth_requestAccounts" })
                /* set web3 instance */
                const web3 = new Web3(window.ethereum)
                // console.log("connectWalletHandler 2")
                // setWeb3(new Web3(window.ethereum))
                setWeb3(web3)
                /* get list of accounts */
                // console.log("connectWalletHandler 3")
                const accounts = await web3.eth.getAccounts()
                console.log("connectWalletHandler 4 account 0", accounts[0])
                setAddress(accounts[0])

                /* create local contract copy*/
                // console.log("connectWalletHandler 5")
                const vm = vendingMachineContract(web3)
                // console.log("connectWalletHandler 6")
                setVmContract(vm)
                // console.log("connectWalletHandler 7")
            } catch (err) {
                setError(err.message)
            }

        } else {
            // metamask not installed
            console.log("please install MetaMask")
            alert("please install MetaMask")
        }


    }
    return (
        <div className={styles.main}>
            <Head>
                <title>VendingMachine App</title>
                <meta name="description" content="A blockchain vending machine app" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <nav className="navbar mt-4 mb-4">
                <div className="container">
                    <div className="navbar-brand">
                        <h1>Donuts Vending Machine</h1>
                        <label>  &nbsp;&nbsp; Current Eth Price:&nbsp;&nbsp;${ethPrice}</label><br></br>
                        <label>  &nbsp;&nbsp; Donut Price in Eth:&nbsp;&nbsp;{donutPriceEth} &nbsp; (in USD: ${donutPriceUSD})</label><br></br>
                        {/* <label>  &nbsp;&nbsp; Donut Price in Eth:&nbsp;&nbsp;{donutPriceEth} &nbsp; (in USD: ${ethPrice * donutPriceEth})</label><br></br> */}
                    </div>
                    <div className="navbar-end">
                        <button onClick={connectWalletHandler} className="button is-primary">Connect Wallet</button>
                    </div>
                </div>

            </nav>
            <section>
                <div className='container'>
                    <h2>Vending machine inventory: {inventory}</h2>
                </div>
            </section>
            <section>
                <div className='container'>
                    <h2>My donuts: {myDonutCount}</h2>
                </div>
            </section>
            <section className='mt-5'>
                <div className='container'>
                    <div className="field">
                        <label className='label'>Buy donuts</label>
                        <div className='control'>
                            <input onChange={updateDonutQty} id="bd_box" className='input' type="text" placeholder="Enter amount..." />
                        </div>
                        <button
                            onClick={buyDonutsHandler}
                            className="button is-primary mt-2"
                        >Buy</button>
                        {successMsg}
                    </div>
                </div>
            </section >
            <section className='mt-5'>
                <div id="rs" className='container'>
                    <div className="field">
                        <label className='label'>Restock</label>
                        <div className='control'>
                            <input onChange={updateRestockQty} id="rs_box" className='input' type="text" placeholder="Enter restock amount..." />
                        </div>
                        <button
                            onClick={restockHandler}
                            className="button is-primary mt-2"
                        >Restock</button>
                    </div>
                </div>
            </section>
            <section className='mt-5'>
                <div id="donut_price_eth" className='container'>
                    <div className="field">
                        <label className='label'>Donut price in Ether</label>
                        <div className='control'>
                            <input onChange={updateDonutPriceEth} id="donutprice_box" className='input' type="text" placeholder="Enter donut price in ether..." />
                        </div>
                        <button
                            onClick={updateDonutPriceEthHandler}
                            className="button is-primary mt-2"
                        >Set Price</button>
                    </div>
                </div>
            </section>
            <section className='mt-5'>
                <div id="donut_price_usd" className='container'>
                    <div className="field">
                        <label className='label'>Donut price in USD</label>
                        <div className='control'>
                            <input onChange={updateDonutPriceUSD} id="donutprice_box" className='input' type="text" placeholder="Enter donut price in USD..." />
                        </div>
                        <button
                            onClick={updateDonutPriceUSDHandler}
                            className="button is-primary mt-2"
                        >Set Price</button>
                    </div>
                </div>
            </section>
            <section className='mt-5'>
                <div id="pricing_model" className='container'>
                    <p>Please select your pricing model:</p>
                    <input type="radio" id="fixedpricing" name="pricing_model" onChange={updatePricingModelHandler} value='0'></input>
                    <label htmlFor="fixedpricing">  &nbsp;&nbsp; Fixed Pricing</label><br></br>
                    <input type="radio" id="variablepricing" name="pricing_model" onChange={updatePricingModelHandler} value="1"></input>
                    <label>  &nbsp;&nbsp; Variable Pricing</label><br></br>
                </div>
            </section>
            <section>
                <div className='container has-text-danger'>
                    <p>{error}</p>
                </div>
            </section>
            <section className='mt-5'>
                <div className='container is-align-items-center is-flex '>
                    <h2>{menuType}</h2>
                </div>
            </section>
            {/* <section>
                <div id="bd_msg" className='container has-text-success'>
                    <p>{successMsg}</p>
                </div>
            </section> */}
        </div >
    )

}

export default VendingMachine