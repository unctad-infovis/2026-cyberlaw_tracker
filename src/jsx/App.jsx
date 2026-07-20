import { useRef } from 'react';

import Article from '../Article.mdx';

// Dashboard
import Tracker from './components/Tracker.jsx';

import '@unctad-infovis/general-tools/styles/styles.css';

import meta from './../meta.json';

const components = {
  Tracker
};

const App = () => {
  const appRef = useRef();

  window.appRef = appRef;

  return (
    <div
      className="app"
      style={
        {
          // '--main-color': 'var(--un-color-green-dark)',
          // '--secondary-color': 'var(--un-color-green-text)'
        }
      }
      ref={appRef}
    >
      <Article components={components} meta={meta} />
    </div>
  );
};

export default App;
