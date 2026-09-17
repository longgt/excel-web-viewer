import { SheetData, WorkbookData, CellStyle } from '../types';

export const SAMPLE_WORKBOOK_SALES: WorkbookData = {
  fileName: 'Global_Sales_Q3_Performance.xlsx',
  fileSize: 48520,
  sheetNames: ['Orders & Revenue', 'Regional Breakdown', 'Top Accounts', 'Product Inventory'],
  activeSheetName: 'Orders & Revenue',
  sheets: {
    'Orders & Revenue': {
      name: 'Orders & Revenue',
      headers: ['Order ID', 'Customer Name', 'Region', 'Segment', 'Product Category', 'Sales ($)', 'Quantity', 'Discount', 'Profit ($)', 'Status', 'Order Date'],
      data: [
        ['ORD-9021', 'Acro Dynamics', 'North America', 'Enterprise', 'Cloud Infrastructure', '$14,250', 5, '10%', '$4,275', 'Delivered', '2026-08-12'],
        ['ORD-9022', 'Zenith Global Media', 'Europe', 'Mid-Market', 'Analytics Suite', '$8,900', 2, '5%', '$2,450', 'Processing', '2026-08-14'],
        ['ORD-9023', 'Pacific Blue Logistics', 'Asia Pacific', 'Enterprise', 'Hardware Servers', '$27,400', 12, '15%', '$6,850', 'Delivered', '2026-08-15'],
        ['ORD-9024', 'Apex Innovations', 'North America', 'Small Business', 'Security Pro', '$3,450', 3, '0%', '$1,200', 'Delivered', '2026-08-18'],
        ['ORD-9025', 'Helios Energy Corp', 'Latin America', 'Enterprise', 'Cloud Infrastructure', '$19,800', 8, '12%', '$5,940', 'In Transit', '2026-08-20'],
        ['ORD-9026', 'Quantum Softworks', 'Europe', 'Mid-Market', 'Developer Tools', '$6,200', 4, '5%', '$1,860', 'Delivered', '2026-08-22'],
        ['ORD-9027', 'Borealis Medical', 'North America', 'Enterprise', 'Analytics Suite', '$31,200', 10, '8%', '$9,360', 'Delivered', '2026-08-25'],
        ['ORD-9028', 'Nippon Systems', 'Asia Pacific', 'Enterprise', 'Cloud Infrastructure', '$22,500', 7, '10%', '$6,750', 'Delivered', '2026-08-28'],
        ['ORD-9029', 'Vanguard Retailers', 'North America', 'Mid-Market', 'Point of Sale', '$4,780', 6, '15%', '$950', 'Cancelled', '2026-09-01'],
        ['ORD-9030', 'Starlight Hospitality', 'Middle East', 'Mid-Market', 'Hardware Servers', '$16,700', 5, '10%', '$4,175', 'Delivered', '2026-09-02'],
        ['ORD-9031', 'Equinox Financial', 'North America', 'Enterprise', 'Security Pro', '$45,000', 15, '5%', '$15,750', 'Delivered', '2026-09-04'],
        ['ORD-9032', 'Orion Aerospace', 'Europe', 'Enterprise', 'Cloud Infrastructure', '$38,900', 9, '10%', '$11,670', 'In Transit', '2026-09-05'],
        ['ORD-9033', 'Solstice Apparel', 'Latin America', 'Small Business', 'Analytics Suite', '$2,890', 1, '0%', '$860', 'Delivered', '2026-09-07'],
        ['ORD-9034', 'Terra Verde Bio', 'Europe', 'Mid-Market', 'Developer Tools', '$7,400', 3, '5%', '$2,220', 'Processing', '2026-09-08'],
        ['ORD-9035', 'Astra Logistics', 'Asia Pacific', 'Enterprise', 'Hardware Servers', '$18,300', 6, '12%', '$4,575', 'Delivered', '2026-09-10'],
      ],
      rawRows: [],
      rowCount: 15,
      colCount: 11,
      tabColor: '#107c41', // Excel Green
      columnWidths: [110, 190, 140, 130, 170, 120, 95, 95, 120, 115, 120],
      showGridLines: true,
    },
    'Regional Breakdown': {
      name: 'Regional Breakdown',
      headers: ['Region', 'Regional Director', 'Target ($)', 'Achieved ($)', 'Attainment %', 'Active Reps', 'Quarterly Trend'],
      data: [
        ['North America', 'Sarah Jenkins', '$95,000', '$93,680', '98.6%', 14, 'Strong'],
        ['Europe', 'Marco Rossi', '$70,000', '$61,400', '87.7%', 10, 'Moderate'],
        ['Asia Pacific', 'Kenji Tanaka', '$65,000', '$68,200', '104.9%', 9, 'Exceeded'],
        ['Latin America', 'Camila Ortiz', '$30,000', '$22,690', '75.6%', 5, 'Needs Review'],
        ['Middle East', 'Tariq Al-Mansoor', '$25,000', '$16,700', '66.8%', 4, 'Growing'],
      ],
      rawRows: [],
      rowCount: 5,
      colCount: 7,
      tabColor: '#2563eb', // Blue
      columnWidths: [150, 170, 130, 130, 125, 110, 140],
      showGridLines: true,
    },
    'Top Accounts': {
      name: 'Top Accounts',
      headers: ['Account Name', 'Industry', 'Tier', 'Annual Contract Value', 'Renewal Date', 'Health Score', 'Account Exec'],
      data: [
        ['Equinox Financial', 'Banking & Finance', 'Tier 1 Strategic', '$180,000', '2027-01-15', '98%', 'David Miller'],
        ['Orion Aerospace', 'Defense & Aviation', 'Tier 1 Strategic', '$155,000', '2026-11-30', '94%', 'Elena Rostova'],
        ['Borealis Medical', 'Healthcare', 'Tier 1 Strategic', '$125,000', '2027-03-20', '91%', 'David Miller'],
        ['Pacific Blue Logistics', 'Supply Chain', 'Tier 2 Growth', '$88,000', '2026-10-15', '89%', 'Yuki Takahashi'],
        ['Nippon Systems', 'Telecommunications', 'Tier 2 Growth', '$75,000', '2027-05-10', '95%', 'Yuki Takahashi'],
        ['Helios Energy Corp', 'Renewable Energy', 'Tier 2 Growth', '$62,000', '2026-12-05', '82%', 'Carlos Mendez'],
      ],
      rawRows: [],
      rowCount: 6,
      colCount: 7,
      tabColor: '#7c3aed', // Purple
      columnWidths: [190, 170, 140, 170, 125, 115, 150],
      showGridLines: true,
    },
    'Product Inventory': {
      name: 'Product Inventory',
      headers: ['SKU Code', 'Product Name', 'Category', 'Unit Price ($)', 'Warehouse Stock', 'Reorder Level', 'Status'],
      data: [
        ['SKU-101', 'Cloud Node Standard', 'Infrastructure', '$2,850', 140, 25, 'In Stock'],
        ['SKU-102', 'Cloud Node High-RAM', 'Infrastructure', '$4,500', 85, 20, 'In Stock'],
        ['SKU-201', 'Enterprise Analytics Seat', 'Software', '$890', 420, 50, 'In Stock'],
        ['SKU-301', 'Blade Server Rack v4', 'Hardware', '$9,200', 8, 10, 'Low Stock'],
        ['SKU-401', 'Endpoint Shield Pro', 'Security', '$1,150', 310, 40, 'In Stock'],
        ['SKU-501', 'Developer Workspace Core', 'Software', '$620', 580, 60, 'In Stock'],
        ['SKU-601', 'Mobile PoS Terminal', 'Hardware', '$795', 4, 15, 'Critical Stock'],
      ],
      rawRows: [],
      rowCount: 7,
      colCount: 7,
      tabColor: '#ea580c', // Orange
      columnWidths: [110, 210, 150, 130, 140, 120, 130],
      showGridLines: true,
    },
  },
};

