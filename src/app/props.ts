import type { Dispatch } from 'react';
import type { Action, AppState } from '../engine/types';

export interface UiProps {
  state: AppState;
  dispatch: Dispatch<Action>;
}
