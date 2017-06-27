const config = require('./config.json');
const filewalker = require('filewalker');
const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const token = config.telegram.token;
//const bot = new TelegramBot(token, {polling: true});
const moment = require('moment');
const request = require('superagent');

const express = require('express')
const app = express();
let ethValue = {
  USD: 0,
  MXN: 0
}

function getEthPrice(callback){
  request
  .get('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD,MXN')
  .end(function(err, res){
    if(err){console.log(err)};
      res.body.fetched_at = reportData.date = moment().format('MMMM Do YYYY, h:mm:ss a');
      ethValue = res.body;
      callback(res.body);
      return res.body;
  });
};

function getReport(ethValue, callback){
  var sharesCount = [];
  var totalShares = 0;
  var balance = 0;
  var multiplier =  0.000000000000000001;
  var jsonPath = __dirname + '/data_dump';
  var unpaid = 0;
  var reportData = {
    "workers": {}
  };
  reportData.date = moment().format('MMMM Do YYYY, h:mm:ss a');
  filewalker(jsonPath)
    .on('dir', function(p) {
      //console.log('dir:  %s', p);
    })
    .on('file', function(p, s) {
      var fileExt = path.extname(p);
      if (fileExt == '.json'){
      var jsonReport = JSON.parse(fs.readFileSync(jsonPath +'/'+p, 'utf8'));
      if ( typeof jsonReport.workers != 'undefined' ){
          // shares for each worker
          for(var worker in jsonReport.workers){
            if( typeof sharesCount[worker] == 'undefined'){
              sharesCount[worker] = {
                shareSum: 0
              };
            };
            var workerShares = parseInt(jsonReport.workers[worker].validShares);
            sharesCount[worker].shareSum += workerShares;
            totalShares += workerShares;
          }
          //end shares for each worker
          if ( jsonReport.unpaid  > unpaid ){
            unpaid = jsonReport.unpaid;
          }
        }
      }
    })
    .on('error', function(err) {
      console.error(err);
    })
    .on('done', function() {
      reportData.total_shares = totalShares;
      var unpaidTotal = ((unpaid* 0.99) * multiplier);
      reportData.unpaid = unpaidTotal;
      if( typeof ethValue != 'undefined' ){
        reportData.unpaidTotal_mxn = unpaidTotal * parseInt(ethValue.MXN);
        reportData.unpaidTotal_usd = unpaidTotal * parseInt(ethValue.USD);
      };
      var shareValue = unpaidTotal/totalShares;
      reportData.share_value = shareValue;
      for(worker in sharesCount){
        var workerBalance = sharesCount[worker].shareSum * shareValue;
        var fee = workerBalance*0.1;
        reportData.workers[worker] = {
          "mined": workerBalance,
          "shares" :  sharesCount[worker].shareSum,
          "balance":  workerBalance - fee,
        }
        if ( typeof ethValue != 'undefined' ){
          reportData.workers[worker].balance_mxn = (workerBalance * parseInt(ethValue.MXN));
          reportData.workers[worker].balance_usd = (workerBalance * parseInt(ethValue.USD));
        }
      };
      callback(reportData);
    })
  .walk();
};

getEthPrice(function(ethValue){})

function sendMessageToGroup(message){

}

app.get('/', function (req, res) {
  
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})