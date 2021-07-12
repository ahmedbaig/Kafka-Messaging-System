const redis = requrie("redis")
const redisScan = require('node-redis-scan');
const _ = require('lodash');

const client = redis.createClient({})
client.on("error", function(error) {
    console.error("❗ ", error);
});

export function searchData(pattern) {
    return new Promise(async(resolve, reject) => {
        try {
            scanner = new redisScan(client)
            scanner.scan(pattern, async(err, matchingKeys) => {
                if (err) reject(err);
                Promise.all(matchingKeys.map(key => {
                    console.log(key)
                    return new Promise((resolve, reject) => {
                        try {
                            this.getData(`${key}`).then(data => {
                                if (data !== null) {
                                    resolve(data);
                                } else {
                                    resolve(null);
                                }
                            });
                        } catch (error) {
                            reject(error.message);
                        }
                    });
                })).then(data => {
                    resolve(_.reverse(_.sortBy(data, [function(o) { return o.trend }])))
                })
            });
        } catch (error) {
            reject(error.message);
        }
    });
}

export function setData(data, key, exp = 3600) {
    return new Promise((resolve, reject) => {
        try {
            if (exp == 0) {
                client.setex(`${key}`, 48 * 60 * 60 * 1000, JSON.stringify(data)); //2 day record
            } else {
                client.setex(`${key}`, exp, JSON.stringify(data));
            }
            resolve(true);
        } catch (error) {
            reject(error.message);
        }
    });
}

export function getData(key) {
    return new Promise((resolve, reject) => {
        try {
            client.get(`${key}`, (err, data) => {
                if (err) throw err;
                if (data !== null) {
                    resolve(JSON.parse(data));
                } else {
                    resolve(null);
                }
            });
        } catch (error) {
            reject(error.message);
        }
    });
};