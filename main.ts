const companySymbolPrompt = require("prompt-sync")();

import { getStocks } from "./StealInformation";



let symbol = companySymbolPrompt("Enter the company symbol: ");

getStocks(symbol);
