import { Client } from '@elastic/elasticsearch';
import { config } from '../config';
import { logger } from '../utils/logger';

export const elasticsearchClient = new Client({
  node: config.elasticsearch.node,
});

export const connectElasticsearch = async (): Promise<void> => {
  try {
    const health = await elasticsearchClient.cluster.health();
    logger.info('Elasticsearch connected', {
      cluster: health.cluster_name,
      status: health.status,
    });
  } catch (error) {
    logger.error('Failed to connect to Elasticsearch', { error });
    throw error;
  }
};

export const createProductIndex = async (): Promise<void> => {
  try {
    const indexExists = await elasticsearchClient.indices.exists({
      index: config.elasticsearch.index,
    });

    if (!indexExists) {
      await elasticsearchClient.indices.create({
        index: config.elasticsearch.index,
        body: {
          settings: {
            number_of_shards: 2,
            number_of_replicas: 1,
            analysis: {
              analyzer: {
                product_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'stop', 'snowball'],
                },
              },
            },
          },
          mappings: {
            properties: {
              name: {
                type: 'text',
                analyzer: 'product_analyzer',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              description: {
                type: 'text',
                analyzer: 'product_analyzer',
              },
              categoryName: {
                type: 'keyword',
              },
              brand: {
                type: 'keyword',
              },
              tags: {
                type: 'keyword',
              },
              basePrice: {
                type: 'float',
              },
              averageRating: {
                type: 'float',
              },
              isActive: {
                type: 'boolean',
              },
              isFeatured: {
                type: 'boolean',
              },
              totalStock: {
                type: 'integer',
              },
              createdAt: {
                type: 'date',
              },
            },
          },
        },
      });

      logger.info('Product index created successfully');
    } else {
      logger.info('Product index already exists');
    }
  } catch (error) {
    logger.error('Failed to create product index', { error });
    throw error;
  }
};
