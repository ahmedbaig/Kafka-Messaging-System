const { Kafka } = require("kafkajs")
const msg = process.argv[2]
async function run() {
    try {
        const kafka = new Kafka({
            clientId: "myapp",
            brokers: ["192.168.18.9:29092"]
        })
        const consumer = kafka.consumer({ groupId: "test" })
        await consumer.connect()
        await consumer.subscribe({
            topic: 'Users',
            fromBeginning: true
        })

        await consumer.run({
            eachMessage: async result => {
                console.log(`RVD msg: ${result.message.value} on partition ${result.partition}`)
            }
        })
    } catch (e) {
        console.log(e)
    }
}

run();