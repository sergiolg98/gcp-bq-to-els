import * as express from 'express'

import * as sync from '../process/sync'

const router = express.Router()

router.get('/', (req, res) =>{
    res.send('GCP Big Query to Elasticsearch Syncing Tool')
})

//1
router.get('/sync', (req, res) =>{  
	sync.syncDates().then(r => {
			if(r)
				res.send('ok')
			else
				res.send('fail')
		})
		.catch(err => {
			console.error(err)
			res.send('fail')
		})
})


//4
router.get('/pull', (req, res) =>{

    //5
    sync.pullMessagesToSync(5).then(r => {
        if(r)
            res.send('ok')
        else
            res.send('fail')
    })
    .catch(err => {
        console.error(err)
        res.send('fail')
    })    
})

export = router