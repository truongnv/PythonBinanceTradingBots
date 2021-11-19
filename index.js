const ccxt =  require('ccxt');
const moment =  require('moment');

// Testnet
// const API_KEY = '7gc7NbkE1zvGoOgiO8wdO56O8jTGw0ovejymkstOtwtdECnMWlMTjLOeHL5Evv4t'
// const SECRET = 'vKpJza1BXD76OHxn5lu1XHl6LcDzNmBDto0Nqj4Bll4UhRWhHjDy6mopHaeGdSmQ'

// Real Account
const API_KEY = '92t1MrxfTYR2HupL1SyUXqGcpzeDy9N11HMAHex5eH0Iw8UcIwQSNgc0n3'
const SECRET = 'SqPdLTU5DmW2oO1nx3hAU9BwyS6iWIR0GkfRqkqs6mXGMAW49kNr4qMJxzHek3cX'

const FAST_LENGTH = 12
const SLOW_LENGTH = 26
const SIGNAL_LENGTH = 9

const binance = new ccxt.binance({
  apiKey: API_KEY,
  secret: SECRET
})
// binance.setSandboxMode(true)

async function balance() {
  const balance = await binance.fetchBalance()
  console.log(balance)
}

async function main() {
  const prices = await binance.fetchOHLCV('BNB/USDT', '1h');
  const bPrices = prices.map(p => {
    return {
      date: moment(p[0]).format('YYYY-MM-DD HH:mm:ss'),
      open: p[1],
      high: p[2],
      low: p[3],
      close: p[4],
    }
  })

  calculateMACD(bPrices)
  console.log(bPrices.splice(bPrices.length - 20))
}

function calculateMACD(data) {
  var kShortEMA = 2/(FAST_LENGTH + 1);
  var kLongEMA = 2/(SLOW_LENGTH + 1);
  var kSignal = 2/(SIGNAL_LENGTH + 1);
  for (var i = 0; i < data.length; i++) {
    if (i == 0) {
      data[i].shortEMA = data[i].close;
      data[i].longEMA = data[i].close;
      data[i].MACD = data[i].shortEMA - data[i].longEMA;
      data[i].signal = data[i].MACD;
      data[i].diffMACD = data[i].MACD - data[i].signal;
      continue;
    }
    data[i].shortEMA = data[i].close * kShortEMA + data[i - 1].shortEMA * (1 - kShortEMA);
    data[i].longEMA = data[i].close * kLongEMA + data[i - 1].longEMA * (1 - kLongEMA);
    data[i].MACD = data[i].shortEMA - data[i].longEMA;
    data[i].signal = data[i].MACD * kSignal + data[i - 1].MACD * (1 - kSignal);
    data[i].diffMACD = data[i].MACD - data[i].signal;
  }
  return data;
}

// main();
balance();