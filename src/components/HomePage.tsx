import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedColor, setResults } from '../features/colorSlice';
import { RootState } from '../store/store';

const HomePage = () => {
  const dispatch = useDispatch();
  const { selectedColor, results } = useSelector((state: RootState) => state.color);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSelectedColor(e.target.value));
  };

  const handleProductChange = (product: string) => {
    setSelectedProducts((prev) =>
      prev.includes(product)
        ? prev.filter((p) => p !== product) // Deselect if already selected
        : [...prev, product] // Select if not already selected
    );
  };

  const findSimilarColors = async () => {
    setIsLoading(true);
    const targetRgb = hexToRgb(selectedColor);

    const response = await fetch('/allProducts_company_color_hex.csv');
    const csvData = await response.text();
    const colors = parseCsv(csvData);

    // Filter colors by selected product types
    const filteredColors = colors.filter((color) =>
      selectedProducts.includes(color.productType)
    );

    // Find similar colors for each product type
    const similarColors = filteredColors
      .map((color) => ({
        ...color,
        distance: colorDistance(targetRgb, color.rgb),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 50 * selectedProducts.length); // Limit to top 5 per product type

    dispatch(setResults(similarColors));
    console.log(similarColors);
    setIsLoading(false);
  };

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  const colorDistance = (rgb1: { r: number; g: number; b: number }, rgb2: { r: number; g: number; b: number }) => {
    return Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
    );
  };

  const parseCsv = (csv: string) => {
    const lines = csv.split('\n');
    const colors = [];
    for (let i = 1; i < lines.length; i++) {
      const [productType, company, colorString, hex] = lines[i].split(',');
      const rgb = hexToRgb(hex);
      const url = "https://www.kicks.no" + colorString;
      //TODO: Handle guelarian
      let color = colorString.split('/')[5];
      colors.push({ productType, company, color, rgb, url });
    }
    return colors;
  };

  // Group results by product type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.productType]) {
      acc[result.productType] = [];
    }
    acc[result.productType].push(result);
    return acc;
  }, {} as Record<string, typeof results>);

  return (
    <div className="min-h-dvh bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">Color Matcher</h1>

        <div className="flex flex-col items-center space-y-4">
          <input
            type="color"
            value={selectedColor}
            onChange={handleColorChange}
            className="w-24 h-24 border-4 border-white shadow-lg cursor-pointer"
          />

          <div className="flex flex-wrap justify-center gap-4">
            {['Lipstick', 'Nail Polish', 'Lip Liner', 'Bronzer', 'Blush'].map((product) => (
              <label key={product} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(product)}
                  onChange={() => handleProductChange(product)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="text-gray-700">{product}</span>
              </label>
            ))}
          </div>

          <button
            onClick={findSimilarColors}
            disabled={isLoading || selectedProducts.length === 0}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg shadow-md hover:from-blue-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Finding Matches...' : 'Find Similar Colors'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Top Matches</h2>
            <div className="grid grid-cols-1 gap-6">
              {Object.entries(groupedResults).map(([productType, results]) => (
                <div key={productType} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">{productType}</h3>
                  <div className="space-y-4">
                    {results.map((result, index) => (
                      <div key={index} className="p-4 flex bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div
                            className="w-24 h-24 rounded-lg shadow-md"
                            style={{
                              backgroundColor: `rgb(${result.rgb.r}, ${result.rgb.g}, ${result.rgb.b})`,
                            }}
                          ></div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{result.company}</p>
                            <p className="text-xs text-gray-600">{result.color}</p>
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-600 text-xs"
                            >
                              Product Link
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;