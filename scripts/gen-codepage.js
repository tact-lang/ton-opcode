let js2ts = require('json-schema-to-typescript')
let fs = require('fs')

// compile from file
js2ts.compileFromFile(__dirname + '/../src/tvm-spec/schema.json')
  .then(ts => fs.writeFileSync(__dirname + '/../src/codepage/tvm-spec.d.ts', ts))