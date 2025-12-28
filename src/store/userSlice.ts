// src/store/userSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  isAuthenticated: boolean;
  isPremiumUser: boolean;
  email: string | null;
}

const initialState: UserState = {
  isAuthenticated: false,
  isPremiumUser: false,
  email: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    login(state, action: PayloadAction<{ email: string }>) {
      state.isAuthenticated = true;
      state.email = action.payload.email;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.email = null;
      state.isPremiumUser = false;
    },
    upgradeToPremium(state) {
      state.isPremiumUser = true;
    },
  },
});

export const { login, logout, upgradeToPremium } = userSlice.actions;
export default userSlice.reducer;
