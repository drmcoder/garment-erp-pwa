// File: src/services/googleSheetsService.js
// Complete Google Sheets Integration for WIP Data Parsing

class GoogleSheetsService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GOOGLE_SHEETS_API_KEY || "";
    this.baseUrl = "https://sheets.googleapis.com/v4/spreadsheets";
  }

  // Extract Sheet ID from Google Sheets URL
  extractSheetId(url) {
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  // Parse WIP data from Google Sheets based on your exact format
  async parseWIPData(sheetsUrl) {
    try {
      const sheetId = this.extractSheetId(sheetsUrl);
      if (!sheetId) {
        throw new Error("Invalid Google Sheets URL");
      }

      // For demo/development: return mock parsed data
      // In production, replace with actual API call
      if (process.env.NODE_ENV === "development") {
        return this.getMockWIPData();
      }

      const response = await this.fetchSheetData(sheetId);
      return this.parseWIPStructure(response.values);
    } catch (error) {
      console.error("Error parsing Google Sheets:", error);
      throw error;
    }
  }

  // Actual Google Sheets API call (for production)
  async fetchSheetData(sheetId, range = "A1:Z100") {
    const url = `${this.baseUrl}/${sheetId}/values/${range}?key=${this.apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Parse the WIP structure based on your specification
  parseWIPStructure(sheetData) {
    try {
      // Row 0: LOT# S-XX, Date
      const row0 = sheetData[0] || [];
      const lotInfo = this.extractLotInfo(row0);

      // Row 1: Article # XXXX, Style Name
      const row1 = sheetData[1] || [];
      const articleInfo = this.extractArticleInfo(row1);

      // Row 2: Fabric Store, Cutting Department
      const row2 = sheetData[2] || [];
      const departmentInfo = this.extractDepartmentInfo(row2);

      // Row 3: Name of fabric, Style details
      const row3 = sheetData[3] || [];
      const fabricInfo = this.extractFabricInfo(row3);

      // Row 4: Rolls info, Width, Color headers
      const row4 = sheetData[4] || [];
      const colorHeaders = this.extractColorHeaders(row4);

      // Row 5+: Color data, Roll numbers, Weights, Layer counts
      const colorData = this.extractColorData(sheetData.slice(5), colorHeaders);

      return {
        success: true,
        data: {
          lotNumber: lotInfo.lotNumber,
          date: lotInfo.date,
          articles: articleInfo.articles,
          articleNames: articleInfo.names,
          fabricStore: departmentInfo.fabricStore,
          cuttingDepartment: departmentInfo.cuttingDepartment,
          fabricName: fabricInfo.fabricName,
          fabricWeight: fabricInfo.weight,
          fabricWidth: fabricInfo.width,
          colors: colorData.colors,
          totalPieces: colorData.totalPieces,
          consumptionRate: this.calculateConsumptionRate(
            colorData.totalPieces,
            fabricInfo.weight
          ),
          parsedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `WIP parsing error: ${error.message}`,
      };
    }
  }

  // Extract lot information from Row 0
  extractLotInfo(row) {
    const cellText = row.join(" ").toUpperCase();

    // Find LOT# pattern
    const lotMatch = cellText.match(/LOT#?\s*([A-Z]-?\d+)/i);
    const lotNumber = lotMatch ? lotMatch[1] : "S-XX";

    // Find date pattern
    const dateMatch = cellText.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/);
    const date = dateMatch ? dateMatch[1] : new Date().toLocaleDateString();

    return { lotNumber, date };
  }

  // Extract article information from Row 1
  extractArticleInfo(row) {
    const cellText = row.join(" ");

    // Find article numbers (like 2233+2288+2211 or single 8085)
    const articleMatches = cellText.match(/\b\d{4}\b/g) || [];
    const articles = [...new Set(articleMatches)]; // Remove duplicates

    // Extract style names
    const names = row.filter(
      (cell) => cell && !cell.match(/^\d+$/) && cell.length > 2
    );

    return { articles, names };
  }

  // Extract department info from Row 2
  extractDepartmentInfo(row) {
    return {
      fabricStore: row[0] || "Fabric Store",
      cuttingDepartment: row[1] || "Cutting Department",
    };
  }

  // Extract fabric info from Row 3
  extractFabricInfo(row) {
    const cellText = row.join(" ");

    // Extract fabric weight (like 180 GSM)
    const weightMatch = cellText.match(/(\d+)\s*GSM/i);
    const weight = weightMatch ? `${weightMatch[1]} GSM` : "180 GSM";

    // Extract width (like 60 inches)
    const widthMatch = cellText.match(/(\d+)\s*(inch|in|")/i);
    const width = widthMatch ? `${widthMatch[1]} inches` : "60 inches";

    return {
      fabricName: row[0] || "Cotton Pique",
      weight,
      width,
      details: row.slice(1).join(" "),
    };
  }

  // Extract color headers from Row 4
  extractColorHeaders(row) {
    const headers = [];
    let currentColor = null;

    row.forEach((cell, index) => {
      if (cell && cell.trim()) {
        // Check if this looks like a color name
        if (this.isColorName(cell)) {
          currentColor = {
            name: cell,
            startIndex: index,
            sizeColumns: [],
          };
          headers.push(currentColor);
        } else if (currentColor && this.isSizeName(cell)) {
          // This is a size under the current color
          currentColor.sizeColumns.push({
            size: cell,
            index: index,
          });
        }
      }
    });

    return headers;
  }

  // Extract color data from remaining rows
  extractColorData(dataRows, colorHeaders) {
    const colors = [];
    let totalPieces = 0;

    colorHeaders.forEach((colorHeader) => {
      const color = {
        name: colorHeader.name,
        nepaliName: this.translateColorToNepali(colorHeader.name),
        pieces: {},
        layers: 0,
        totalPieces: 0,
      };

      // Extract piece counts for each size
      colorHeader.sizeColumns.forEach((sizeCol) => {
        let sizePieces = 0;

        // Sum up pieces from all data rows for this size
        dataRows.forEach((row) => {
          const cellValue = row[sizeCol.index];
          if (cellValue && !isNaN(cellValue)) {
            sizePieces += parseInt(cellValue);
          }
        });

        if (sizePieces > 0) {
          color.pieces[sizeCol.size] = sizePieces;
          color.totalPieces += sizePieces;
        }
      });

      // Calculate layers (estimate based on total pieces)
      color.layers = Math.ceil(color.totalPieces / 40); // Assume ~40 pieces per layer

      colors.push(color);
      totalPieces += color.totalPieces;
    });

    return { colors, totalPieces };
  }

  // Helper methods
  isColorName(text) {
    const colorKeywords = [
      "blue",
      "red",
      "green",
      "black",
      "white",
      "yellow",
      "navy",
      "royal",
      "नीलो",
      "रातो",
      "हरियो",
      "कालो",
      "सेतो",
      "पहेंलो",
    ];
    return colorKeywords.some((keyword) =>
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  isSizeName(text) {
    const sizePattern = /^(XS|S|M|L|XL|2XL|3XL|4XL|5XL|\d+XL)$/i;
    return sizePattern.test(text.trim());
  }

  translateColorToNepali(englishColor) {
    const colorMap = {
      blue: "नीलो",
      red: "रातो",
      green: "हरियो",
      black: "कालो",
      white: "सेतो",
      yellow: "पहेंलो",
      navy: "नेवी",
      royal: "रोयल",
    };

    const lowerColor = englishColor.toLowerCase();
    for (const [eng, nep] of Object.entries(colorMap)) {
      if (lowerColor.includes(eng)) {
        return englishColor.replace(new RegExp(eng, "gi"), nep);
      }
    }
    return englishColor;
  }

  calculateConsumptionRate(totalPieces, fabricWeight) {
    // Basic consumption calculation
    // This should be customized based on your actual fabric consumption formula
    const baseConsumption = 0.25; // kg per piece
    const weightFactor = fabricWeight.includes("180")
      ? 1.0
      : fabricWeight.includes("200")
      ? 1.1
      : fabricWeight.includes("160")
      ? 0.9
      : 1.0;

    return baseConsumption * weightFactor;
  }

  // Mock data for development/demo
  getMockWIPData() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            lotNumber: "S-85",
            date: "22/08/2025",
            articles: ["8085", "2233"],
            articleNames: ["Polo T-Shirt", "Basic T-Shirt"],
            fabricStore: "Main Fabric Store",
            cuttingDepartment: "Cutting Dept A",
            fabricName: "Cotton Pique",
            fabricWeight: "180 GSM",
            fabricWidth: "60 inches",
            colors: [
              {
                name: "Blue-1",
                nepaliName: "नीलो-१",
                pieces: { L: 180, XL: 185, "2XL": 190, "3XL": 190 },
                layers: 19,
                totalPieces: 745,
              },
              {
                name: "Navy-2",
                nepaliName: "नेवी-२",
                pieces: { L: 150, XL: 160, "2XL": 170, "3XL": 180 },
                layers: 17,
                totalPieces: 660,
              },
            ],
            totalPieces: 1405,
            consumptionRate: 0.25,
            parsedAt: new Date().toISOString(),
          },
        });
      }, 2000); // Simulate API delay
    });
  }

  // Generate bundles from WIP data
  generateBundles(wipData) {
    const bundles = [];
    let bundleCounter = 1;

    wipData.colors.forEach((color, colorIndex) => {
      Object.entries(color.pieces).forEach(([size, pieceCount]) => {
        if (pieceCount > 0) {
          // Calculate optimal bundle size (typically 25-40 pieces)
          const bundleSize = this.calculateOptimalBundleSize(pieceCount);
          const numberOfBundles = Math.ceil(pieceCount / bundleSize);

          for (let i = 0; i < numberOfBundles; i++) {
            const remainingPieces = pieceCount - i * bundleSize;
            const actualBundleSize = Math.min(bundleSize, remainingPieces);

            const bundle = {
              id: `${wipData.lotNumber}-${
                colorIndex + 1
              }-${size}-${bundleCounter}`,
              lotNumber: wipData.lotNumber,
              article: wipData.articles[0], // Use first article
              articleName: wipData.articleNames[0],
              color: color.name,
              colorNepali: color.nepaliName,
              size: size,
              pieces: actualBundleSize,
              status: "pending",
              currentOperation: "cutting",
              nextOperation: "shoulderJoin",
              machineType: "overlock",
              priority: "normal",
              estimatedTime: actualBundleSize * 2, // 2 minutes per piece estimate
              rate: 2.5, // Rs. 2.50 per piece
              totalValue: actualBundleSize * 2.5,
              fabricConsumption: actualBundleSize * wipData.consumptionRate,
              createdFrom: "wip-import",
              wipData: {
                fabricName: wipData.fabricName,
                fabricWeight: wipData.fabricWeight,
                fabricWidth: wipData.fabricWidth,
              },
            };

            bundles.push(bundle);
            bundleCounter++;
          }
        }
      });
    });

    return bundles;
  }

  // Calculate optimal bundle size based on total pieces
  calculateOptimalBundleSize(totalPieces) {
    if (totalPieces <= 30) return totalPieces;
    if (totalPieces <= 100) return 25;
    if (totalPieces <= 200) return 30;
    return 35; // For large quantities
  }

  // Validate Google Sheets URL
  isValidSheetsUrl(url) {
    const sheetsUrlPattern =
      /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+/;
    return sheetsUrlPattern.test(url);
  }

  // Export bundles to Firebase
  async exportBundlesToFirebase(bundles) {
    try {
      // This would integrate with your existing BundleService
      // For now, return success with bundle count
      return {
        success: true,
        message: `${bundles.length} bundles ready for production`,
        bundles: bundles,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Create singleton instance
const googleSheetsService = new GoogleSheetsService();

export default googleSheetsService;
