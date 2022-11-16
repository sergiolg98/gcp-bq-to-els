const PubSub = require('@google-cloud/pubsub');

const pubsubClient = PubSub({
  projectId: process.env.GCLOUD_PROJECT
});

const subClient = new PubSub.v1.SubscriberClient({
  projectId: process.env.GCLOUD_PROJECT
})

export async function sendPubsubMessage(topic: string, message: string, attributes?: any ) {  
  const att = (attributes) ? attributes : {}
  const publisher = pubsubClient.topic(topic).publisher()
  const data = Buffer.from(message)

  try{
    const results = await publisher.publish(data, att)
    //const messageIds = results[0]       
    return results
  }
  catch(err) {
      console.log(err)
      return null
  };

}

export async function pullPubSubMessage(subscription: string, totalMessages?: number) 
:Promise<{"attributes": any, "data": string, "messageId": string, "publishTime": any}[]>{
  const sub = subClient.subscriptionPath(process.env.GCLOUD_PROJECT, subscription)

  const request = {
    subscription: sub,
    maxMessages: (totalMessages) ? totalMessages : 1,
    returnImmediately: false
  }

  const opt = {
    timeout: 5000,
    retry: null
  }

  try{
    console.log('ANTES DE SUBCLIENT.PULL')
    let pullHub: any
    
    try{
      pullHub = await subClient.pull(request, opt)
    }
    catch(err){
      console.log('No message to pull')
      return []
    }

    const receivedMessages = pullHub[0].receivedMessages
    const messages :{"attributes": any, "data": string, "messageId": string, "publishTime": any}[] = []
    const ackIds = []
    
    for(const message of receivedMessages ){
      ackIds.push(message.ackId)
      messages.push(message.message)
    }


    if(ackIds.length !== 0) {
      const ackRequest = {
        subscription: sub,
        ackIds: ackIds,
      };
      await subClient.acknowledge(ackRequest)
    }
    
    return messages

 }catch(err){
   console.info(err)
   return []
 }
}