# Адаптер для Uniswap (v2)

Адаптер для подключения к DEX uniswap в тестовой сети.

##### Возможности:
- Обмен токенов используя путь токенов
- Создание пулов ликвидности
- Наполнение и дуление ликвидности


##### npx hardhat test:
```shell
  Adapter
    ✔ Checking that contract factory is deployed
    ✔ Checking that contract router is deployed
    ✔ Checking that contract tokenTST is deployed
    ✔ Checking that contract tokenACDM is deployed
    ✔ Checking that contract tokenPOP is deployed
    ✔ Checking that contract adapter is deployed
    ✔ Checking that contract adapter is correctly initialized
    ✔ Checking function createPool() (128ms)
    ✔ Checking function addLiquidityETH() (475ms)
    ✔ Checking function removeLiquidityETH() (467ms)
    ✔ Checking function addLiquidity() (935ms)
    ✔ Checking function removeLiquidity() (451ms)
    ✔ Checking function swapExactTokensForTokens() swap TST/ACDM (1137ms)
    ✔ Checking swap TST/ACDM => ACDM/POP (645ms)

  10 passing (7s)
```

##### npx hardhat coverage:
```shell
-------------|----------|----------|----------|----------|----------------|
File         |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
-------------|----------|----------|----------|----------|----------------|
 contracts\  |      100 |      100 |      100 |      100 |                |
 Adapter.sol |      100 |      100 |      100 |      100 |                |
  Token.sol  |      100 |      100 |      100 |      100 |                |
-------------|----------|----------|----------|----------|----------------|
All files    |      100 |      100 |      100 |      100 |                |
-------------|----------|----------|----------|----------|----------------|
```