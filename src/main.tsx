import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// 不启用 StrictMode：reducer 内含 Math.random，开发态双调用会消耗双份随机数、改变游戏结果。
createRoot(document.getElementById('root') as HTMLElement).render(<App />);
