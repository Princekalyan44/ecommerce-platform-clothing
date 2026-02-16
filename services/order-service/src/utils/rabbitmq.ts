import amqp, { Channel, Connection } from 'amqplib';
import { config } from '../config';
import { logger } from './logger';

let connection: Connection | null = null;
let channel: Channel | null = null;

export const connectRabbitMQ = async (): Promise<void> => {
  try {
    connection = await amqp.connect(config.rabbitmq.url);
    channel = await connection.createChannel();
    
    // Declare exchanges
    await channel.assertExchange('order_events', 'topic', { durable: true });
    
    // Declare queues
    await channel.assertQueue('order_created', { durable: true });
    await channel.assertQueue('order_status_changed', { durable: true });
    await channel.assertQueue('inventory_reserved', { durable: true });
    
    // Bind queues to exchanges
    await channel.bindQueue('order_created', 'order_events', 'order.created');
    await channel.bindQueue('order_status_changed', 'order_events', 'order.status.changed');
    await channel.bindQueue('inventory_reserved', 'order_events', 'order.inventory.reserved');
    
    logger.info('RabbitMQ connection established');
  } catch (error) {
    logger.error('RabbitMQ connection failed', { error });
    throw error;
  }
};

export const publishEvent = async (exchange: string, routingKey: string, message: any): Promise<void> => {
  try {
    if (!channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    
    const messageBuffer = Buffer.from(JSON.stringify(message));
    channel.publish(exchange, routingKey, messageBuffer, { persistent: true });
    
    logger.info('Event published', { exchange, routingKey, message });
  } catch (error) {
    logger.error('Failed to publish event', { error, exchange, routingKey });
    throw error;
  }
};

export const getChannel = (): Channel => {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  return channel;
};
