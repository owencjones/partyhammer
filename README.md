# Party Hammer

## Quick and dirty tool for hammering the party service to assess performance

### Dependencies

* NVM by Creationix
* NPM
* Node

```bash
$ nvm use
$ npm install
$ npm start

node index.js

🔨 PartyHammer - a quick and dirty utility for firing API calls at RAS-Party with disturbing speed

Done 60 of 4000 (2%)
```

Continues until done, then outputs a file with a name like `results_2019-01-01T00:00:00z`, and creates a version with both a CSV and JSON extension.  CSV is useful for spreadsheet analysis, graphing etc., JSON is useful for programmatic assessment and works with the parser.

Running the hammer also generates some basic info and metrics in a `.txt` report file, but this has been pretty much superseded by the `resultparser`.

### `resultparser.js` - Making metrics from results

Running the `resultparser.js` file, with the argument of the name of a results file in JSON format will output a summary of the major metrics involved, calculating averages etc.  Output is in Markdown format, for inclusion in reports that use Markdown.  Converters can be used to make MD into other formats.

```bash
$ ./resultsparser.js results_[ISODATESTRINGHERE].json

Total Sample Size: 16200

#### Request Count: 100
| Offset | Success (`200`) | No Response | `404` | `500` |
|--------|-----------------|-------------|-------|-------|
| 50 | 3.91 | 51.33 | 7.42 | 37.33 |
| 100 | 2.18 | 71.09 | 4.24 | 22.48 |
| 200 | 14.33 | 44.33 | 28.09 | 13.24 |
| 1000 | NaN | NaN | NaN | NaN |
| 2000 | NaN | NaN | NaN | NaN |

#### Request Count: 200
| Offset | Success (`200`) | No Response | `404` | `500` |
|--------|-----------------|-------------|-------|-------|
| 50 | 9.17 | 42.83 | 16.00 | 32.00 |
| 100 | 3.67 | 44.50 | 8.33 | 43.50 |
| 200 | 2.67 | 42.17 | 6.17 | 49.00 |
| 1000 | NaN | NaN | NaN | NaN |
| 2000 | NaN | NaN | NaN | NaN |

#### Request Count: 500
| Offset | Success (`200`) | No Response | `404` | `500` |
|--------|-----------------|-------------|-------|-------|
| 50 | 3.87 | 43.33 | 6.60 | 46.20 |
| 100 | 2.40 | 51.07 | 5.93 | 40.60 |
| 200 | 1.80 | 71.33 | 3.67 | 23.20 |
| 1000 | NaN | NaN | NaN | NaN |
| 2000 | NaN | NaN | NaN | NaN |

#### Overall
| Offset | Success (`200`) | No Response | `404` | `500` |
|--------|-----------------|-------------|-------|-------|
| 50 | 4.48 | 48.17 | 8.15 | 39.20 |
| 100 | 2.41 | 62.57 | 5.17 | 29.85 |
| 200 | 9.56 | 51.59 | 18.87 | 19.98 |
| 1000 | NaN | NaN | NaN | NaN |
| 2000 | NaN | NaN | NaN | NaN |
#### Per-route
| Route | Success (`200`) | No Response | `404` | `500` |
|--------|-----------------|-------------|-------|-------|
| /businesses?id= | 16.44 | 53.91 | 0.00 | 29.65 |
| /businesses/id/ | 0.00 | 54.09 | 16.06 | 29.85 |
| /businesses/ref/ | 0.00 | 54.33 | 16.13 | 29.54 |
| _All Routes Combined_ | 5.48 | 54.11 | 10.73 | 29.68 |
```

