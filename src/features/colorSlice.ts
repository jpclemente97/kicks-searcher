import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ColorState {
  selectedColor: string;
  results: Array<{
    productType: string;
    company: string;
    color: string;
    rgb: { r: number; g: number; b: number };
    url: string;
  }>;
}

const initialState: ColorState = {
  selectedColor: '#ff0000',
  results: [],
};

const colorSlice = createSlice({
  name: 'color',
  initialState,
  reducers: {
    setSelectedColor(state, action: PayloadAction<string>) {
      state.selectedColor = action.payload;
    },
    setResults(state, action: PayloadAction<ColorState['results']>) {
      state.results = action.payload;
    },
  },
});

export const { setSelectedColor, setResults } = colorSlice.actions;
export default colorSlice.reducer;