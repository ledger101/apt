import { describe, it, expect, vi } from 'vitest';
import { ExcelParser } from './excel-parser';
import * as XLSX from 'xlsx';

// Mock XLSX
vi.mock('xlsx', () => ({
    read: vi.fn(),
    utils: {
        sheet_to_json: vi.fn(() => []),
        decode_range: vi.fn(() => ({ s: { r: 0, c: 0 }, e: { r: 0, c: 0 } })),
        encode_cell: vi.fn(() => 'A1'),
    },
}));

describe('ExcelParser', () => {
    it('should instantiate correctly', () => {
        const parser = new ExcelParser();
        expect(parser).toBeDefined();
    });

    describe('slugify', () => {
        it('should correctly slugify strings', () => {
            const parser = new (ExcelParser as any)();
            expect(parser.slugify('Hello World')).toBe('hello-world');
            expect(parser.slugify('Site_123 !')).toBe('site-123');
        });
    });

    describe('detectTemplateType', () => {
        it('should detect progress report by sheet name', () => {
            const parser = new (ExcelParser as any)();
            const mockWorkbook = {
                Sheets: { 'Daily report drilling': {} },
                SheetNames: ['Daily report drilling']
            };
            expect(parser.detectTemplateType(mockWorkbook)).toBe('progress_report');
        });

        it('should return unknown for empty workbook', () => {
            const parser = new (ExcelParser as any)();
            const mockWorkbook = {
                Sheets: {},
                SheetNames: []
            };
            expect(parser.detectTemplateType(mockWorkbook)).toBe('unknown');
        });
    });
});
