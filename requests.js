const businessIds = require('./data/businessIds.json')
const businessRefs = require('./data/businessRefs.json')

let groupIndex = 1;
const requestMaker = ( url, headers, payload, verb, test, repeats, offsetTime = 50, name = null) => 
{
    const returnObj = {
        name: name || 'GROUP ' + groupIndex.toString(),
        index: groupIndex++,
        url,
        headers,
        verb,
        test,
        repeats,
        offsetTime
    }

    if (payload && ['PUT', 'POST', 'PATCH', 'UPDATE'].includes(verb)) {
        returnObj.payload = payload
    }

    return returnObj;
}

let requests = []

const headers = {
    'Authorization': 'Basic YWRtaW46c2VjcmV0'
}

const variables = { // Arrays of variables that will be chosen at random when named in request urls
    BUSINESSID: businessIds,
    BUSINESSREF: () => "cheese",
}

const ROOT_URL = 'http://localhost:8081/party-api/v1'
const checkSuccessCode = (res) => res.statusCode === 200

// Business related
requests.push( requestMaker(`${ROOT_URL}/businesses?id={{BUSINESSID}}`, headers, null, 'GET', checkSuccessCode, 100, 'Get business by partyId - old') )
requests.push( requestMaker(`${ROOT_URL}/businesses/id/{{BUSINESSID}}`, headers, null, 'GET', checkSuccessCode, 100, 'Get business by partyId - new') )
requests.push( requestMaker(`${ROOT_URL}/businesses/ref/{{BUSINESSREF}}`, headers, null, 'GET', checkSuccessCode, 100, 'Get business by business ref'))

// Sample linking
//requests.push( requestMaker(`${ROOT_URL}/businesses/ref/{{BUSINESSREF}}`, headers, null, 'GET', checkSuccessCode, 10000, 'Get business by business ref', ))


module.exports = {
    requests, variables
}