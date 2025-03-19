import { BaseDataConnector, ConnectorConfig } from './baseConnector';
import { AppError } from '../../errors';
import * as fs from 'fs';
import * as path from 'path';
import * as pdfjs from 'pdfjs-dist';

/**
 * Specific configuration for PDF document connectors
 */
export interface PDFConnectorConfig extends ConnectorConfig {
  dataDirectory?: string;
  fileEncoding?: string;
}

/**
 * Document Field structure
 */
export interface DocumentField {
  name: string;
  value: string | number | boolean | null;
  confidence?: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
  };
  pageNumber?: number;
}

/**
 * Extracted document structure
 */
export interface ExtractedDocument {
  documentId: string;
  fileName: string;
  documentType: string;
  extractionDate: string;
  fields: DocumentField[];
  metadata: Record<string, any>;
  pageCount: number;
  rawText?: string;
}

/**
 * PDF Query parameters
 */
export interface PDFQueryParams {
  fileName?: string;
  documentType?: string;
  extractFields?: string[];
  fullText?: boolean;
  limit?: number;
  offset?: number;
  [key: string]: any;
}

/**
 * Implementation of connector for PDF documents
 */
export class PDFConnector extends BaseDataConnector {
  private dataDirectory: string;
  private fileEncoding: string;

  constructor(name: string, config: PDFConnectorConfig) {
    super(name, 'pdf', config);
    this.dataDirectory = config.dataDirectory || path.join(process.cwd(), 'attached_assets');
    this.fileEncoding = config.fileEncoding || 'utf8';

    // Ensure pdfjs can find its worker
    const pdfWorkerPath = require.resolve('pdfjs-dist/build/pdf.worker.js');
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerPath;
  }

  /**
   * Test connection to the data source
   */
  async testConnection(): Promise<boolean> {
    try {
      // Check if data directory exists
      const dirExists = fs.existsSync(this.dataDirectory);
      if (!dirExists) {
        throw new Error(`Data directory does not exist: ${this.dataDirectory}`);
      }
      
      // Try to list PDF files in the directory
      const files = await this.getAvailablePDFFiles();
      return files.length > 0;
    } catch (error) {
      const errorMessage = `Failed to connect to PDF document source: ${error instanceof Error ? error.message : 'Unknown error'}`;
      await this.logError('testConnection', 'pdf-document', {}, errorMessage);
      throw new AppError(errorMessage, 500, 'CONNECTOR_ERROR', true);
    }
  }

  /**
   * Fetch PDF document data based on query parameters
   */
  async fetchData(query: PDFQueryParams): Promise<{
    data: ExtractedDocument[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const startTime = Date.now();
    
    try {
      await this.logRequest('fetchData', 'pdf-document', query);
      
      // Get list of PDF files
      let pdfFiles = await this.getAvailablePDFFiles();
      
      if (pdfFiles.length === 0) {
        throw new Error('No PDF files found');
      }
      
      // Filter by filename if provided
      if (query.fileName) {
        pdfFiles = pdfFiles.filter(file => 
          file.toLowerCase().includes(query.fileName!.toLowerCase())
        );
      }
      
      // Apply pagination to files list
      const limit = query.limit ?? 10;
      const offset = query.offset ?? 0;
      const paginatedFiles = pdfFiles.slice(offset, offset + limit);
      
      // Process each PDF file
      const extractedDocuments: ExtractedDocument[] = [];
      
      for (const file of paginatedFiles) {
        const filepath = path.join(this.dataDirectory, file);
        try {
          const document = await this.extractPDFDocument(filepath, query.fullText ?? false);
          extractedDocuments.push(document);
        } catch (error) {
          console.error(`Error extracting data from ${file}:`, error);
          // Continue processing other files
        }
      }
      
      const result = {
        data: extractedDocuments,
        total: pdfFiles.length,
        limit,
        offset
      };
      
      const duration = Date.now() - startTime;
      await this.logResponse('fetchData', 'pdf-document', query, {
        count: result.data.length,
        total: result.total
      }, duration);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.logError('fetchData', 'pdf-document', query, error);
      throw new AppError(
        `Failed to fetch PDF document data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500, 
        'CONNECTOR_ERROR', 
        true,
        { duration }
      );
    }
  }

  /**
   * Get document by filename
   */
  async getDocumentByName(fileName: string, fullText: boolean = false): Promise<ExtractedDocument | null> {
    try {
      const result = await this.fetchData({ fileName, fullText });
      return result.data.length > 0 ? result.data[0] : null;
    } catch (error) {
      await this.logError('getDocumentByName', 'pdf-document', { fileName }, error);
      throw new AppError(
        `Failed to get document by name: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        'CONNECTOR_ERROR',
        true
      );
    }
  }

  /**
   * Extract text from a PDF file
   */
  async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      const data = new Uint8Array(fs.readFileSync(filePath));
      const pdf = await pdfjs.getDocument({ data }).promise;
      
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const items = content.items as any[];
        const pageText = items.map(item => item.str).join(' ');
        text += pageText + '\n';
      }
      
