# Overview

Proof of Concept on Saleforce CDC consumer 

# Goals
* consume sf cdc messages from https://pieinsurance--dev.my.salesforce.com/
* publish messages to sns
* consume message in existing pie .net workers (e.g. Policy, Marketing, etc.)

# Data Flow

```
salesforce cdc --> sf-cdc (this project) --> aws sns --> .NET consumers (or others)
```


# Setup

```bash
# add .env file and fill out appropriately
cp .env.example .env
```

# Build

```bash
# nvm install needed before below runs
nvm use
# install dependencies
npm install
# install bunyan globally for pretty logs
npm install bunyan -g
```


# Usage

```bash
node index.mjs | bunyan
```

# Notes
* hardcoded to specific aws sns arn for POC
* hardcoded to only Lead change event for POC
* .NET consumer is Policy branch `spike/INS-1337-native-spike` running in AWS Sandbox env from dev machine
