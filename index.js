const fs = require('fs')
const { cursorUp } = require('ansi-escapes')
const request = require('request')
const chalk = require('chalk')
const { csvBuffered } = require('json-csv')

const requestConfig = require('./requests')

const masterListOfRequests = {}
let results = [];

console.log(`${chalk.whiteBright('🔨 PartyHammer - a quick and dirty utility for firing API calls at RAS-Party with disturbing speed')}

\t`)

const nowString = `${new Date().toISOString()}`

const reportFileName = `report_${nowString}.txt`;
const reportStream = fs.createWriteStream(reportFileName);

reportStream.on('error', error => {
    console.error('Could not write report', error)
})

const addReportLine = (str) => reportStream.write(str, error =>  {
    if (error) {
        console.error(error)
    }
});

addReportLine(`
PartyHammer Report

Started at ${nowString}

`)

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
                const variableValue = requestConfig.variables[variableName]

                if (Array.isArray(variableValue)) {
                    returnUrl = returnUrl.replace(new RegExp(`{{${variableName}}}`, 'g'), randomMemberOfArray(variableValue));
                }
                if (variableValue instanceof Function) {
                    returnUrl = returnUrl.replace(new RegExp(`{{${variableName}}}`, 'g'), variableValue());
                }
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
        addReportLine(`Skipped group ${group} as the array was empty`);
        return;
    }

    const offset = groupArray[0].offset

    addReportLine(`
    Testing group: ${group}
    Requests to perform: ${groupArray.length}
    Request offset: ${offset}

    
    `)

    const requestPromises = groupArray.map(req => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const startTime = Date.now();
                const options = {
                    method: req.verb,
                    url: req.url,
                    headers: req.headers
                }

                if (req.payload) {
                    if (req.payload.json) {
                        options.json = true
                    }
                    if (req.payload.body) {
                        options.body = req.payload.body
                    }
                }

                request(options, (error, response, body) => {
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
            const theseResults = results.filter(result => result.group === group)
            responseTimes = theseResults.map(result => result.timeTaken)

            addReportLine(`
        
            ${group} Complete.

            Group URL example: ${theseResults[0].url}
        
            Requests made: ${theseResults.length},
            Requests successful: ${theseResults.filter(res => res.statusCode === 200).length}
            
            Requests zero: ${theseResults.filter(res => res.statusCode === 0).length}
            Requests 2xx: ${theseResults.filter(res => res.statusCode.toString().startsWith('2')).length}
            Requests 3xx: ${theseResults.filter(res => res.statusCode.toString().startsWith('3')).length}
            Requests 4xx: ${theseResults.filter(res => res.statusCode.toString().startsWith('4')).length}
            Requests 5xx: ${theseResults.filter(res => res.statusCode.toString().startsWith('5')).length}
        
            Longest response: ${Math.max(...responseTimes)}
            Shortest response ${Math.min(...responseTimes)}
            Mean avg response: ${responseTimes.reduce((a, b) => (a + b), 0) / responseTimes.length}
            `)
        })
    )
})

Promise.all(masterPromises)
    .then(() => {
        clearInterval(updater)
        addReportLine('Done.')
        reportStream.end()
        fs.writeFile(`results_${nowString}.json`, JSON.stringify(results, null, 4), error => {
            if (error) {
                throw error
            }
            csvBuffered(results, {
                fields:[
                    { name: 'group', label: 'Group' },
                    { name: 'statusCode', label: 'HTTP Response' },
                    { name: 'timeInitiated', label: 'Start time' },
                    { name: 'timeTaken', label: 'Response (ms)' },
                    { name: 'url', label: 'URL' },
                ]
            }, (error, csv) => {
                if (error) {
                    throw error
                }
                fs.writeFile(`results_${nowString}.csv`, csv, error => {
                    if (error) {
                        throw error
                    }
                    
                    console.log('All tests completed')
                })
            })
        });
    })
