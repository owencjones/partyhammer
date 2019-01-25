#!/usr/bin/env node
const args = process.argv
if (args.length !== 3) {
    console.error('Takes only one argument: [filename]')
    process.exit(1)
}

const filename = args[2]

if (!filename.endsWith('.json')) {
    console.error('input must be a json file')
    process.exit(1)
}

const results = require('./'+filename)

const repeatArgs = [100, 200, 500, 1000]
const offsetArgs = [50, 100, 200, 1000, 2000]

const statuses = [200, 404, 0, 500]

console.log(`| Offset | Success (\`200\`) | No Response | \`400\` | \`500\` |`)
console.log(`|--------|-----------------|-------------|-------|-------|`)

let linePrint = '';
offsetArgs.forEach(offset => {
    //repeatArgs.forEach(repeats => {
        linePrint += `| ${offset} |`
        statuses.forEach(status => {
            const thisGroup = results
                //.filter(result => result.group.includes(`reps: ${repeats}`) > -1)
                .filter(result => result.group.includes(`offset: ${offset}`))
                const numberWithStatus = thisGroup.filter(result => result.statusCode === status).length;
                const percentageWithStatus = Number((numberWithStatus / thisGroup.length) * 100).toFixed(2)
            linePrint += ` ${percentageWithStatus} |`
        })
        linePrint += '\n'
    //});
})
console.log(linePrint+'\n')