// Generate realistic Excel formatting for sample sheets
function initializeSampleStyles(sheet: SheetData) {
  sheet.rawRows = [sheet.headers, ...sheet.data];

  // Header styles: slate header background, bold white text, bottom border
  sheet.headerStyles = sheet.headers.map(() => ({
    bold: true,
    fontSize: 11,
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    borders: {
      bottom: { style: 'medium', color: '#334155' },
    },
  }));

  // Cell styles
  sheet.cellStyles = sheet.data.map((row) => {
    return row.map((val, cIdx): CellStyle | null => {
      const header = sheet.headers[cIdx];
      const strVal = String(val ?? '').trim();

      // Status pill styling
      if (header === 'Status') {
        if (strVal === 'Delivered' || strVal === 'In Stock') {
          return {
            bold: true,
            backgroundColor: '#dcfce7',
            color: '#15803d',
            horizontalAlign: 'center',
            borders: {
              top: { style: 'thin', color: '#bbf7d0' },
              bottom: { style: 'thin', color: '#bbf7d0' },
            },
          };
        }
        if (strVal === 'In Transit' || strVal === 'Processing') {
          return {
            bold: true,
            backgroundColor: strVal === 'In Transit' ? '#e0f2fe' : '#fef3c7',
            color: strVal === 'In Transit' ? '#0369a1' : '#b45309',
            horizontalAlign: 'center',
          };
        }
        if (strVal === 'Cancelled' || strVal === 'Critical Stock') {
          return {
            bold: true,
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            horizontalAlign: 'center',
            strike: strVal === 'Cancelled',
          };
        }
        if (strVal === 'Low Stock') {
          return {
            bold: true,
            backgroundColor: '#ffedd5',
            color: '#c2410c',
            horizontalAlign: 'center',
          };
        }
      }

      // Attainment %
      if (header === 'Attainment %') {
        const num = parseFloat(strVal);
        if (!isNaN(num) && num >= 100) {
          return {
            bold: true,
            backgroundColor: '#dcfce7',
            color: '#15803d',
            horizontalAlign: 'right',
          };
        }
        if (!isNaN(num) && num < 80) {
          return {
            bold: true,
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            horizontalAlign: 'right',
          };
        }
        return {
          horizontalAlign: 'right',
          bold: true,
        };
      }

      // Currency columns
      if (header.includes('($)') || header.includes('Value') || header.includes('Price')) {
        return {
          horizontalAlign: 'right',
          bold: true,
          color: '#0f172a',
        };
      }

      // Customer / Account Name / Product Name
      if (header === 'Customer Name' || header === 'Account Name' || header === 'Product Name') {
        return {
          bold: true,
          color: '#1e293b',
          fontSize: 11,
        };
      }

      // Discount / Percentage
      if (header === 'Discount' || header === 'Health Score') {
        return {
          horizontalAlign: 'center',
          italic: true,
          color: '#64748b',
        };
      }

      // Code / SKU / ID
      if (header === 'Order ID' || header === 'SKU Code') {
        return {
          fontSize: 10,
          color: '#475569',
        };
      }

      return null;
    });
  });

  sheet.rawStyles = [sheet.headerStyles, ...sheet.cellStyles];
}

for (const sheet of Object.values(SAMPLE_WORKBOOK_SALES.sheets)) {
  initializeSampleStyles(sheet);
}
