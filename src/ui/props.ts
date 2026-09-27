import type { Dispatch } from 'react';
import type { Action } from '../game/reducer';
import type { AppState } from '../game/types';

export interface UiProps {
  state: AppState;
  dispatch: Dispatch<Action>;
}
