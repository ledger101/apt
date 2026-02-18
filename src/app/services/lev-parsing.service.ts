import { Injectable } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { Site, Borehole, Series, Quality, DischargeTest, DischargePoint, ValidationResult } from '../models';

interface LevMetadata {
  company?: string;
  date?: string;
  time?: string;
  filename?: string;
  instrumentType?: string;
  serialNumber?: string;
  instrumentNumber?: string;
  location?: string;
  sampleRate?: number;
  startTime?: string;
  stopTime?: string;
  channels: LevChannel[];
}

interface LevChannel {
  identification: string;
  unit?: string;
  reference?: string;
}

interface LevDataRow {
  timestamp: Date;
  level?: number;
  temperature?: number;
  conductivity?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LevParsingService {

  constructor() { }

  /**
   * Parse a .lev file and extract data logger information
   */
  async parseFile(file: File): Promise<{
    type: 'data_logger';
    data: DischargeTest | null;
    validation: ValidationResult;
    site: Site | null;
    borehole: Borehole | null;
    series: Series[];
    quality: Quality[];
  }> {
    const validation: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Read file as text
      const fileContent = await this.readFileAsText(file);
      
      // Parse the .lev file
      const parsed = this.parseLevContent(fileContent);
      
      // Extract metadata
      const metadata = parsed.metadata;
      
      // Validate metadata
      if (!metadata.instrumentNumber) {
        validation.warnings.push('Instrument number not found in file');
      }
      
      if (!metadata.location) {
        validation.warnings.push('Location not found in file');
      }
      
      if (parsed.dataRows.length === 0) {
        validation.errors.push('No data rows found in file');
        validation.isValid = false;
      }
      
      // Create Site from location
      const site: Site = {
        siteId: this.slugify(metadata.location || 'unknown'),
        siteName: metadata.location || 'Unknown Site',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      // Create Borehole from instrument number
      const borehole: Borehole = {
        boreholeId: `${site.siteId}_${metadata.instrumentNumber || 'unknown'}`,
        boreholeNo: metadata.instrumentNumber || 'Unknown',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      // Convert data rows to series
      const series: Series[] = this.convertToSeries(parsed.dataRows, metadata);
      
      // Create discharge test data structure
      const dischargeTest: DischargeTest = {
        testId: `test-${Date.now()}`,
        testType: 'constant_discharge',
        boreholeRef: `sites/${site.siteId}/boreholes/${borehole.boreholeNo}`,
        startTime: metadata.startTime ? new Date(metadata.startTime) : new Date(),
        endTime: metadata.stopTime ? new Date(metadata.stopTime) : undefined,
        summary: {},
        sourceFilePath: file.name,
        status: 'parsed',
        createdBy: 'user-id', // TODO: Get from Auth
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      return {
        type: 'data_logger',
        data: dischargeTest,
        validation,
        site,
        borehole,
        series,
        quality: []
      };
      
    } catch (error: any) {
      validation.isValid = false;
      validation.errors.push(`Failed to parse .lev file: ${error.message}`);
      
      return {
        type: 'data_logger',
        data: null,
        validation,
        site: null,
        borehole: null,
        series: [],
        quality: []
      };
    }
  }

  /**
   * Read file as text
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Parse .lev file content
   */
  private parseLevContent(content: string): { metadata: LevMetadata; dataRows: LevDataRow[] } {
    const lines = content.split('\n');
    const metadata: LevMetadata = {
      channels: []
    };
    const dataRows: LevDataRow[] = [];
    
    let section = 'header';
    let dataCount = 0;
    let currentChannel = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Parse header metadata
      if (line.startsWith('COMPANY')) {
        metadata.company = this.extractValue(line);
      } else if (line.startsWith('DATE')) {
        metadata.date = this.extractValue(line);
      } else if (line.startsWith('TIME')) {
        metadata.time = this.extractValue(line);
      } else if (line.startsWith('FILENAME')) {
        metadata.filename = this.extractValue(line);
      }
      
      // Parse instrument info
      if (line.includes('Instrument type')) {
        metadata.instrumentType = this.extractValue(line);
      } else if (line.includes('Serial number')) {
        metadata.serialNumber = this.extractValue(line);
      } else if (line.includes('Instrument number')) {
        metadata.instrumentNumber = this.extractValue(line);
      } else if (line.includes('Location')) {
        metadata.location = this.extractValue(line);
      } else if (line.includes('Sample Rate')) {
        const value = this.extractValue(line);
        metadata.sampleRate = parseInt(value) || 0;
      } else if (line.includes('Start Time')) {
        metadata.startTime = this.extractValue(line);
      } else if (line.includes('Stop Time')) {
        metadata.stopTime = this.extractValue(line);
      }
      
      // Parse channel info
      if (line.startsWith('[Channel')) {
        currentChannel = metadata.channels.length;
        metadata.channels.push({ identification: '' });
      } else if (line.includes('Identification') && currentChannel >= 0) {
        const value = this.extractValue(line);
        if (metadata.channels[currentChannel]) {
          metadata.channels[currentChannel].identification = value;
        }
      } else if (line.includes('Unit') && currentChannel >= 0) {
        const value = this.extractValue(line);
        if (metadata.channels[currentChannel]) {
          metadata.channels[currentChannel].unit = value;
        }
      } else if (line.includes('Reference') && currentChannel >= 0) {
        const value = this.extractValue(line);
        if (metadata.channels[currentChannel]) {
          metadata.channels[currentChannel].reference = value;
        }
      }
      
      // Start of data section
      if (line === '[Data]') {
        section = 'data';
        continue;
      }
      
      // Parse data count
      if (section === 'data' && dataCount === 0 && /^\d+$/.test(line)) {
        dataCount = parseInt(line);
        continue;
      }
      
      // Parse data rows
      if (section === 'data' && dataCount > 0) {
        const dataRow = this.parseDataRow(line, metadata.channels);
        if (dataRow) {
          dataRows.push(dataRow);
        }
      }
    }
    
    return { metadata, dataRows };
  }

  /**
   * Extract value from a line like "KEY : value" or "KEY = value"
   */
  private extractValue(line: string): string {
    const match = line.match(/[:=]\s*(.+)$/);
    return match ? match[1].trim() : '';
  }

  /**
   * Parse a data row
   */
  private parseDataRow(line: string, channels: LevChannel[]): LevDataRow | null {
    // Data format: YYYY/MM/DD HH:MM:SS.S  value1  value2  value3
    const parts = line.split(/\s+/);
    
    if (parts.length < 2) return null;
    
    // Parse timestamp
    const datePart = parts[0];
    const timePart = parts[1];
    const timestamp = this.parseTimestamp(datePart, timePart);
    
    if (!timestamp) return null;
    
    const dataRow: LevDataRow = { timestamp };
    
    // Parse channel values
    for (let i = 0; i < channels.length && i < parts.length - 2; i++) {
      const value = parseFloat(parts[i + 2]);
      const channelId = channels[i].identification.toUpperCase();
      
      if (!isNaN(value)) {
        if (channelId === 'LEVEL') {
          dataRow.level = value;
        } else if (channelId === 'TEMPERATURE') {
          dataRow.temperature = value;
        } else if (channelId === 'CONDUCTIVITY') {
          dataRow.conductivity = value;
        }
      }
    }
    
    return dataRow;
  }

  /**
   * Parse timestamp from date and time parts
   */
  private parseTimestamp(datePart: string, timePart: string): Date | null {
    try {
      // Format: YYYY/MM/DD HH:MM:SS.S
      const [year, month, day] = datePart.split('/').map(Number);
      const [time, _] = timePart.split('.');
      const [hours, minutes, seconds] = time.split(':').map(Number);
      
      return new Date(year, month - 1, day, hours, minutes, seconds || 0);
    } catch {
      return null;
    }
  }

  /**
   * Convert data rows to series format
   */
  private convertToSeries(dataRows: LevDataRow[], metadata: LevMetadata): Series[] {
    if (dataRows.length === 0) return [];
    
    const series: Series = {
      seriesId: `series-${Date.now()}`,
      seriesType: 'discharge',
      pageIndex: 0,
      points: [],
      createdAt: Timestamp.now()
    };
    
    // Calculate time in minutes from start
    const startTime = dataRows[0].timestamp.getTime();
    
    for (const row of dataRows) {
      const t_min = (row.timestamp.getTime() - startTime) / 60000; // Convert to minutes
      
      series.points.push({
        t_min: Math.round(t_min * 100) / 100, // Round to 2 decimal places
        wl_m: row.level,
        ddn_m: undefined, // Can be calculated if static water level is known
        qlps: undefined
      });
    }
    
    return [series];
  }

  /**
   * Create a slug from a string
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
