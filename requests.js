const businessIds = require('./data/businessIds.json')
const businessRefs = require('./data/businessRefs.json')

let groupIndex = 1;
const requestMaker = ( url, headers, verb, test, repeats, offsetTime = 50, name = null) => 
{
    return {
        name: name || 'GROUP ' + groupIndex.toString(),
        index: groupIndex++,
        url,
        headers,
        verb,
        test,
        repeats,
        offsetTime
    }
}

let requests = []

const headers = {
    'Authorization': 'Basic YWRtaW46c2VjcmV0'
}

const variables = { // Arrays of variables that will be chosen at random when named in request urls
    BUSINESSID: businessIds,
    BUSINESSREF: businessRefs
}

const ROOT_URL = 'http://localhost:8081/party-api/v1'
const checkSuccessCode = (res) => res.statusCode === 200

requests.push( requestMaker(`${ROOT_URL}/businesses?id={{BUSINESSID}}`, headers, 'GET', checkSuccessCode, 10000, 'Get business by partyId') )
requests.push( requestMaker(`${ROOT_URL}/businesses/ref/{{BUSINESSREF}}`, headers, 'GET', checkSuccessCode, 10000, 'Get business by business ref'))

module.exports = {
    requests, variables
}