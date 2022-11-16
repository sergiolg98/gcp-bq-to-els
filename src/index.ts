'use strict'
/** EXPORT ALL FUNCTIONS
 *
 *   Loads all `.f.js` files
 *   Exports a cloud function matching the file name
 *
 *   Based on this thread:
 *     https://github.com/firebase/functions-samples/issues/170
 */
import * as glob from 'glob'
import * as camelCase from 'camelcase'
import * as functions from 'firebase-functions'
import * as express from 'express'

const app = express()
const router = express.Router()

const files = glob.sync( './**/*.?(f|w).js', { cwd: __dirname, ignore: './node_modules/**' })
//['./**/*.f.js', './**/*.p.js']
//router.get('/', (req, res) => {res.send('root')})

for (let f = 0, fl = files.length; f < fl; f++) {
    
  const file : string = files[f]
  if(file.endsWith('.f.js'))
 {
    const temp = file.slice(0, -5).replace('./','').split('/')  
    const functionName = temp[0] //camelCase(file.slice(0, -5).split('/').join('_')) // Strip off '.f.js'
    
    if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === functionName) {
      router.use(`/`, require(file))    
      app.use('/', router)
      exports[functionName] = functions.https.onRequest(app)
    }
 }
 else if(file.endsWith('.w.js')){
   //camelCase(.join('_'))
  
  let functionName = camelCase(file.slice(0, -5).replace('./','').split('/').join('_')) // Strip off '.p.js'
  functionName =  functionName.replace(/Pubsub/g, 'OnPublish')  
  exports[functionName] =  require(file)
    
 }
}