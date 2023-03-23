// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

// *****************use remix to compile and deploy ************
// import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract VendingMachine {
    struct Customers {
        address buyer;
        uint256 qty;
        uint256 unitPrice;
        uint256 totalAmount;
        uint256 date;
        // uint256 time;
    }

    enum PricingModel {
        ethBased,
        usdBased
    }

    // state variables
    address public this_address;
    address public owner;
    mapping(address => uint) public donutBalances;
    mapping(address => uint256) public donutPriceEth; // in wei 1 eth = 1 x 10**18
    mapping(address => uint) public donutPriceUSD;
    mapping(address => PricingModel) public pricingModel; // 0 is eth based, 1 is USB based
    AggregatorV3Interface public priceFeed;
    Customers[] public customers;

    // Addresses public addresses;

    // set the owner as th address that deployed the contract
    // set the initial vending machine balance to 100
    constructor() {
        owner = msg.sender;
        donutBalances[address(this)] = 200;
        donutPriceEth[address(this)] = 0.01 * 10 ** 18; //in wei
        donutPriceUSD[address(this)] = 20 * 10 ** 18; //$20 * 10 * 18 beause assume in wei
        pricingModel[address(this)] = PricingModel.ethBased;
        priceFeed = AggregatorV3Interface(
            0x694AA1769357215DE4FAC081bf1f309aDC325306
        );
        this_address = address(this);
        // customers.push(Customers(msg.sender, amount, donutPrice[address(this)], msg.value, block.timestamp));
    }

    function isOnwer(address anAddress) public view returns (bool) {
        if (anAddress == owner) {
            return true;
        }
        return false;
    }

    function getVendingMachineBalance() public view returns (uint) {
        return donutBalances[address(this)];
    }

    function getDonutPriceEth() public view returns (uint256) {
        return donutPriceEth[address(this)];
    }

    function getDonutPriceUSD() public view returns (uint256) {
        return donutPriceUSD[address(this)];
    }

    function getPricingModel() public view returns (PricingModel) {
        return pricingModel[address(this)];
    }

    // Let the owner restock the vending machine
    function restock(uint amount) public {
        require(msg.sender == owner, "Only the owner can restock.");
        donutBalances[address(this)] += amount;
    }

    // let the owner to set donut price
    function updateDonutPriceEth(uint256 donut_price) public {
        require(msg.sender == owner, "Only the owner can set donut price.");
        donutPriceEth[address(this)] = donut_price;
    }

    function updateDonutPriceUSD(uint256 donut_price) public {
        require(msg.sender == owner, "Only the owner can set donut price.");
        donutPriceUSD[address(this)] = donut_price;
    }

    function updatePricingModel(PricingModel pricing_model) public {
        require(msg.sender == owner, "Only the owner can set pricing model.");
        pricingModel[address(this)] = pricing_model;
    }

    // Purchase donuts from the vending machine  00000001
    function purchase(uint amount) public payable {
        uint256 donut_price = donutPriceEth[address(this)];
        if (pricingModel[address(this)] == PricingModel.usdBased) {
            donut_price = donutPriceUSD[address(this)] / getPrice();
        }
        require(
            msg.value >= amount * donut_price,
            "You must pay at least 0.01 ETH per donut"
            // msg.value >= amount * donut_price[address(this)], "You must pay at least 0.01 ETH per donut"
        );
        require(
            donutBalances[address(this)] >= amount,
            "Not enough donuts in stock to complete this purchase"
        );
        donutBalances[address(this)] -= amount;
        donutBalances[msg.sender] += amount;

        // send money to vending machine owner bank
        payable(owner).transfer(address(this).balance);

        // add new transaction record to customers array
        customers.push(
            Customers(
                msg.sender,
                amount,
                donutPriceEth[address(this)],
                msg.value,
                block.timestamp
            )
        );
    }

    function getPrice() public view returns (uint256) {
        (, int256 answer, , , ) = priceFeed.latestRoundData();
        // return uint256(answer * 10000000000);
        // return uint256(answer / 1000000);
        return uint256(answer / 100000000);
    }

    function getCustomers() public view returns (Customers[] memory) {
        return customers;
    }

    function getAddressThis() public view returns (address) {
        return address(this);
    }
}
