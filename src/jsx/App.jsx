import React, {
  useState, useEffect, useRef, useCallback
} from 'react';
import '../styles/styles.less';

// https://www.npmjs.com/package/react-is-visible
import 'intersection-observer';
import { useIsVisible } from 'react-is-visible';

import Select from 'react-select';
import { Tooltip } from 'react-tooltip';

// Load helpers.
import ChartMap from './components/ChartMap.jsx';
import ChartTable from './components/ChartTable.jsx';

import CSVtoJSON from './helpers/CsvToJson.js';

function App() {
  const appRef = useRef(null);
  const isVisibleApp = useIsVisible(appRef);

  const [data, setData] = useState(false);

  const [type, setType] = useState('Overview');
  const [country, setCountry] = useState(null);
  const [hoverCountry, setHoverCountry] = useState(null);

  const [tableState, setTableState] = useState('expanded');

  const fetchExternalData = () => {
    const dataPath = `${(window.location.href.includes('unctad.org')) ? 'https://storage.unctad.org/2026-cyberlaw_tracker/' : (window.location.href.includes('localhost:80')) ? './' : 'https://unctad-infovis.github.io/2026-cyberlaw_tracker/'}assets/data/`;

    const topology_file = 'worldmap-economies-54030.topo.json';
    const data_file = 'data.csv';
    let values;
    try {
      values = Promise.all([
        fetch(dataPath + topology_file),
        fetch(dataPath + data_file),
      ]).then(results => Promise.all(results.map((result, i) => {
        if (i === 0) {
          return result.json();
        }
        return result.text();
      })));
    } catch (error) {
      console.error(error);
    }
    return values;
  };

  const checkWidth = useCallback(() => {
    if (appRef.current.offsetWidth < 600) {
      setTimeout(() => {
        setTableState('collapsed');
      }, 1500);
    }
  }, []);

  useEffect(() => {
    if (isVisibleApp === true) {
      checkWidth();
    }
  }, [checkWidth, isVisibleApp]);

  useEffect(() => {
    fetchExternalData().then((result) => {
      result[1] = CSVtoJSON(result[1]);
      result[1] = result[1].map(el => {
        const categories = [
          'Electronic Transactions',
          'Consumer Protection',
          'Privacy and Data Protection',
          'Cybercrime',
          'Indirect Taxation'
        ];

        const count = categories.reduce((total, category) => total + (el[category] === 'Legislation' ? 1 : 0), 0);

        return {
          ...el,
          value: count
        };
      });
      return setData(result);
    });
  }, []);

  const changeType = (element) => {
    appRef.current.querySelectorAll('.selection_container.type_selection button').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    setType(element.value);
  };

  const changeCountry = (option) => {
    setCountry(option && (!Array.isArray(option) || option.length) ? option : null);
    setHoverCountry(option && (!Array.isArray(option) || option.length) ? option : null);
  };

  const customStyles = {
  // outer control (border, background)
    control: (provided, state) => ({
      ...provided,
      boxShadow: state.isFocused ? provided.boxShadow : null,
      height: 28,
      minHeight: 28 // control height
    }),
    // area that contains value & input
    valueContainer: (provided) => ({
      ...provided,
      height: 28,
      padding: '0 8px'
    }),
    // input itself (text cursor area)
    input: (provided) => ({
      ...provided,
      margin: 0,
      padding: 0
    }),
    // the selected value text (single)
    singleValue: (provided) => ({
      ...provided,
      marginTop: 17,
      transform: 'translateY(-50%)'
    }),
    // indicators on the right (chevron, clear)
    indicatorsContainer: (provided) => ({
      ...provided,
      height: 28
    }),
    // controls the dropdown option height/padding
    option: (provided) => ({
      ...provided,
      minHeight: 38,
      padding: '10px 12px'
    }),
  };
  return (
    <div className="app" ref={appRef}>
      <div className="title_container">
        <div className="text_container">
          <div className="main_title_container">
            <img src="https://static.dwcdn.net/custom/themes/unctad-2024-rebrand/Blue%20arrow.svg" className="logo" alt="UN Trade and Development logo" width="44" height="44" />
            <div className="title">
              <h3>Global cyberlaw tracker</h3>
            </div>
          </div>
          <h4>The UNCTAD Global Cyberlaw Tracker is the first global initiative to map the status of cyberlaw adoption worldwide. It monitors e-commerce legislation across 195 UNCTAD member states, focusing on five key areas: e-transactions, consumer protection, data protection/privacy, cybercrime and indirect taxation.</h4>
          <h4>The tracker indicates whether a country has enacted relevant legislation, has a draft law under consideration or where the information is unavailable is marked as having. &apos;no data&apos;.</h4>
          <h4>
            If you would like to update or amend your country&apos;s data, please fill in the  questionnaire  and forward your response to
            {' '}
            <a href="mailto:ecde@unctad.org">ecde@unctad.org</a>
            .
          </h4>
        </div>
      </div>
      <div className="visualizations_container">
        <div className="content">
          <div className="controls_container">
            <div className="control_container">
              <div className="label_container">
                <h4>
                  <span>1</span>
                  Select indicator
                </h4>
              </div>
              <div className="selection_container type_selection">
                <div className="selector_container">
                  <button type="button" className="active" value="Overview" onClick={(event) => changeType(event.currentTarget)}>
                    <div className="title">Overview</div>
                  </button>
                </div>
                <div className="selector_container">
                  <button type="button" value="Electronic Transactions" onClick={(event) => changeType(event.currentTarget)}>
                    <div className="title">E-transactions</div>
                  </button>
                </div>
                <div className="selector_container">
                  <button type="button" value="Privacy and Data Protection" onClick={(event) => changeType(event.currentTarget)}>
                    <div className="title">Data protection and privacy</div>
                  </button>
                </div>
                <div className="selector_container">
                  <button type="button" value="Cybercrime" onClick={(event) => changeType(event.currentTarget)}>
                    <div className="title">Cybercrime</div>
                  </button>
                </div>
                <div className="selector_container">
                  <button type="button" value="Consumer Protection" onClick={(event) => changeType(event.currentTarget)}>
                    <div className="title">Consumer protection</div>
                  </button>
                </div>
                <div className="selector_container">
                  <button type="button" value="Indirect Taxation" onClick={(event) => changeType(event.currentTarget)}>
                    <div className="title">Indirect taxation</div>
                  </button>
                </div>
              </div>
            </div>
            <div className="control_container">
              <div className="label_container">
                <h4>
                  <span>2</span>
                  Select economy or region
                </h4>
              </div>
              <div className="selection_container">
                <div className="selector_container">
                  {data
                && (
                <Select
                  className="basic-single"
                  classNamePrefix="select"
                  defaultValue=""
                  isClearable
                  isDisabled={false}
                  isLoading={false}
                  isRtl={false}
                  isSearchable
                  name="country"
                  onChange={(selectedOption) => changeCountry(selectedOption)}
                  options={data[1].slice().sort((a, b) => a.country.localeCompare(b.country)).map((el) => ({ value: el.country, label: el.country }))}
                  placeholder="Select economy "
                  styles={customStyles}
                  value={country}
                />
                )}
                </div>
              </div>
            </div>
          </div>
          <div className="legend_container">
            {type === 'Overview'
            && (
              <>
                <div className="legend_item legend_item_5">5 areas</div>
                <div className="legend_item legend_item_4">4 areas</div>
                <div className="legend_item legend_item_3">3 areas</div>
                <div className="legend_item legend_item_2">2 areas</div>
                <div className="legend_item legend_item_1">1 area</div>
                <div className="legend_item legend_item_0">No legislation</div>
                <div className="legend_item">No data</div>
              </>
            )}
            {type !== 'Overview' && (
              <>
                <div className="legend_item legend_item_legislation">Legislation areas</div>
                <div className="legend_item legend_item_draft_legislation">Draft legislation</div>
                <div className="legend_item legend_item_no_legislation">No legislation</div>
                <div className="legend_item">No data</div>
              </>
            )}
          </div>
          <div className="visualization_container">
            <div className="map_wrapper">
              {/* <p>
                <strong>Mapping the size</strong>
                <br />
                Trade-weighted average
                {' '}
                <i className="circle_info" aria-hidden="true" data-tooltip-id="my-tooltip-1" title="">i</i>
              </p> */}
              {data !== false && (
                <ChartMap
                  country={country}
                  hover_country={hoverCountry}
                  table_collapsed={tableState}
                  setCountry={setCountry}
                  setHoverCountry={setHoverCountry}
                  type={type}
                  values={data}
                />
              )}
            </div>
            {data !== false && (
              <div className={`table_wrapper ${tableState}`}>
                <div className="table_controls_container">
                  {tableState !== 'full' && appRef.current.offsetWidth < 900 && (
                  <button
                    type="button"
                    onClick={() => {
                      setTableState(prev => {
                        if (prev === 'collapsed') return 'expanded';
                        if (prev === 'expanded') return 'collapsed';
                        if (prev === 'full') return 'expanded';
                        return prev;
                      });
                    }}
                  >
                    {tableState === 'collapsed' ? '◀◀' : '▶▶'}
                  </button>
                  )}
                  {' '}
                  {appRef.current.offsetWidth > 900 && false && (
                  <button
                    type="button"
                    onClick={() => {
                      setTableState(prev => {
                        if (prev === 'full') return 'expanded';
                        if (prev === 'expanded') return 'full';
                        return prev;
                      });
                    }}
                  >
                    {tableState === 'full' ? '▶▶' : '⛶'}
                  </button>
                  )}
                </div>
                {/* <p>
                  <strong>Mapping the difference</strong>
                  <br />
                  Trade-weighted average
                  {' '}
                  <i className="circle_info" aria-hidden="true" data-tooltip-id="my-tooltip-1" title="">i</i>
                </p> */}
                <ChartTable
                  country={country}
                  hover_country={hoverCountry}
                  setCountry={setCountry}
                  setHoverCountry={setHoverCountry}
                  table_collapsed={tableState}
                  type={type}
                  values={data}
                />
              </div>
            )}
          </div>
          <div className="caption_container">
            <em>Source:</em>
            {' '}
            UN Trade and Development (UNCTAD)
            <br />
            <em>Note:</em>
            {' '}
            The Cyberlaw Tracker is the result of a collaborative effort and rely on the data provided by member states, various organizations such as UNCITRAL and individuals such as Graham Greenleaf, Professor of Law and Information Systems at UNSW Australia Faculty of Law.
            {' '}
            <a href="https://unctad.org/page/map-disclaimer" target="_blank" rel="noreferrer">Map disclaimer</a>
            .
            <br />
            <a href="https://storage.unctad.org/2026-cyberlaw_tracker/assets/data/data.csv" target="_blank" rel="noreferrer">Get the data</a>
          </div>
        </div>
      </div>
      <Tooltip
        className="my_tooltip"
        id="my-tooltip-1"
        place="top"
        content="The trade-weighted average tariff rate applied to each economy is based on the composition of exports to the US in 2024."
      />
    </div>
  );
}

export default App;
