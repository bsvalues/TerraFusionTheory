
import { QdrantClient } from '@qdrant/js-client-rest';
import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';

export class EnhancedVectorStore {
  private client: QdrantClient;
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.client = new QdrantClient({ url: process.env.QDRANT_URL });
    this.embeddings = new OpenAIEmbeddings();
  }

  async addDocuments(docs: Document[]): Promise<void> {
    const vectors = await this.embeddings.embedDocuments(
      docs.map(doc => doc.pageContent)
    );
    
    await this.client.upsert('real_estate', {
      points: vectors.map((vector, i) => ({
        id: `doc_${i}`,
        vector,
        payload: docs[i].metadata
      }))
    });
  }

  async similaritySearch(query: string, k: number = 4): Promise<Document[]> {
    const queryEmbedding = await this.embeddings.embedQuery(query);
    
    const results = await this.client.search('real_estate', {
      vector: queryEmbedding,
      limit: k
    });

    return results.map(result => new Document({
      pageContent: result.payload.content,
      metadata: result.payload
    }));
  }
}
