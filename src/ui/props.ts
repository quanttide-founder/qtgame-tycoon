import type { Dispatch } from 'react';
import type { Action, AppState } from '../game/types';

export interface UiProps {
  state: AppState;
  dispatch: Dispatch<Action>;
}
