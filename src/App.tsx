import { useReducer } from 'react';
import { initialAppState, reducer } from './engine/reducer';
import EndingPage from './app/pages/EndingPage';
import MainPage from './app/pages/MainPage';
import Modal from './app/components/Modal';
import OpeningPage from './app/pages/OpeningPage';
import RecapPage from './app/pages/RecapPage';
import WeeklyPage from './app/pages/WeeklyPage';

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
