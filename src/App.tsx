import { useReducer } from 'react';
import { initialAppState, reducer } from './game/reducer';
import EndingPage from './ui/EndingPage';
import MainPage from './ui/MainPage';
import Modal from './ui/Modal';
import OpeningPage from './ui/OpeningPage';
import RecapPage from './ui/RecapPage';
import WeeklyPage from './ui/WeeklyPage';

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initialAppState);

  return (
    <>
      <div className="wrap">
        {state.page === 'open' && <OpeningPage onStart={() => dispatch({ type: 'START' })} />}
        {state.page === 'main' && <MainPage state={state} dispatch={dispatch} />}
        {state.page === 'weekly' && <WeeklyPage state={state} dispatch={dispatch} />}
        {state.page === 'ending' && <EndingPage state={state} dispatch={dispatch} />}
        {state.page === 'recap' && <RecapPage state={state} dispatch={dispatch} />}
      </div>
      <Modal state={state} dispatch={dispatch} />
    </>
  );
}
