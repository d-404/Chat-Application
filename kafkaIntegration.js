const kafka = require('kafka-node');

// Set up Kafka client
const client = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' });
const producer = new kafka.Producer(client);
const Consumer = kafka.Consumer;

// Create a Kafka producer
producer.on('ready', () => {
    console.log('Kafka Producer is ready');
});

producer.on('error', (error) => {
    console.error('Error initializing Kafka producer:', error);
});

// Set up Kafka consumer
const consumer = new Consumer(client, [{ topic: 'messages' }], { groupId: 'message-group' });

consumer.on('message', (message) => {
    try {
        const messageData = JSON.parse(message.value);
        console.log('Received message:', messageData);

        deliverMessageToUser(messageData);
    } catch (error) {
        console.error('Error processing message:', error);
    }
});

function deliverMessageToUser(messageData) {

    console.log(`Delivering message to user ${messageData.receiverId}: ${messageData.messageContent}`);
}


consumer.on('error', (error) => {
    console.error('Error in Kafka consumer:', error);
});

module.exports = { producer };
