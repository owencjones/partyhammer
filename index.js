const fs = require('fs')
const { cursorUp } = require('ansi-escapes')
const request = require('request')
const chalk = require('chalk')

const requestConfig = require('./requests')

const masterListOfRequests = {}
let results = [];

console.log(`${chalk.whiteBright('🔨 PartyHammer - a quick and dirty utility for firing API calls at RAS-Party with disturbing speed')}

    Firing the cannon.`)

const addResult = (group, url, response, body, startTime, endTime, success) => {
    const resultsObj = {
        group,
        url,
        statusCode: response.statusCode,
        timeInitiated: startTime,
        timeTaken: endTime - startTime,
        success
    }

    if (!success) {
        resultsObj.debug = {
            response, body
        }
    };

    results.push(resultsObj)
}

const randomMemberOfArray = (array) => {
    const indexChosen = Math.round(Math.random() * (array.length - 1))
    return array[indexChosen]
}

const replaceVariables = (url) => {
    const matcher = new RegExp('{{([A-Z]+)}}', 'g');
    let matches = url.match(matcher);
    if (Array.isArray(matches)) {
        let returnUrl = url;
        let variablesInUrl = matches.map(match => match.replace(/[{}]/g, ''))
        variablesInUrl.forEach(variableName => {
            if (variableName in requestConfig.variables) {
                returnUrl = returnUrl.replace(new RegExp(`{{${variableName}}}`, 'g'), randomMemberOfArray(requestConfig.variables[variableName]));
            }
        })
        return returnUrl
    }

    return url
}

requestConfig.requests.forEach(req => {
    let groupArray = [];
    for (let i = 0; i < req.repeats; i++) {
        groupArray.push({
            url: replaceVariables(req.url),
            verb: req.verb,
            headers: req.headers,
            test: req.test,
            index: i,
            offset: req.offsetTime
        })
    }
    masterListOfRequests[req.name] = groupArray;
})

let masterPromises = [];

const totalNumberToPerform = Object.values(masterListOfRequests).reduce((a,b) => a + b.length, 0);
let numberDone = 0;
const progressPrint = () => console.log(`${cursorUp(2)}Done ${numberDone} of ${totalNumberToPerform}\n(${Math.round(100 * (numberDone / totalNumberToPerform))}%)`)

const updater = setInterval(progressPrint, 500);

Object.keys(masterListOfRequests).forEach(group => {
    const groupArray = masterListOfRequests[group];
    if (!Array.isArray(groupArray) || groupArray.length === 0) {
        console.log(`Skipped group ${group} as the array was empty`);
        return;
    }

    const offset = groupArray[0].offset

    console.log(`
    Testing group: ${group}
    Requests to perform: ${groupArray.length}
    Request offset: ${offset}

    
    `)

    const requestPromises = groupArray.map(req => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const startTime = Date.now();
                request({
                    method: req.verb,
                    url: req.url,
                    headers: req.headers
                },
                (error, response, body) => {
                    if (error) {
                        addResult(group, req.url, {statusCode: 0}, '', startTime, Date.now(), error);
                    } else {
                        addResult(group, req.url, response, body, startTime, Date.now(), req.test(response));
                    }
                    numberDone++;
                    resolve();
                })
            }, offset * req.index)
            
        })
    })

    masterPromises.push(
    Promise
        .all(requestPromises)
        .then( () => {
            responseTimes = results.map(result => result.timeTaken)
            fs.writeFileSync('results.json', JSON.stringify(results, null, 4));
            console.log(`
        
            ${group} Complete.

            Group URL example: ${groupArray[0].url}
        
            Requests made: ${groupArray.length},
            Requests successful: ${results.filter(res => res.statusCode === 200).length}
            
            Requests zero: ${results.filter(res => res.statusCode === 0).length}
            Requests 2xx: ${results.filter(res => res.statusCode.toString().startsWith('2')).length}
            Requests 3xx: ${results.filter(res => res.statusCode.toString().startsWith('3')).length}
            Requests 4xx: ${results.filter(res => res.statusCode.toString().startsWith('4')).length}
            Requests 5xx: ${results.filter(res => res.statusCode.toString().startsWith('5')).length}
        
            Longest response: ${Math.max(...responseTimes)}
            Shortest response ${Math.min(...responseTimes)}
            Mean avg response: ${responseTimes.reduce((a, b) => (a + b)) / responseTimes.length}
            `)
        })
    )
})

Promise.all(masterPromises)
    .then(() => {
        clearInterval(updater)
        console.log('All tests completed')
    })