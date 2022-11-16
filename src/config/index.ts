'use strict'
import * as functions from 'firebase-functions'

export class Config {

  public static elastic = functions.config().elastic || { 
    username: "cloud_user", 
    searchindex: "sales",
    password: "Admin1234",
    hosts: "gcp-bq-to-els.es.us-east-2.aws.elastic-cloud.com",
    protocol: "https",
    port: 9243
  }

  public static pubsub = functions.config().pubsub || {
    topicpull: 'topic-pull',
    subscriptiontopicpull : 'subscription-topic-pull',
    topicpushmain : 'topic-push-main',
    topicpushsecundary: 'topic-push-secundary'
  }

  public static bigquery = functions.config().bigquery || {
    dataset: 'bigquery-public-data.iowa_liquor_sales',
    table : 'sales',
  }

}