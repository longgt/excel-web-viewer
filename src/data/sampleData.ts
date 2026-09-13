import { SheetData, WorkbookData } from '../types';

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
        ['ORD-9021', 'Acro Dynamics', 'North America', 'Enterprise', 'Cloud Infrastructure', 14250, 5, '10%', 4275, 'Delivered', '2026-08-12'],
        ['ORD-9022', 'Zenith Global Media', 'Europe', 'Mid-Market', 'Analytics Suite', 8900, 2, '5%', 2450, 'Processing', '2026-08-14'],
        ['ORD-9023', 'Pacific Blue Logistics', 'Asia Pacific', 'Enterprise', 'Hardware Servers', 27400, 12, '15%', 6850, 'Delivered', '2026-08-15'],
        ['ORD-9024', 'Apex Innovations', 'North America', 'Small Business', 'Security Pro', 3450, 3, '0%', 1200, 'Delivered', '2026-08-18'],
        ['ORD-9025', 'Helios Energy Corp', 'Latin America', 'Enterprise', 'Cloud Infrastructure', 19800, 8, '12%', 5940, 'In Transit', '2026-08-20'],
        ['ORD-9026', 'Quantum Softworks', 'Europe', 'Mid-Market', 'Developer Tools', 6200, 4, '5%', 1860, 'Delivered', '2026-08-22'],
        ['ORD-9027', 'Borealis Medical', 'North America', 'Enterprise', 'Analytics Suite', 31200, 10, '8%', 9360, 'Delivered', '2026-08-25'],
        ['ORD-9028', 'Nippon Systems', 'Asia Pacific', 'Enterprise', 'Cloud Infrastructure', 22500, 7, '10%', 6750, 'Delivered', '2026-08-28'],
        ['ORD-9029', 'Vanguard Retailers', 'North America', 'Mid-Market', 'Point of Sale', 4780, 6, '15%', 950, 'Cancelled', '2026-09-01'],
        ['ORD-9030', 'Starlight Hospitality', 'Middle East', 'Mid-Market', 'Hardware Servers', 16700, 5, '10%', 4175, 'Delivered', '2026-09-02'],
        ['ORD-9031', 'Equinox Financial', 'North America', 'Enterprise', 'Security Pro', 45000, 15, '5%', 15750, 'Delivered', '2026-09-04'],
        ['ORD-9032', 'Orion Aerospace', 'Europe', 'Enterprise', 'Cloud Infrastructure', 38900, 9, '10%', 11670, 'In Transit', '2026-09-05'],
        ['ORD-9033', 'Solstice Apparel', 'Latin America', 'Small Business', 'Analytics Suite', 2890, 1, '0%', 860, 'Delivered', '2026-09-07'],
        ['ORD-9034', 'Terra Verde Bio', 'Europe', 'Mid-Market', 'Developer Tools', 7400, 3, '5%', 2220, 'Processing', '2026-09-08'],
        ['ORD-9035', 'Astra Logistics', 'Asia Pacific', 'Enterprise', 'Hardware Servers', 18300, 6, '12%', 4575, 'Delivered', '2026-09-10'],
      ],
      rawRows: [],
      rowCount: 15,
      colCount: 11,
    },
    'Regional Breakdown': {
      name: 'Regional Breakdown',
      headers: ['Region', 'Regional Director', 'Target ($)', 'Achieved ($)', 'Attainment %', 'Active Reps', 'Quarterly Trend'],
      data: [
        ['North America', 'Sarah Jenkins', 95000, 93680, '98.6%', 14, 'Strong'],
        ['Europe', 'Marco Rossi', 70000, 61400, '87.7%', 10, 'Moderate'],
        ['Asia Pacific', 'Kenji Tanaka', 65000, 68200, '104.9%', 9, 'Exceeded'],
        ['Latin America', 'Camila Ortiz', 30000, 22690, '75.6%', 5, 'Needs Review'],
        ['Middle East', 'Tariq Al-Mansoor', 25000, 16700, '66.8%', 4, 'Growing'],
      ],
      rawRows: [],
      rowCount: 5,
      colCount: 7,
    },
    'Top Accounts': {
      name: 'Top Accounts',
      headers: ['Account Name', 'Industry', 'Tier', 'Annual Contract Value', 'Renewal Date', 'Health Score', 'Account Exec'],
      data: [
        ['Equinox Financial', 'Banking & Finance', 'Tier 1 Strategic', 180000, '2027-01-15', '98%', 'David Miller'],
        ['Orion Aerospace', 'Defense & Aviation', 'Tier 1 Strategic', 155000, '2026-11-30', '94%', 'Elena Rostova'],
        ['Borealis Medical', 'Healthcare', 'Tier 1 Strategic', 125000, '2027-03-20', '91%', 'David Miller'],
        ['Pacific Blue Logistics', 'Supply Chain', 'Tier 2 Growth', 88000, '2026-10-15', '89%', 'Yuki Takahashi'],
        ['Nippon Systems', 'Telecommunications', 'Tier 2 Growth', 75000, '2027-05-10', '95%', 'Yuki Takahashi'],
        ['Helios Energy Corp', 'Renewable Energy', 'Tier 2 Growth', 62000, '2026-12-05', '82%', 'Carlos Mendez'],
      ],
      rawRows: [],
      rowCount: 6,
      colCount: 7,
    },
    'Product Inventory': {
      name: 'Product Inventory',
      headers: ['SKU Code', 'Product Name', 'Category', 'Unit Price ($)', 'Warehouse Stock', 'Reorder Level', 'Status'],
      data: [
        ['SKU-101', 'Cloud Node Standard', 'Infrastructure', 2850, 140, 25, 'In Stock'],
        ['SKU-102', 'Cloud Node High-RAM', 'Infrastructure', 4500, 85, 20, 'In Stock'],
        ['SKU-201', 'Enterprise Analytics Seat', 'Software', 890, 420, 50, 'In Stock'],
        ['SKU-301', 'Blade Server Rack v4', 'Hardware', 9200, 8, 10, 'Low Stock'],
        ['SKU-401', 'Endpoint Shield Pro', 'Security', 1150, 310, 40, 'In Stock'],
        ['SKU-501', 'Developer Workspace Core', 'Software', 620, 580, 60, 'In Stock'],
        ['SKU-601', 'Mobile PoS Terminal', 'Hardware', 795, 4, 15, 'Critical Stock'],
      ],
      rawRows: [],
      rowCount: 7,
      colCount: 7,
    },
  },
};

// Initialize rawRows for all sheets in sample workbook
for (const sheet of Object.values(SAMPLE_WORKBOOK_SALES.sheets)) {
  sheet.rawRows = [sheet.headers, ...sheet.data];
}
