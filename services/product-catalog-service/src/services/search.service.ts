import { elasticsearchClient } from '../database/elasticsearch';
import { config } from '../config';
import { ProductSearchQuery } from '../types';
import { logger } from '../utils/logger';

export class SearchService {
  /**
   * Index a product in Elasticsearch
   */
  async indexProduct(product: any): Promise<void> {
    try {
      await elasticsearchClient.index({
        index: config.elasticsearch.index,
        id: product._id.toString(),
        document: {
          name: product.name,
          description: product.description,
          categoryName: product.categoryName,
          brand: product.brand,
          tags: product.tags,
          basePrice: product.basePrice,
          averageRating: product.averageRating,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          totalStock: product.totalStock,
          createdAt: product.createdAt,
        },
      });

      logger.debug('Product indexed successfully', { productId: product._id });
    } catch (error) {
      logger.error('Failed to index product', { error, productId: product._id });
      throw error;
    }
  }

  /**
   * Update product in Elasticsearch
   */
  async updateProduct(productId: string, updates: any): Promise<void> {
    try {
      await elasticsearchClient.update({
        index: config.elasticsearch.index,
        id: productId,
        doc: updates,
      });

      logger.debug('Product updated in search index', { productId });
    } catch (error) {
      logger.error('Failed to update product in search index', { error, productId });
    }
  }

  /**
   * Delete product from Elasticsearch
   */
  async deleteProduct(productId: string): Promise<void> {
    try {
      await elasticsearchClient.delete({
        index: config.elasticsearch.index,
        id: productId,
      });

      logger.debug('Product deleted from search index', { productId });
    } catch (error) {
      logger.error('Failed to delete product from search index', { error, productId });
    }
  }

  /**
   * Search products
   */
  async searchProducts(query: ProductSearchQuery): Promise<{ products: any[]; total: number }> {
    try {
      const {
        query: searchQuery,
        categoryId,
        brand,
        tags,
        minPrice,
        maxPrice,
        inStock,
        isFeatured,
        sortBy = 'relevance',
        page = 1,
        limit = 20,
      } = query;

      const must: any[] = [
        { term: { isActive: true } },
      ];

      // Text search
      if (searchQuery) {
        must.push({
          multi_match: {
            query: searchQuery,
            fields: ['name^3', 'description^2', 'brand', 'tags'],
            fuzziness: 'AUTO',
          },
        });
      }

      // Filters
      const filter: any[] = [];

      if (categoryId) {
        filter.push({ term: { 'categoryName.keyword': categoryId } });
      }

      if (brand) {
        filter.push({ term: { brand } });
      }

      if (tags && tags.length > 0) {
        filter.push({ terms: { tags } });
      }

      if (minPrice || maxPrice) {
        const range: any = {};
        if (minPrice) range.gte = minPrice;
        if (maxPrice) range.lte = maxPrice;
        filter.push({ range: { basePrice: range } });
      }

      if (inStock) {
        filter.push({ range: { totalStock: { gt: 0 } } });
      }

      if (isFeatured !== undefined) {
        filter.push({ term: { isFeatured } });
      }

      // Sorting
      let sort: any = [];
      switch (sortBy) {
        case 'price_asc':
          sort = [{ basePrice: 'asc' }];
          break;
        case 'price_desc':
          sort = [{ basePrice: 'desc' }];
          break;
        case 'newest':
          sort = [{ createdAt: 'desc' }];
          break;
        case 'rating':
          sort = [{ averageRating: 'desc' }];
          break;
        case 'relevance':
        default:
          sort = ['_score', { createdAt: 'desc' }];
      }

      const from = (page - 1) * limit;

      const result = await elasticsearchClient.search({
        index: config.elasticsearch.index,
        body: {
          query: {
            bool: {
              must,
              filter,
            },
          },
          sort,
          from,
          size: limit,
        },
      });

      const products = result.hits.hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source,
        score: hit._score,
      }));

      const total = typeof result.hits.total === 'number'
        ? result.hits.total
        : result.hits.total?.value || 0;

      return { products, total };
    } catch (error) {
      logger.error('Search query failed', { error, query });
      throw error;
    }
  }

  /**
   * Get search suggestions (autocomplete)
   */
  async getSuggestions(prefix: string, limit: number = 10): Promise<string[]> {
    try {
      const result = await elasticsearchClient.search({
        index: config.elasticsearch.index,
        body: {
          suggest: {
            product_suggest: {
              prefix,
              completion: {
                field: 'name.keyword',
                size: limit,
                skip_duplicates: true,
              },
            },
          },
        },
      });

      const options = result.suggest?.product_suggest[0]?.options;
      const suggestions = Array.isArray(options)
        ? options.map((option: any) => option.text)
        : [];

      return suggestions;
    } catch (error) {
      logger.error('Failed to get search suggestions', { error, prefix });
      return [];
    }
  }
}
