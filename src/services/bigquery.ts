
const BigQuery = require('@google-cloud/bigquery');

const BigQueryClient = BigQuery({
            projectId: process.env.GCLOUD_PROJECT
});

export async function runQuery(sqlQuery: string): Promise<Array<any>>{

	const options = {
		query: sqlQuery,
		timeoutMs: 10000, // Time out after 10 seconds.
		useLegacySql: false, // Use standard SQL syntax for queries.
	};

	try{
	   const results = await BigQueryClient.query(options)
	   const rows = results[0]
			   
	   return rows

	}
	catch(err){
		console.log('ERROR:', err.errors)
		return []
	}       
}

export async function getMinDate(datasetName: string, tableName: string): Promise<string>{

	const sqlQuery = `SELECT min(date) as first_date FROM ${datasetName}.${tableName}`;
	const options = {
		query: sqlQuery,
		timeoutMs: 600000, // Time out after 10 seconds.
		useLegacySql: false, // Use standard SQL syntax for queries.
	};

	return BigQueryClient
		.query(options)
		.then((results : any) => {                
			const rows = results[0];
			if (rows[0].first_date !== null)
				return rows[0].first_date.value
		})
		.catch((err:any) => {
			console.error('ERROR:', err.errors)
			return null
		});            
}

