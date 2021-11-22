const Binance = require('node-binance-api');
const moment =  require('moment');

// Testnet
// const API_KEY = 'GYQr5Xa84lAeddZMdM61iNukrKf7mFhba8cFomzfua0azSb4YiS0VCG5JOrEg2z6'
// const SECRET_KEY = 'LqwWmSlh3UnaeZrEsJ6Z2tUz5KnEPNRH5cV0lzh7etUb3hXuZjxgBiJIU4WcIACd'

// Real Account
const API_KEY = '92ti17wcprnSiWVkqF6VJLViM3BjifH3LeaaPOcrsTZhBpEI0Iw8UcIwQSNgc0n3'
const SECRET_KEY = 'SqPdLTU5DmW2oO1nx3hAU9BwyS6iWIR0GkfRqkqs6mXGMAW49kNr4qMJxzHek3cX'

const FAST_LENGTH = 12
const SLOW_LENGTH = 26
const SIGNAL_LENGTH = 9

const REAL = {
    '1m': {
        date: '2021-11-19 11:59:00',
        open: '56304.62',
        high: '56309.22',
        low: '56260.00',
        close: '56269.30',
        shortEMA: 56240.12357,
        longEMA: 56196.11357,
        MACD: 44.01,
        signal: 34.33,
        diffMACD: 9.68
    },
    // '5m': {
    //     date: '2021-11-19 12:00:00',
    //     open: 538.07,
    //     high: 539.12,
    //     low: 537.80,
    //     close: 537.90,
    //     shortEMA: 56240.12357,
    //     longEMA: 56196.11357,
    //     MACD: 44.01,
    //     signal: 34.33,
    //     diffMACD: 9.68
    // }
    '5m': {
        date: '2021-11-19 11:55:00',
        open: 537.08,
        high: 538.45,
        low: 537.08,
        close: 538.09,
        shortEMA: 533.5682143,
        longEMA: 532.5482143,
        MACD: 1.02,
        signal: 0.06,
        diffMACD: 0.96
    }
}

const binance = new Binance();

let orders = [];

binance.options({
    APIKEY: API_KEY,
    APISECRET: SECRET_KEY,
    useServerTime: true,
    recvWindow: 60000, // Set a higher recvWindow to increase response timeout
    verbose: true, // Add extra output when subscribing to WebSockets, etc
    log: log => {
        console.log(log); // You can create your own logger here, or disable console output
}
});

let interval = '5m'
async function main() {
    // console.info( await binance.futuresChart( 'BTCUSDT', '1m', console.log ) );
    // console.info( await binance.futuresQuote('BTCUSDT') );
    // console.info( await binance.lending() );
    let start = moment('2021-11-18 12:00:00')
    // let end = moment('2021-11-19 24:00:00')
    let end = moment()
    const prices = await binance.futuresCandles('BNBUSDT', interval, {
        startTime: start.valueOf(),
        endTime: end.valueOf(),
        limit: 1000
    });
    // console.log(prices)
    const bPrices = prices.map(p => {
        return {
            date: moment(p[0]).format('YYYY-MM-DD HH:mm:ss'),
            open: p[1],
            high: p[2],
            low: p[3],
            close: p[4],
        }
    })
    // bPrices[0].MACD = 44.29
    // bPrices[0].signal = 36.32
    // bPrices[0].diffMACD = bPrices[0].MACD - bPrices[0].signal
    calculateMACD(bPrices)
    console.log(orders)
    console.log(orders.reduce((a, b) => a + b.price, 0))
    console.log(bPrices[bPrices.length-1])
}

function calculateMACD(data) {
    var kShortEMA = 2/(FAST_LENGTH + 1); //
    var kLongEMA = 2/(SLOW_LENGTH + 1);
    var kSignal = 2/(SIGNAL_LENGTH + 1);

    // Real data 5m
    // data.unshift(REAL[interval])

    for (var i = 0; i < data.length; i++) {
        if (i == 0) {
            if (data[i].real) continue;
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
        data[i].signal = data[i].MACD * kSignal + data[i - 1].signal * (1 - kSignal);
        data[i].diffMACD = data[i].MACD - data[i].signal;

        //Calculate trend and order
        if (data[i - 1] && data[i - 1].MACD && data[i - 2] && data[i - 2].MACD) {
            if (data[i - 1].MACD > data[i - 2].MACD // prev up
                && data[i].MACD < data[i - 1].MACD) {
                // Sell sell sell
                orders.push({date: data[i].date, price: parseFloat(data[i].close)})
            }
            if (data[i - 1].MACD < data[i - 2].MACD // prev down
                && data[i].MACD > data[i - 1].MACD) {
                // Buy buy buy
                orders.push({date: data[i].date, price: parseFloat(0-data[i].close)})
            }
        }
    }
    return data;
}

main()