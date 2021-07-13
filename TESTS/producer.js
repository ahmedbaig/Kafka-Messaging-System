const { Kafka } = require("kafkajs")
const msg = process.argv[2]
async function run() {
    try {
        const kafka = new Kafka({
            clientId: "myapp",
            brokers: ["192.168.18.9:29092"]
        })
        const producer = kafka.producer()
        await producer.connect()
        const result = await producer.send({
            topic: "Users",
            groupId: "test",
            messages: [{
                value: msg,
                partition: msg[0] < "N" ? 0 : 1
            }]
        })
        console.log(`Sent ${JSON.stringify(result)}`)
        await producer.disconnect()
    } catch (e) {
        console.log(e)
    } finally {
        process.exit(1)
    }
}

run();