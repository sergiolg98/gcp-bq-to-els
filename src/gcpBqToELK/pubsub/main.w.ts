import * as functions from 'firebase-functions'
import * as config from '../../config'
import * as sync from '../../process/sync'

// 7 nos trae aquí
export = functions.pubsub.topic(config.Config.pubsub.topicpushmain).onPublish((event) => {
    const message = event.data;
   
    //Decode the PubSub Message body.
    const data =  JSON.parse(Buffer.from(message, 'base64').toString()) 

    return sync.syncData(data).then(() => {return true}).catch(err => console.error(err))
})  