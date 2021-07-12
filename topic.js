const { Kafka } = require("kafkajs")

async function run() {
    try {
        const kafka = new Kafka({
            clientId: "myapp",
            brokers: ["192.168.18.9:29092"]
        })
        const admin = kafka.admin()
        await admin.connect()

        await admin.createTopics({
            topics: [{
                topic: 'Users',
                numPartitions: 2
            }]
        })
        console.log("TOPICS CREATED .... ")
        await admin.disconnect()
    } catch (e) {
        console.log(e)
    } finally {
        process.exit(1)
    }
}

run();