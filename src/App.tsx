import { useReducer } from 'react';
import { initialAppState, reducer } from './engine/reducer';
import EndingPage from './app/EndingPage';
import MainPage from './app/MainPage';
import Modal from './app/Modal';
import OpeningPage from './app/OpeningPage';
import RecapPage from './app/RecapPage';
import WeeklyPage from './app/WeeklyPage';

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initialAppState);

  return (
    <>
      <div className="wrap">
        {state.ui.page === 'open' && <OpeningPage onStart={() => dispatch({ type: 'START' })} />}
        {state.ui.page === 'main' && <MainPage state={state} dispatch={dispatch} />}
        {state.ui.page === 'weekly' && <WeeklyPage state={state} dispatch={dispatch} />}
        {state.ui.page === 'ending' && <EndingPage state={state} dispatch={dispatch} />}
        {state.ui.page === 'recap' && <RecapPage state={state} dispatch={dispatch} />}
      </div>
      <Modal state={state} dispatch={dispatch} />
    </>
  );
}
