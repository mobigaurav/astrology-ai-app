// src/store/readingSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface TarotCard {
  name: string;
  isReversed: boolean;
}

interface ReadingState {
  selectedTarotCards: TarotCard[];
  palmImageUri: string | null;
  faceImageUri: string | null;
}

const initialState: ReadingState = {
  selectedTarotCards: [],
  palmImageUri: null,
  faceImageUri: null,
};

const readingSlice = createSlice({
  name: "reading",
  initialState,
  reducers: {
    selectTarotCards(state, action: PayloadAction<TarotCard[]>) {
      state.selectedTarotCards = action.payload;
    },
    uploadPalmImage(state, action: PayloadAction<string>) {
      state.palmImageUri = action.payload;
    },
    uploadFaceImage(state, action: PayloadAction<string>) {
      state.faceImageUri = action.payload;
    },
  },
});

export const {
  selectTarotCards,
  uploadPalmImage,
  uploadFaceImage,
} = readingSlice.actions;
export default readingSlice.reducer;