      return text;
    } catch (error) {
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get available models/document types
   */
  async getAvailableModels(): Promise<string[]> {
    return ['appraisal_report', 'property_record', 'market_analysis', 'neighborhood_report'];
  }

  /**
   * Get schema for a specific document type
   */
  async getModelSchema(modelName: string): Promise<any> {
    switch (modelName) {
      case 'appraisal_report':
        return {
          address: 'string',
          city: 'string',
          state: 'string',
          zip: 'string',
          appraisalValue: 'number',
          appraisalDate: 'string',
          beds: 'number',
          baths: 'number',
          squareFeet: 'number',
          lotSize: 'string',
          yearBuilt: 'number',
          propertyType: 'string'
        };
      case 'property_record':
        return {
          parcelNumber: 'string',
          address: 'string',
          owner: 'string',
          legalDescription: 'string',
          assessedValue: 'number',
          propertyClass: 'string',
          landValue: 'number',
          improvementValue: 'number',
          taxYear: 'number'
        };
      case 'market_analysis':
        return {
          period: 'string',
          region: 'string',
          medianPrice: 'number',
          averagePrice: 'number',
          priceChange: 'number',
          totalListings: 'number',
          totalSales: 'number',
          daysOnMarket: 'number',
          listToSaleRatio: 'number'
        };
      default:
        throw new Error(`Unknown model: ${modelName}`);
    }
  }

  /**
   * Get available PDF files
   */
  private async getAvailablePDFFiles(): Promise<string[]> {
    try {
      const files = fs.readdirSync(this.dataDirectory);
      return files.filter(file => file.toLowerCase().endsWith('.pdf'));
    } catch (error) {
      throw new Error(`Failed to read data directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract data from a PDF document
   */
  private async extractPDFDocument(filePath: string, includeFullText: boolean = false): Promise<ExtractedDocument> {
    const fileName = path.basename(filePath);
    const documentType = this.inferDocumentType(fileName);
    
    try {
      // Extract text from PDF
      const rawText = await this.extractTextFromPDF(filePath);
      
      // Process document based on type
      const fields = await this.extractFieldsFromText(rawText, documentType);
      
      // Get file stats for metadata
      const stats = fs.statSync(filePath);
      
      // Create document object
      const document: ExtractedDocument = {
        documentId: fileName.replace(/\.[^/.]+$/, ''), // Filename without extension
        fileName,
        documentType,
        extractionDate: new Date().toISOString(),
        fields,
        metadata: {
          fileSize: stats.size,
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString()
        },
        pageCount: this.countPages(rawText),
      };
      
      // Include full text if requested
      if (includeFullText) {
        document.rawText = rawText;
      }
      
      return document;
    } catch (error) {
      throw new Error(`Failed to extract data from PDF ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Count the number of pages in the extracted text
   */
  private countPages(text: string): number {
    const pageBreaks = text.match(/\n\n/g) || [];
    return pageBreaks.length + 1;
  }

  /**
   * Infer document type from filename
   */
  private inferDocumentType(fileName: string): string {
    const lowerFileName = fileName.toLowerCase();
    
    if (lowerFileName.includes('appraisal') || lowerFileName.includes('valuation')) {
      return 'appraisal_report';
    }
    
    if (lowerFileName.includes('record') || lowerFileName.includes('yakima') || lowerFileName.includes('county')) {
      return 'property_record';
    }
    
    if (lowerFileName.includes('market') || lowerFileName.includes('analysis')) {
      return 'market_analysis';
    }
    
    if (lowerFileName.includes('neighborhood')) {
      return 'neighborhood_report';
    }
    
    return 'unknown';
  }

  /**
   * Extract field information from document text
   */
  private async extractFieldsFromText(text: string, documentType: string): Promise<DocumentField[]> {
    const fields: DocumentField[] = [];
    
    // Pattern to find field-value pairs (Label: Value)
    const fieldPattern = /([A-Za-z][A-Za-z0-9\s-]+):\s*([^\n]+)/g;
    let match;
    
    while ((match = fieldPattern.exec(text)) !== null) {
      const name = match[1].trim();
      const value = match[2].trim();
      
      fields.push({
        name,
        value,
        confidence: 0.85, // Default confidence
        pageNumber: this.estimatePageNumber(match.index, text)
      });
    }
    
    // Extract specific fields based on document type
    switch (documentType) {
      case 'appraisal_report':
        this.extractAppraisalFields(text, fields);
        break;
      case 'property_record':
        this.extractPropertyRecordFields(text, fields);
        break;
      case 'market_analysis':
        this.extractMarketAnalysisFields(text, fields);
        break;
      case 'neighborhood_report':
        this.extractNeighborhoodFields(text, fields);
        break;
    }
    
    return fields;
  }

  /**
   * Estimate page number based on text position
   */
  private estimatePageNumber(position: number, text: string): number {
    // Instead of using matchAll, use a manual approach with exec
    const regex = /\n\n/g;
    const pageBreaks: number[] = [];
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      if (match.index !== undefined) {
        pageBreaks.push(match.index);
      }
    }
    
    let pageNum = 1;
    for (const breakPosition of pageBreaks) {
      if (position > breakPosition) {
        pageNum++;
      } else {
        break;
      }
    }
    
    return pageNum;
  }

  /**
   * Extract appraisal report specific fields
   */
  private extractAppraisalFields(text: string, fields: DocumentField[]): void {
    // Address pattern
    const addressMatch = text.match(/([0-9]+\s+[A-Za-z0-9\s]+(?:St|Street|Rd|Road|Ave|Avenue|Ln|Lane|Dr|Drive|Blvd|Boulevard|Cir|Circle|Ct|Court|Hwy|Highway))/i);
    if (addressMatch) {
      fields.push({
        name: 'Address',
        value: addressMatch[1],
        confidence: 0.9
      });
    }

    // City, State, Zip pattern
    const locationMatch = text.match(/([A-Za-z\s]+),\s*([A-Z]{2})\s+([0-9]{5}(?:-[0-9]{4})?)/);
    if (locationMatch) {
      fields.push({
        name: 'City',
        value: locationMatch[1],
        confidence: 0.9
      });
      
      fields.push({
        name: 'State',
        value: locationMatch[2],
        confidence: 0.95
      });
      
      fields.push({
        name: 'Zip',
        value: locationMatch[3],
        confidence: 0.95
      });
    }

    // Appraisal value pattern
    const valueMatch = text.match(/(?:Appraisal\s+Value|Appraised\s+Value|Valuation|Value|RVM)(?:[:\s])+\$?([0-9,]+)/i);
    if (valueMatch) {
      fields.push({
        name: 'AppraisalValue',
        value: parseFloat(valueMatch[1].replace(/,/g, '')),
        confidence: 0.85
      });
    }

    // Beds & Baths pattern
    const bedsMatch = text.match(/([0-9])\s*(?:Beds|Bedrooms)/i);
    if (bedsMatch) {
      fields.push({
        name: 'Beds',
        value: parseInt(bedsMatch[1]),
        confidence: 0.9
      });
    }

    const bathsMatch = text.match(/([0-9.]+)\s*(?:Baths|Bathrooms)/i);
    if (bathsMatch) {
      fields.push({
        name: 'Baths',
        value: parseFloat(bathsMatch[1]),
        confidence: 0.9
      });
    }

    // Square feet pattern
    const sqftMatch = text.match(/([0-9,]+)\s*(?:Sq\s*Ft|Square\s*Feet|Square\s*Foot)/i);
    if (sqftMatch) {
      fields.push({
        name: 'SquareFeet',
        value: parseInt(sqftMatch[1].replace(/,/g, '')),
        confidence: 0.9
      });
    }

    // Year built pattern
    const yearMatch = text.match(/(?:Year\s+Built|Built\s+in)(?:[:\s])+([0-9]{4})/i);
    if (yearMatch) {
      fields.push({
        name: 'YearBuilt',
        value: parseInt(yearMatch[1]),
        confidence: 0.9
      });
    }
  }

  /**
   * Extract property record specific fields
   */
  private extractPropertyRecordFields(text: string, fields: DocumentField[]): void {
    // Parcel Number pattern
    const parcelMatch = text.match(/(?:Parcel\s+(?:Number|ID|No)|APN|Tax\s+ID)(?:[:\s])+([A-Za-z0-9-]+)/i);
    if (parcelMatch) {
      fields.push({
        name: 'ParcelNumber',
        value: parcelMatch[1],
        confidence: 0.95
      });
    }

    // Assessed Value pattern
    const assessedMatch = text.match(/(?:Assessed\s+Value|Taxable\s+Value)(?:[:\s])+\$?([0-9,]+)/i);
    if (assessedMatch) {
      fields.push({
        name: 'AssessedValue',
        value: parseFloat(assessedMatch[1].replace(/,/g, '')),
        confidence: 0.9
      });
    }

    // Land Value pattern
    const landMatch = text.match(/(?:Land\s+Value|Market\s+Land)(?:[:\s])+\$?([0-9,]+)/i);
    if (landMatch) {
      fields.push({
        name: 'LandValue',
        value: parseFloat(landMatch[1].replace(/,/g, '')),
        confidence: 0.9
      });
    }

    // Improvement Value pattern
    const improvementMatch = text.match(/(?:Improvement\s+Value|Improvements|Market\s+Improvement)(?:[:\s])+\$?([0-9,]+)/i);
    if (improvementMatch) {
      fields.push({
        name: 'ImprovementValue',
        value: parseFloat(improvementMatch[1].replace(/,/g, '')),
        confidence: 0.9
      });
    }

    // Tax Year pattern
    const taxYearMatch = text.match(/(?:Tax\s+Year|Assessment\s+Year)(?:[:\s])+([0-9]{4})/i);
    if (taxYearMatch) {
      fields.push({
        name: 'TaxYear',
        value: parseInt(taxYearMatch[1]),
        confidence: 0.95
      });
    }

    // Property Class/Type pattern
    const propertyClassMatch = text.match(/(?:Property\s+(?:Class|Type|Use))(?:[:\s])+([A-Za-z0-9\s-]+)/i);
    if (propertyClassMatch) {
      fields.push({
        name: 'PropertyClass',
        value: propertyClassMatch[1].trim(),
        confidence: 0.85
      });
    }
  }

  /**
   * Extract market analysis specific fields
   */
  private extractMarketAnalysisFields(text: string, fields: DocumentField[]): void {
    // Median Price pattern
    const medianMatch = text.match(/(?:Median\s+(?:Price|Home\s+Value|Value))(?:[:\s])+\$?([0-9,]+)/i);
    if (medianMatch) {
      fields.push({
        name: 'MedianPrice',
        value: parseFloat(medianMatch[1].replace(/,/g, '')),
        confidence: 0.9
      });
    }

    // Average Price pattern
    const avgMatch = text.match(/(?:Average\s+(?:Price|Home\s+Value|Value))(?:[:\s])+\$?([0-9,]+)/i);
    if (avgMatch) {
      fields.push({
        name: 'AveragePrice',
        value: parseFloat(avgMatch[1].replace(/,/g, '')),
        confidence: 0.9
      });
    }

    // Price Change pattern
    const changeMatch = text.match(/(?:Price\s+Change|Change|Appreciation)(?:[:\s])+([+-]?[0-9.]+)%/i);
    if (changeMatch) {
      fields.push({
        name: 'PriceChange',
        value: parseFloat(changeMatch[1]),
        confidence: 0.85
      });
    }

    // Days on Market pattern
    const domMatch = text.match(/(?:Days\s+(?:on|in)\s+(?:Market|DOM))(?:[:\s])+([0-9]+)/i);
    if (domMatch) {
      fields.push({
        name: 'DaysOnMarket',
        value: parseInt(domMatch[1]),
        confidence: 0.9
      });
    }

    // List to Sale Ratio pattern
    const ratioMatch = text.match(/(?:List\s+to\s+Sale|Sale\s+to\s+List)(?:[:\s])+([0-9.]+)%?/i);
    if (ratioMatch) {
      fields.push({
        name: 'ListToSaleRatio',
        value: parseFloat(ratioMatch[1]),
        confidence: 0.85
      });
    }
  }

  /**
   * Extract neighborhood report specific fields
   */
  private extractNeighborhoodFields(text: string, fields: DocumentField[]): void {
    // Neighborhood or Zip Code pattern
    const zipMatch = text.match(/([0-9]{5}(?:-[0-9]{4})?)\s+(?:Neighborhood|Area|Community)/i);
    if (zipMatch) {
      fields.push({
        name: 'ZipCode',
        value: zipMatch[1],
        confidence: 0.95
      });
    }

    // Population pattern
    const popMatch = text.match(/(?:Total\s+Population|Population)(?:[:\s])+([0-9,]+)/i);
    if (popMatch) {
      fields.push({
        name: 'Population',
        value: parseInt(popMatch[1].replace(/,/g, '')),
        confidence: 0.9
      });
    }

    // Median Age pattern
    const ageMatch = text.match(/(?:Median\s+Age|Average\s+Age)(?:[:\s])+([0-9.]+)/i);
    if (ageMatch) {
      fields.push({
        name: 'MedianAge',
        value: parseFloat(ageMatch[1]),
        confidence: 0.9
      });
    }

    // Median Income pattern
    const incomeMatch = text.match(/(?:Median\s+(?:Household\s+)?Income)(?:[:\s])+\$?([0-9,]+)/i);
    if (incomeMatch) {
      fields.push({
        name: 'MedianIncome',
        value: parseFloat(incomeMatch[1].replace(/,/g, '')),
        confidence: 0.9
      });
    }

    // Owner vs Renter pattern
    const ownerMatch = text.match(/(?:Own|Homeownership)(?:[:\s])+([0-9.]+)%/i);
    if (ownerMatch) {
      fields.push({
        name: 'OwnerPercentage',
        value: parseFloat(ownerMatch[1]),
        confidence: 0.85
      });
    }

    const renterMatch = text.match(/(?:Rent|Renter)(?:[:\s])+([0-9.]+)%/i);
    if (renterMatch) {
      fields.push({
        name: 'RenterPercentage',
        value: parseFloat(renterMatch[1]),
        confidence: 0.85
      });
    }
  }
}