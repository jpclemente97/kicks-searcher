import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedColor, setResults } from '../features/colorSlice';
import { RootState } from '../store/store';
import 'bootstrap/dist/css/bootstrap.min.css';
import './HomePage.css';

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
        ? prev.filter((p) => p !== product)
        : [...prev, product]
    );
  };

  const findSimilarColors = async () => {
    setIsLoading(true);
    const targetRgb = hexToRgb(selectedColor);

    const response = await fetch('/allProducts_company_color_hex.csv');
    const csvData = await response.text();
    const colors = parseCsv(csvData);

    const filteredColors = colors.filter((color) =>
      selectedProducts.includes(color.productType)
    );

    const similarColors = filteredColors
      .map((color) => ({
        ...color,
        distance: colorDistance(targetRgb, color.rgb),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 50 * selectedProducts.length); // 50 products per selection, ask if less is good

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

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.productType]) {
      acc[result.productType] = [];
    }
    acc[result.productType].push(result);
    return acc;
  }, {} as Record<string, typeof results>);

  return (
    <div className="min-vh-100 bg-light p-4">
      <div className="container bg-white rounded shadow p-4">
        <h1 className="text-center text-dark mb-4">Color Matcher</h1>

        <div className="d-flex flex-column align-items-center gap-3">
          <input
            type="color"
            value={selectedColor}
            onChange={handleColorChange}
            className="form-control-color border shadow"
            style={{ width: '100px', height: '100px' }}
          />

          <div className="d-flex flex-wrap justify-content-center gap-3">
            {['Lipstick', 'Nail Polish', 'Lip Liner', 'Bronzer', 'Blush'].map((product) => (
              <div key={product} className="form-check">
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(product)}
                  onChange={() => handleProductChange(product)}
                  className="form-check-input"
                  id={product}
                />
                <label className="form-check-label" htmlFor={product}>
                  {product}
                </label>
              </div>
            ))}
          </div>

          <button
            onClick={findSimilarColors}
            disabled={isLoading || selectedProducts.length === 0}
            className="btn btn-primary btn-gradient"
          >
            {isLoading ? 'Loading' : 'Find Similar Colors'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-5">
            <h2 className="text-center text-dark mb-4">Top Matches</h2>
            <div className="row gap-4">
              {Object.entries(groupedResults).map(([productType, results]) => (
                <div key={productType} className="col-12 bg-white rounded shadow p-4">
                  <h3 className="text-dark mb-3">{productType}</h3>
                  <div className="d-flex flex-column gap-3">
                    {results.map((result, index) => (
                      <div key={index} className="d-flex align-items-center gap-3 p-3 bg-light rounded">
                        <div
                          className="rounded shadow"
                          style={{
                            width: '100px',
                            height: '100px',
                            backgroundColor: `rgb(${result.rgb.r}, ${result.rgb.g}, ${result.rgb.b})`,
                          }}
                        ></div>
                        <div>
                          <p className="mb-1 text-dark">{result.company}</p>
                          <p className="mb-1 text-secondary">{result.color}</p>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary"
                          >
                            Product Link
                          </a>
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