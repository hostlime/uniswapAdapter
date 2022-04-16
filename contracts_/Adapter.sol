// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";



contract Adapter {
    // events
    // Emitted when swap Token cmpleted
    event SwapTokens(
        address indexed to,
        uint256[] amounts,
        address[] path
    );

    // Emitted when pair was created
    event CreatePool(
        address indexed tokenA, 
        address indexed tokenB,
        address indexed pair
    );

    // Emitted when Liquidity was added
    event AddLiquidity(
        address indexed to, 
        uint256 amountTokenA, 
        uint256 amountTokenB,
        uint256 amountLiquidity
    );

    // Emitted when Liquidity was removed
    event RemoveLiquidity(
        address indexed to, 
        uint256 amountTokenA, 
        uint256 amountTokenB,
        uint256 amountLiquidity
    );

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

        emit CreatePool(tokenA, tokenB, pair);
    }
    function getPair(address tokenA, address tokenB) external view returns (address pair){
        pair = IUniswapV2Factory(factory).getPair(tokenA, tokenB);
    }

    function addLiquidityETH(
    address token,
    uint amountTokenDesired,
    uint amountTokenMin,
    uint amountETHMin,
    address to,
    uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity){
        
        IERC20(token).transferFrom(msg.sender, address(this), amountTokenDesired);
        IERC20(token).approve(address(router02), amountTokenDesired);

        (amountToken, amountETH, liquidity) = IUniswapV2Router02(router02).addLiquidityETH{value: msg.value}(
            token,
            amountTokenDesired,
            amountTokenMin,
            amountETHMin,
            to,
            deadline);

        amountTokenDesired -= amountToken;
        if(amountTokenDesired>0) IERC20(token).transfer(msg.sender, amountTokenDesired);

        emit AddLiquidity(to, amountToken, amountETH, liquidity);
    }
    function removeLiquidityETH(
    address token,
    uint liquidity,
    uint amountTokenMin,
    uint amountETHMin,
    address to,
    uint deadline
    ) payable external returns (uint amountToken, uint amountETH){

        address pair = IUniswapV2Factory(factory).getPair(token, IUniswapV2Router02(router02).WETH());
        console.log(pair);
        IERC20(pair).transferFrom(msg.sender, address(this), liquidity);
        IERC20(pair).approve(address(router02), liquidity);

        (amountToken, amountETH) = IUniswapV2Router02(router02).removeLiquidityETH(
            token,
            liquidity,
            amountTokenMin,
            amountETHMin,
            to,
            deadline);

        emit RemoveLiquidity(to, amountToken, amountETH, liquidity);
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
            to,
            deadline);

        amountA -= _amountA;
        if(amountA>0) IERC20(tokenA).transfer(msg.sender, amountA);

         amountB -= _amountB;
        if(amountB>0) IERC20(tokenB).transfer(msg.sender, amountB);

        emit AddLiquidity(to, amountA, _amountB, _liquidity);
    }
    function removeLiquidity(
    address tokenA,
    address tokenB,
    uint liquidity,
    uint amountAMin,
    uint amountBMin,
    address to,
    uint deadline
    ) external returns (uint amountA, uint amountB){
        address pair = IUniswapV2Factory(factory).getPair(tokenA, tokenB);
        
        IERC20(pair).transferFrom(msg.sender, address(this), liquidity);
        IERC20(pair).approve(address(router02), liquidity);

        (amountA, amountB) = IUniswapV2Router02(router02).removeLiquidity(
            tokenA,
            tokenB,
            liquidity,
            amountAMin,
            amountBMin,
            to,
            deadline);
        
        emit RemoveLiquidity(to, amountA, amountB, liquidity);
    }
    function swapExactTokensForTokens(
    uint amountIn,
    uint amountOutMin,
    address[] calldata pathPool,
    address to,
    uint deadline
    ) external returns (uint[] memory amounts){

        IERC20(pathPool[0]).transferFrom(msg.sender, address(this), amountIn);
        IERC20(pathPool[0]).approve(address(router02), amountIn);

        amounts = IUniswapV2Router02(router02).swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        pathPool,
        to,
        deadline
        );

        emit SwapTokens(to, amounts, pathPool);
    }
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) 
    internal 
    view 
    returns (uint amountOut){
        amountOut = IUniswapV2Router02(router02).getAmountOut(amountIn, reserveIn, reserveOut);
    }
    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut)
    internal 
    view 
    returns (uint amountIn){
        amountIn = IUniswapV2Router02(router02).getAmountIn(amountOut, reserveIn, reserveOut);
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