const kafka = require('kafka-node');

// Setting up Kafka Broker
const client = new kafka.KafkaClient({ kafkaHost: 'localhost:9091' });
const kafkaProducer = new kafka.Producer(client);

// Creating a Producer
kafkaProducer.on('ready', () => {
    console.log('Kafka Producer is ready to send messages....');
});

kafkaProducer.on('error', (error) => {
    console.error('!!Error starting Kafka producer!! :', error);
});

// Creating a Consumer
const kafkaConsumer = new Consumer(client, [{ topic: 'message-topic' }], { groupId: 'message-group' });

kafkaConsumer.on('message', (message) => {
    try {
        const messageData = JSON.parse(message.value);
        console.log('Received message:', messageData);

        deliverMessageToUser(messageData);
    } catch (error) {
        console.error('!!Error in processing message!! :', error);
    }
});


// Sending message to user.
function deliverMessageToUser(messageData) {
    console.log(`Sending message to recepient... ${messageData.receiverId}: ${messageData.messageContent}`);
}


kafkaConsumer.on('error', (error) => {
    console.error('!!Error in Kafka Consumer!! :', error);
});

module.exports = { kafkaProducer };
