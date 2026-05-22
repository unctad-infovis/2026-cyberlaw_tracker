import { useCallback, useEffect, useRef, useState } from 'react';

// https://www.npmjs.com/package/react-is-visible
import { useIsVisible } from 'react-is-visible';

import Select from 'react-select';

// Load helpers.
import LoadFile from './../helpers/LoadFile.js';
import CSVtoJSON from './../helpers/CsvToJson.js';
import ChartMap from './tracker/ChartMap.jsx';
import ChartTable from './tracker/ChartTable.jsx';

import './Tracker.css';

function App({ meta }) {
  const appRef = useRef(null);
  const isVisibleApp = useIsVisible(appRef);

  const [data, setData] = useState(false);
  const [options, setOptions] = useState(false);

  const [type, setType] = useState('Overview');
  const [country, setCountry] = useState(null);
  const [hoverCountry, setHoverCountry] = useState(null);

  const [tableState, setTableState] = useState('expanded');

  const checkWidth = useCallback(() => {
    if (appRef.current.offsetWidth < 900) {
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

  const fetchExternalData = useCallback(async () => {
    const data = {};

    data.data = await (await LoadFile(`./assets/data/data.csv?${meta.updated_file}`)).text();
    data.document_links = await (await LoadFile(`./assets/data/document_links.json?${meta.updated_file}`)).json();
    data.topology = await (await LoadFile('./assets/data/worldmap-economies-54030.topo.json')).json();

    return data;
  }, [meta.updated_file]);

  const calculateLegislationPercentages = useCallback(country_data => {
    const legislations = ['Consumer Protection', 'Cybercrime', 'Electronic Transactions', 'Indirect Taxation', 'Privacy and Data Protection'];

    const groups = ['Africa', 'Asia and Oceania', 'Developed countries', 'Developing countries', 'Landlocked developing countries', 'Latin America and Caribbean', 'Least developed countries', 'Small island developing states'];

    const statuses = ['Legislation', 'Draft Legislation', 'No Legislation', 'No Data'];

    const result = {};

    // Initialize structure
    legislations.forEach(leg => {
      result[leg] = {};

      statuses.forEach(status => {
        result[leg][status] = { World: 0 };

        groups.forEach(g => {
          result[leg][status][g] = 0;
        });
      });
    });

    // Totals per group
    const totals = {
      World: country_data.length
    };

    groups.forEach(g => {
      totals[g] = country_data.filter(d => Number(d[g]) === 1).length;
    });

    // Count occurrences
    country_data.forEach(row => {
      legislations.forEach(leg => {
        const status = row[leg] || 'No Data';

        if (!result[leg][status]) return;

        result[leg][status].World += 1;

        groups.forEach(g => {
          if (Number(row[g]) === 1) {
            result[leg][status][g] += 1;
          }
        });
      });
    });

    // Convert counts → percentages
    legislations.forEach(leg => {
      statuses.forEach(status => {
        result[leg][status].World = (result[leg][status].World / totals.World) * 100;

        groups.forEach(g => {
          result[leg][status][g] = totals[g] ? (result[leg][status][g] / totals[g]) * 100 : 0;
        });
      });
    });

    return result;
  }, []);

  useEffect(() => {
    fetchExternalData().then(result => {
      result.data = CSVtoJSON(result.data);

      result.data = result.data.map(el => {
        const categories = ['Consumer Protection', 'Cybercrime', 'Electronic Transactions', 'Indirect Taxation', 'Privacy and Data Protection'];

        const count = categories.reduce((total, category) => total + (el[category] === 'Legislation' ? 1 : 0), 0);

        el.country = result.topology.objects.economies.geometries.find(geometry => geometry.properties.code === el.code).properties.labelen;

        return {
          ...el,
          value: count
        };
      });

      const groups = [
        {
          label: 'Country groups',
          options: [
            { value: 'World', label: 'World' },
            { value: 'Africa', label: 'Africa' },
            { value: 'Asia and Oceania', label: 'Asia and Oceania' },
            { value: 'Developed countries', label: 'Developed countries' },
            { value: 'Developing countries', label: 'Developing countries' },
            { value: 'Landlocked developing countries', label: 'Landlocked developing countries (LLDCs)' },
            { value: 'Latin America and Caribbean', label: 'Latin America and Caribbean' },
            { value: 'Least developed countries', label: 'Least developed countries (LDCs)' },
            { value: 'Small island developing states', label: 'Small island developing states (SIDS)' }
          ]
        }
      ];

      const countries = [
        {
          label: 'Countries',
          options: result.data
            .slice()
            .sort((a, b) => a.country.localeCompare(b.country))
            .map(el => ({ value: el.country, label: el.country }))
        }
      ];

      setOptions([...groups, ...countries]);
      // NEW: calculate legislation percentages
      result.legislationStats = calculateLegislationPercentages(result.data);

      return setData(result);
    });
  }, [calculateLegislationPercentages, fetchExternalData]);

  const changeType = element => {
    for (const el of appRef.current.querySelectorAll('.selection_container.type_selection button')) {
      el.classList.remove('active');
    }
    appRef.current.querySelector('.description').innerHTML = element.dataset.desc;
    element.classList.add('active');
    setType(element.value);
  };

  useEffect(() => {
    const getHashtag = () => decodeURIComponent(window.location.hash.slice(1));
    const legislations = ['Electronic Transactions', 'Privacy and Data Protection', 'Cybercrime', 'Consumer Protection', 'Indirect Taxation'];
    const hashtag_idx = legislations.indexOf(getHashtag());
    if (hashtag_idx > -1) {
      appRef.current.querySelector(`.button_${hashtag_idx + 1}`).click();
      window.location.hash = '';
    }
  }, []);

  const changeCountry = option => {
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
    valueContainer: provided => ({
      ...provided,
      height: 28,
      padding: '0 8px'
    }),
    // input itself (text cursor area)
    input: provided => ({
      ...provided,
      margin: 0,
      padding: 0
    }),
    // the selected value text (single)
    singleValue: provided => ({
      ...provided,
      marginTop: 17,
      transform: 'translateY(-50%)'
    }),
    // indicators on the right (chevron, clear)
    indicatorsContainer: provided => ({
      ...provided,
      height: 28
    }),
    // controls the dropdown option height/padding
    option: provided => ({
      ...provided,
      minHeight: 38,
      padding: '10px 12px'
    })
  };
  return (
    <figure className="tracker_container" ref={appRef}>
      <div className="title_container">
        <div className="text_container">
          <div className="main_title_container">
            <img src="https://static.dwcdn.net/custom/themes/unctad-2024-rebrand/Blue%20arrow.svg" className="logo" alt="UN Trade and Development logo" width="44" height="44" />
            <div className="title">
              <h3>Browse the data</h3>
            </div>
          </div>
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
                  <button type="button" className="active" value="Overview" data-desc="" onClick={event => changeType(event.currentTarget)}>
                    <div className="title">Overview</div>
                  </button>
                </div>
                <div className="selector_container">
                  <button
                    type="button"
                    className="button_1"
                    value="Electronic Transactions"
                    data-desc="Covers the legal recognition and validity of electronic communications, contracts, records, and signatures. Includes authentication mechanisms such as electronic signatures, digital certificates, trust services, and electronic record retention."
                    onClick={event => changeType(event.currentTarget)}
                  >
                    <div className="title">E-transactions</div>
                  </button>
                </div>
                <div className="selector_container">
                  <button
                    className="button_2"
                    data-desc="Covers the collection, processing, storage, and transfer of personal data, including individual rights and obligations on those responsible for data control and processing. Includes consent requirements, data subject rights, breach notification rules, and cross-border data transfer frameworks."
                    onClick={event => changeType(event.currentTarget)}
                    type="button"
                    value="Privacy and Data Protection"
                  >
                    <div className="title">Data protection and privacy</div>
                  </button>
                </div>
                <div className="selector_container">
                  <button
                    className="button_3"
                    data-desc="Covers offences committed against or through computer systems and data, along with related investigative and procedural powers. Includes unauthorised access, data and system interference, online fraud, digital evidence, and interception powers."
                    onClick={event => changeType(event.currentTarget)}
                    type="button"
                    value="Cybercrime"
                  >
                    <div className="title">Cybercrime</div>
                  </button>
                </div>
                <div className="selector_container">
                  <button
                    className="button_4"
                    data-desc="Covers consumer rights and business obligations in online transactions, including information disclosure, unfair commercial practices, and redress mechanisms. Includes distance selling rules, withdrawal rights, platform responsibilities, and dispute resolution."
                    onClick={event => changeType(event.currentTarget)}
                    type="button"
                    value="Consumer Protection"
                  >
                    <div className="title">Consumer protection</div>
                  </button>
                </div>
                <div className="selector_container">
                  <button
                    className="button_5"
                    data-desc="Covers the application and collection of consumption taxes such as VAT or GST on electronic commerce, including cross-border digital goods and services. Includes taxation of digital services, registration of non-resident suppliers, platform liability, and simplified compliance regimes."
                    onClick={event => changeType(event.currentTarget)}
                    type="button"
                    value="Indirect Taxation"
                  >
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
                  {options && (
                    <Select
                      className="basic-multi-select"
                      classNamePrefix="select"
                      defaultValue=""
                      isClearable
                      isDisabled={false}
                      isLoading={false}
                      isMulti
                      isOptionDisabled={option => option.isdisabled}
                      isRtl={false}
                      isSearchable
                      name="country"
                      onChange={selectedOption => changeCountry(selectedOption)}
                      options={options}
                      placeholder="Select economy "
                      styles={customStyles}
                      value={country}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
          <p className="description" />
          <div className="legend_container">
            {type === 'Overview' && (
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
                <div className="legend_item legend_item_legislation">Legislation</div>
                <div className="legend_item legend_item_draft_legislation">Draft legislation</div>
                <div className="legend_item legend_item_no_legislation">No legislation</div>
                <div className="legend_item">No data</div>
              </>
            )}
          </div>
          <div className="visualization_container">
            <div className="map_wrapper">{data !== false && <ChartMap country={country} hover_country={hoverCountry} table_collapsed={tableState} setCountry={setCountry} setHoverCountry={setHoverCountry} type={type} values={data} />}</div>
            {data !== false && (
              <div className={`table_wrapper ${tableState}`}>
                <div className="table_controls_container">
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
                </div>
                <ChartTable country={country} hover_country={hoverCountry} setCountry={setCountry} setHoverCountry={setHoverCountry} table_collapsed={tableState} type={type} values={data} />
              </div>
            )}
          </div>
          <div className="caption_container">
            <em>Source:</em> UN Trade and Development (UNCTAD). Updated {meta.updated_text}.
            <br />
            <em>Note:</em> The Cyberlaw Tracker is the result of a collaborative effort and rely on the data provided by member states, various organizations such as UNCITRAL and individuals such as Graham Greenleaf, Professor of Law and Information Systems at UNSW Australia Faculty of Law.{' '}
            <a className="caption_link" href="https://unctad.org/page/map-disclaimer" target="_blank" rel="noreferrer">
              Map disclaimer
            </a>
            .
            <br />
            <a href="https://storage.unctad.org/2026-cyberlaw_tracker/assets/data/data.csv" target="_blank" rel="noreferrer">
              Get the data
            </a>
          </div>
        </div>
      </div>
    </figure>
  );
}

export default App;
