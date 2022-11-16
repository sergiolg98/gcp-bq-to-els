import * as functions from 'firebase-functions'
import * as config from '../../config'
import * as sync from '../../process/sync'

export = functions.pubsub.topic(config.Config.pubsub.topicpushsecundary).onPublish((event) => {
    const message = event.data;
   
    //Decode the PubSub Message body.
    const data =  JSON.parse(Buffer.from(message, 'base64').toString())  
    
    //11
    return sync.pullMessagesToSync(data).then(() => {return true}).catch(err => console.error(err))
})  