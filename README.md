# CS_6290_TeamProject

## Dev Environment Build

### VS Code Plugins

Recommended extensions (install from VS Code Marketplace):

- dbaeumer.vscode-eslint (ESLint)
- esbenp.prettier-vscode (Prettier)
- ms-toolsai.jupyter (Jupyter)
- juanblanco.solidity (Solidity)
- dsznajder.es7-react-js-snippets (ES7+ React/Redux/React-Native snippets)
- bradlc.vscode-tailwindcss (Tailwind CSS IntelliSense)



### Activate Python virtual environment

1. Install Python 3.13.0 and conda. 
1. Open the Terminal in VS Code.
2. Run the following command:

```Powershell

_Your project dir_\.venv\Scripts\Activate.ps1

```

e.g. E:\CityU CS\CS 6290\CS_6290_TeamProject\.venv\Scripts\Activate.ps1

### Activate Vite Server

1. Install Node.js at https://nodejs.org/zh-cn/download. 
2. Enter the frontend project route and run the following command:

```Powershell

npm install;
npm run dev

```

### Build Foundry environment

reference: https://www.getfoundry.sh/introduction/installation

1. Install Foundry by running the following command in GitBash:

``` Powershell

curl -L https://foundry.paradigm.xyz | bash

```
2. Restart the terminal.
3. Run the following command:

``` Powershell

foundryup

```

### Deploy the Contract

1. Run the following command in GitBash:

``` Powershell

forge script script/Counter.s.sol

```

The contract will be deployed to the local Anvil node or simulated environment by default.

If deployment to the testnet is required, please add the `--rpc-url <URL>` and `--private-key <KEY>` parameters.