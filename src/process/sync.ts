import * as moment from 'moment'
import { v4 as uuidv4 } from 'uuid';

import * as pubsub from '../services/pubsub'
import * as bigquery from '../services/bigquery'
import * as config from '../config'
import * as elasticsearch from '../services/elastic'

//ok
export function getDatesToSync(aStartDate: string): Array<{"startDate": string, "endDate": string }>{
    
    const startDate = moment(aStartDate).utc()

    if(!startDate.isValid()){
        console.log(`Invalid date to sync ${aStartDate}`)
        return []
    }
    
    let d = startDate
    const now = moment().utc()
   
    const data: Array<{ "startDate": string, "endDate": string}> = []
    while(d.isBefore(now, 'day')){  
        const startDateFormat = d.format('YYYY-MM-DD HH:mm:ss')
        d = d.add(24, 'h')
        data.push({
            'startDate': startDateFormat,
            'endDate': d.format('YYYY-MM-DD HH:mm:ss') 
        })
    }
    return data
}

//2 
export async function syncDates(){
   
    //Ir a buscar a ELK la fecha ultima y guardarla en lastSyncDate
    let query = { 
        "aggs" : { 
            "max_date": {"max": {"field": "date", "format": "yyyy-MM-dd"}} 
        } 
    }
    let lastSyncDate = await elasticsearch.searchByObjectLastDate(config.Config.elastic.searchindex, query)
    console.log('PROPER LOG - ES lastsyncdate: ', lastSyncDate)

    
    //Sino esta buscarla en Big Query y guardarla en esa misma variable
    if(!lastSyncDate || lastSyncDate === '' || lastSyncDate === 'undefined'){
        lastSyncDate = await bigquery.getMinDate(config.Config.bigquery.dataset, config.Config.bigquery.table)
        console.log('PROPER LOG - BIGQUERY lastsyncdate: ', lastSyncDate)
    }
   
    if(!lastSyncDate) return false

    const messages = getDatesToSync(lastSyncDate)
    const prom = []
  
    //3
    for(const d of messages){              
        prom.push(pubsub.sendPubsubMessage(config.Config.pubsub.topicpull, JSON.stringify(d)))
    }
    
    try{
        if(prom.length == 0) return true
        let r = await Promise.all(prom)
        console.log(`PROPER LOG - Se enviaron ${r.length} mensajes to sync.`)
        
        return true
    } 
    catch(err){
        console.error(err)
        return false
    } 
}

export function transformCoordinates (wellKnownPoint: string){

    let lat_long = wellKnownPoint.substring(wellKnownPoint.indexOf("(")+1, wellKnownPoint.indexOf(")"))
    let longitude = lat_long.substring(0, lat_long.indexOf(' '))
    let latitude = lat_long.substring(lat_long.indexOf(' ')+1, lat_long.length)

    let obj = {
        lat: parseFloat(latitude),
        lon: parseFloat(longitude)
    }
    return obj
}

export async function syncData(fecha: { "startDate": string, "endDate": string}){

    try{
		let dataset = config.Config.bigquery.dataset
		let table = config.Config.bigquery.table
		
        const query = `SELECT * 
                        FROM ${dataset}.${table}                         
                        WHERE TIMESTAMP(date) >=  TIMESTAMP("${fecha.startDate}") AND TIMESTAMP(date) < TIMESTAMP("${fecha.endDate}")`
        
        const data = await bigquery.runQuery(query)        
        if(data && data.length > 0){

            const ops : any[] = [];
            data.forEach(row => {
                // For each row returned in the previous query insert it on Elasticsearch server via ES REST API
                let bulk = {
                    index: {_index: config.Config.elastic.searchindex, _id: uuidv4()}
                };
                
                let obj_insert: any = {}

                obj_insert.invoice_and_item_number = row.invoice_and_item_number !== null ? row.invoice_and_item_number : null
                obj_insert.date = row.date.value !== null ? row.date.value : null
                obj_insert.store_number = row.store_number !== null ? row.store_number : null
                obj_insert.store_name = row.store_name !== null ? row.store_name : null
                obj_insert.address = row.address !== null ? row.address : null;
                obj_insert.city = row.city !== null ? row.city : null;
                obj_insert.zip_code = row.zip_code !== null ? row.zip_code : null;
                obj_insert.store_location = row.store_location !== null ? transformCoordinates(row.store_location) : null;
                obj_insert.county_number = row.county_number !== null ? row.county_number : null;
                obj_insert.county = row.county !== null ? row.county : null;
                obj_insert.category = row.category !== null ? row.category : null;
                obj_insert.category_name = row.category_name !== null ? row.category_name : null;
                obj_insert.vendor_number = row.vendor_number !== null ? row.vendor_number : null;
                obj_insert.vendor_name = row.vendor_name !== null ? row.vendor_name : null;
                obj_insert.item_number = row.item_number !== null ? row.item_number : null;
                obj_insert.item_description = row.item_description !== null ? row.item_description : null;
                obj_insert.pack = row.pack !== null ? row.pack : null; 
                obj_insert.bottle_volume_ml = row.bottle_volume_ml !== null ? row.bottle_volume_ml : null; 
                obj_insert.state_bottle_cost = row.state_bottle_cost !== null ? row.state_bottle_cost : null;
                obj_insert.state_bottle_retail = row.state_bottle_retail !== null ? row.state_bottle_retail : null;
                obj_insert.bottles_sold = row.bottles_sold !== null ? row.bottles_sold : null; 
                obj_insert.sale_dollars = row.sale_dollars !== null ? row.sale_dollars : null;
                obj_insert.volume_sold_liters = row.volume_sold_liters !== null ? row.volume_sold_liters : null;
                obj_insert.volume_sold_gallons = row.volume_sold_gallons !== null ? row.volume_sold_gallons : null;
                
                ops.push(bulk)
                ops.push(obj_insert)
            })
    
            if(ops.length > 0){                   
                console.log(`Syncing ${data.length} rows to elasticsearch`)
                
                //9
                console.log('PROPER LOG - mando desde la funcion sync a que haga el bulkImport')
                const result = await elasticsearch.bulkImport(ops)                   
                if(!result){
                    console.log(`Total data lost: ${data.length}`)
                }
            }
        }

        //10
        await pubsub.sendPubsubMessage(config.Config.pubsub.topicpushsecundary, "1")
        return true
    }catch(err){
        console.log(err)       
        return false
    }
}

//ok
export async function pullMessagesToSync(amt: number): Promise<boolean>{

    try{
        //5
        const msg = await pubsub.pullPubSubMessage(config.Config.pubsub.subscriptiontopicpull, amt)
        const data = []    
        //6
        for (const m of msg){            
            data.push(pubsub.sendPubsubMessage(config.Config.pubsub.topicpushmain, Buffer.from(m.data, 'base64').toString()))
        }

        if(data.length > 0) await Promise.all(data)
        return true;
    }
    catch(err) {
        console.error(err)
        return false
    }
}
