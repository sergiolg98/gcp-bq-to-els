const { Client } = require('@elastic/elasticsearch');
import * as config from '../config'

const client = new Client({
    node: `${config.Config.elastic.protocol}://${config.Config.elastic.hosts}:${config.Config.elastic.port}`,
    auth: {
      username: config.Config.elastic.username,
      password: config.Config.elastic.password
    }
})

export async function searchByObjectLastDate(index:string, query:any) :Promise< string >{
    try{
        const results = await client.search({
            index: index,
            body: query
        })
        if(results.body.aggregations.max_date.value_as_string || results.body.aggregations.max_date.value_as_string !== undefined ||results.body.aggregations.max_date.value_as_string !== null ){
            return results.body.aggregations.max_date.value_as_string
        }
        return ''
    }
    catch(err){
        console.error(err)
        return ''
    }
}

export async function bulkImport(data: Array<any>) : Promise<boolean>{
    try{          
        let result = await client.bulk({body: data})            
        return result.body.errors
    }catch(err){
        console.error(err)
        return false
    }
}