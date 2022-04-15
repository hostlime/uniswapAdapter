// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract Adapter {

    address public factory;
    address public router02;
    constructor(){
    //    factory =   _factory;
    //    router02  = _router;
    //constructor(address _factory, address _router){
        factory =   address(0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f);
        router02  = address(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
    }

    function createPool(address tokenA, address tokenB) external returns(address pair) {         
        pair = IUniswapV2Factory(factory).createPair(tokenA, tokenB);
    }
    function getPair(address tokenA, address tokenB) external view returns (address pair){
        pair = IUniswapV2Factory(factory).getPair(tokenA, tokenB);
    }

    function removePoolLiquidity() external {

    }

    function addLiquidity(
    address tokenA,
    address tokenB,
    uint amountA,
    uint amountB,
    uint amountAMin,
    uint amountBMin,
    address to,
    uint deadline
    ) external returns (uint _amountA, uint _amountB, uint _liquidity){

        IERC20(tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountB);

        IERC20(tokenA).approve(address(router02), amountA);
        IERC20(tokenB).approve(address(router02), amountB);

        (_amountA, _amountB, _liquidity) = IUniswapV2Router02(router02).addLiquidity(
            tokenA,
            tokenB,
            amountA,
            amountB,
            amountAMin,
            amountBMin,
            msg.sender,
            deadline);

        amountA -= _amountA;
        if(amountA>0) IERC20(tokenA).transfer(msg.sender, amountA);

         amountB -= _amountB;
        if(amountB>0) IERC20(tokenB).transfer(msg.sender, amountB);
    }

}

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Token is ERC20, AccessControl {

    // Роль моста
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");

    //constructor() ERC20("MyTokenForBridge", "MTK") {}
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(BRIDGE_ROLE, msg.sender);
        _mint(msg.sender, 1000_000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) external onlyRole(BRIDGE_ROLE) {
        _mint(to, amount);
    }
    function burn(address user, uint256 amount) external onlyRole(BRIDGE_ROLE) {
        _burn(user, amount);
    }
}

/*
Техническое задание на неделю 8 (Uniswap v2)
Необходимы реализовать смарт контракт, который будет подключаться к DEX uniswap в тестовой сети.
-Написать контракт адаптер
-Написать полноценные тесты к контракту
-Написать скрипт деплоя
-Задеплоить в тестовую сеть
-Написать таск на основные функции
-Верифицировать контракт

Требования к контракту:
-Создать через адаптер несколько пар (TST/ACDM, ACDM/POP, ETH/POP)
-Добавить/удалить ликвидность к этим парам через адаптер.
-Получить цену пары через адаптер 
-Обменять пару через адаптер 
-Обменять пару TST/POP используя путь 

Проанализировать работу биржи:
-Изучить как формируется цена ЛП
-Изучить от чего зависит цена пары, как она рассчитывается
-Что происходит с комиссией за сделки 
-Как рассчитывается кол-во получаемых ЛП за предоставление ликвидности 

*/