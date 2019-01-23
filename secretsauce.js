#! /usr/bin/env node

const AWS = require("aws-sdk")
AWS.config.region = process.env.AWS_REGION || "us-west-2"

const dynamo = new AWS.DynamoDB()
const dynamodoc = new AWS.DynamoDB.DocumentClient()

const secretsauce = module.exports = {"cache": {}}

const SECRET_TABLE = {
    TableName : "secrets",
    KeySchema: [{AttributeName: "name", KeyType: "HASH"}],
    AttributeDefinitions: [{AttributeName: "name", AttributeType: "S"}],
    ProvisionedThroughput: {ReadCapacityUnits: 5, WriteCapacityUnits: 5}
}

secretsauce.set = async function(name, secret) {
    await dynamo.createTable(SECRET_TABLE).promise().catch((error) => {
        if(error.name !== "ResourceInUseException") {
            throw error
        }
    })

    return await dynamodoc.put({
        "TableName": "secrets",
        "Item": {"name": name, "secret": secret}
    }).promise()
}

secretsauce.get = async function(name) {
    if(secretsauce.cache[name] !== undefined) {
        return Promise.resolve(secretsauce.cache[name])
    }

    let secret = await dynamodoc.get({
        "TableName": "secrets",
        "Key": {"name": name}
    }).promise().then((response) => {
        let item = response["Item"] || {}
        return item.secret
    })

    secretsauce.cache[name] = secret
    return secret
}

if(require.main === module) {
    const yargs = require("yargs")
    const chalk = require("chalk")

    const ACTION = yargs.argv._[0]
    const NAME = yargs.argv._[1] || yargs.argv.name
    const SECRET = yargs.argv._[2] || yargs.argv.secret

    if(ACTION === "set" && !!NAME && !!SECRET) {
        secretsauce.set(NAME, SECRET).then((item) => {
            console.log(`${chalk.blue(NAME)} → ${chalk.red(SECRET)}`)
        })
    } else if(ACTION === "get" && !!NAME) {
        secretsauce.get(NAME).then((secret) => {
            console.log(`${chalk.blue(NAME)} → ${chalk.red(secret)}`)
        })
    } else {
        console.log("Usage: secretsauce set EXAMPLE 12345")
        console.log("       secretsauce get EXAMPLE")
    }
}
