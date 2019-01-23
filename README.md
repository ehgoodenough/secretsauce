# secretsauce #

A utility for saving your secrets in AWS DynamoDB.

### How to Use ###

From the command-line:

```
npm install --global secretsauce

secretsauce set EXAMPLE 1234567890
secretsauce get EXAMPLE
```

From the code:

```js
const secretsauce = require("secretsauce")

secretsauce.get("EXAMPLE").then((secret) => {
    console.log(secret)
    console.log(secretsauce.cache["EXAMPLE"])
})
```
