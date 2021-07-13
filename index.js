const express = require('express');
const app = express();

const _ = require('lodash');
const redisAdapter = require('socket.io-redis');
const { getData, setData } = require('./redis');

const server = app.listen(PORT, function() {
    console.log(`✔️ Server Started (listening on PORT : ${PORT})`);
});

const kafka = new Kafka({
    clientId: "messagesystem",
    brokers: ["192.168.18.9:29092"]
})

app.use(express.urlencoded({ extended: true }))
app.post("/", async(req, res) => {
    try {
        // CHECK IF THE USER IS ALREADY IN THE CACHE
        // ADD NEW USER TO CACHE AND CREATE A NEW TOPIC
        let alreadyRegistered = await getData(req.body.phone)
        if (alreadyRegistered == null) {
            if (await setData(req.body, `${req.body.phone}`) == true) {
                const admin = kafka.admin()
                await admin.connect()

                await admin.createTopics({
                    topics: [{
                        topic: req.body.phone,
                        numPartitions: 2
                    }]
                })
                console.log("TOPICS CREATED .... ", req.body.phone)
                await admin.disconnect()
            } else {
                res.status(400).send("Problem creating your user")
            }
        }
    } catch (e) {
        res.status(500).send("SOMETHING WENT WRONG!")
    }
})


const io = require('socket.io').listen(server)
io.adapter(redisAdapter({ host: 'localhost', port: 6379 }));
io.on('connect', (socket) => {
    console.log(`✔️ Socket Started`, socket.id);

    let alreadyRegistered = await getData(req.body.phone)

    const consumer = kafka.consumer({ groupId: alreadyRegistered.id })

    if (alreadyRegistered != null) {
        socket.on("join", async() => {
            await consumer.connect()
            await consumer.subscribe({
                topic: alreadyRegistered.phone,
                fromBeginning: true
            })

            await consumer.run({
                eachMessage: async result => {
                    console.log(`RVD msg: ${result.message.value} on partition ${result.partition}`)
                    socket.emit("message", result)
                }
            })
        })
    }

    socket.on('disconnect', () => {
        console.log("User disconnected", socket.id)
        await consumer.disconnect()
    })

    socket.on('sendMessage', async({ message, phone }) => {
        if (message != null && message != "") {
            const producer = kafka.producer()
            await producer.connect()
            const result = await producer.send({
                topic: phone,
                messages: [{
                    value: message,
                    partition: 1
                }]
            })
            console.log(`Sent ${JSON.stringify(result)}`)
            socket.emit("message", result)
            await producer.disconnect()
        }
    });
});