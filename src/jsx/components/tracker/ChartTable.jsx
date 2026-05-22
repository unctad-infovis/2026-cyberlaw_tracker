import React, { useEffect, useRef, useState } from 'react';

// Load helpers.
import roundNr from './../../helpers/RoundNr.js';
import generateIcon from './helpers/GenerateIcon.jsx';

function ChartTable({ country = null, type, values }) {
  const chartTableRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [tableData, setTableData] = useState(false);

  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = rowId => {
    setExpandedRows(prev => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  // Measure container size
  useEffect(() => {
    const updateSize = () => {
      if (chartTableRef.current) {
        setContainerSize({
          height: chartTableRef.current.offsetHeight,
          width: chartTableRef.current.offsetWidth
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (country) {
      setTableData(values.data.filter(el => country.some(c => c.label === el.country)));
    } else {
      setTableData(values.data);
    }
  }, [country, values]);

  const setCount = el => {
    let count = 0;

    if (el['Electronic Transactions'] === 'Legislation') {
      count++;
    }
    if (el['Consumer Protection'] === 'Legislation') {
      count++;
    }
    if (el['Privacy and Data Protection'] === 'Legislation') {
      count++;
    }
    if (el.Cybercrime === 'Legislation') {
      count++;
    }
    if (el['Indirect Taxation'] === 'Legislation') {
      count++;
    }
    return count;
  };

  return (
    <div ref={chartTableRef} className="table_container">
      <table style={{ width: `${containerSize.width}px` }} cellPadding="0" cellSpacing="0">
        {type === 'Overview' && (
          <>
            <thead>
              <tr>
                <th className="region">Law</th>
                <th className="share">Share</th>
              </tr>
            </thead>
            <tbody>
              {values &&
                ['Consumer Protection', 'Cybercrime', 'Electronic Transactions', 'Indirect Taxation', 'Privacy and Data Protection'].map(law_name => (
                  <tr key={law_name}>
                    <td>{law_name}</td>
                    <td>
                      <div>
                        <span className="bar" style={{ width: `${values.legislationStats[law_name].Legislation.World}%` }}>
                          <span className="bar_value">
                            <span className="bar_number">{roundNr({ x: values.legislationStats[law_name].Legislation.World, d: 0 })}</span>
                            <span className="bar_unit">%</span>
                          </span>
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </>
        )}
        {type !== 'Overview' && (
          <>
            <thead>
              <tr>
                <th className="region">Country group</th>
                <th className="share">{type}</th>
              </tr>
            </thead>
            <tbody>
              {values &&
                ['World', 'Africa', 'Asia and Oceania', 'Developed countries', 'Developing countries', 'Landlocked developing countries', 'Latin America and Caribbean', 'Least developed countries', 'Small island developing states'].map(region => (
                  <tr key={region}>
                    <td>{region}</td>
                    <td>
                      <div>
                        <span className="bar" style={{ width: `${values.legislationStats[type].Legislation[region]}%` }}>
                          <span className="bar_value">
                            <span className="bar_number">{roundNr({ x: values.legislationStats[type].Legislation[region], d: 0 })}</span>
                            <span className="bar_unit">%</span>
                          </span>
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </>
        )}
      </table>
      <table style={{ width: `${containerSize.width}px` }} cellPadding="0" cellSpacing="0">
        <thead>
          {['Africa', 'Asia and Oceania', 'Developed countries', 'Developing countries', 'Landlocked developing countries', 'Latin America and Caribbean', 'Least developed countries', 'Small island developing states'].filter(region => (country ? country.some(c => c.value === region) : true)).length > 0 && (
            <tr>
              <th className="name" colSpan="2">
                Region
              </th>
              <th className="info" colSpan="1">
                Details
              </th>
            </tr>
          )}
        </thead>
        <tbody>
          {type === 'Overview' &&
            ['Africa', 'Asia and Oceania', 'Developed countries', 'Developing countries', 'Landlocked developing countries', 'Latin America and Caribbean', 'Least developed countries', 'Small island developing states']
              .filter(region => (country ? country.some(c => c.value === region) : true))
              .map(region => {
                const rowId = region;
                const isExpanded = !!expandedRows[rowId];
                return (
                  <React.Fragment key={rowId}>
                    <tr className={isExpanded || country?.some(c => c.value === region) ? 'expanded' : ''} onClick={() => toggleRow(rowId)} style={{ cursor: 'pointer' }}>
                      <td className="name" colSpan="2">
                        {region}
                      </td>
                      <td className="info" colSpan="1">
                        {isExpanded || country?.some(c => c.value === region) ? '▼ Hide' : '▶ Show'}{' '}
                      </td>
                    </tr>
                    {/* Hidden details row */}
                    {(isExpanded || country?.some(c => c.value === region)) && (
                      <tr className="subrow">
                        <td colSpan="3">
                          <div className="subrow-content">
                            {['Consumer Protection', 'Cybercrime', 'Electronic Transactions', 'Indirect Taxation', 'Privacy and Data Protection'].map(law_name => (
                              <div key={law_name}>
                                <span className="label">{law_name}</span>
                                {': '}
                                <span className="label">{roundNr({ x: values.legislationStats[law_name].Legislation[region], d: 0 })}%</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
          {type !== 'Overview' &&
            ['Africa', 'Asia and Oceania', 'Developed countries', 'Developing countries', 'Landlocked developing countries', 'Latin America and Caribbean', 'Least developed countries', 'Small island developing states']
              .filter(region => (country ? country.some(c => c.value === region) : true))
              .map(region => {
                const rowId = region;
                const isExpanded = !!expandedRows[rowId];
                return (
                  <React.Fragment key={rowId}>
                    <tr className={isExpanded || country?.some(c => c.value === region) ? 'expanded' : ''} onClick={() => toggleRow(rowId)} style={{ cursor: 'pointer' }}>
                      <td className="name" colSpan="2">
                        {region}
                      </td>
                      <td className="info" colSpan="1">
                        {isExpanded || country?.some(c => c.value === region) ? '▼ Hide' : '▶ Show'}{' '}
                      </td>
                    </tr>
                    {/* Hidden details row */}
                    {(isExpanded || country?.some(c => c.value === region)) && (
                      <tr className="subrow">
                        <td colSpan="3">
                          <div className="subrow-content">
                            {['Legislation', 'Draft Legislation', 'No Legislation', 'No Data'].map(answer => (
                              <div key={answer}>
                                <span className="label">{answer}</span>
                                {': '}
                                <span className="label">{roundNr(values.legislationStats[type][answer][region], 0)}%</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
        </tbody>
        <thead>
          {tableData.length > 0 && (
            <tr>
              <th className="name">Country</th>
              <th>Area(s)</th>
              <th className="info">Details</th>
            </tr>
          )}
        </thead>
        <tbody>
          {tableData.length > 0 &&
            tableData.map(el => {
              const rowId = el.country;
              const isExpanded = !!expandedRows[rowId];
              return (
                <React.Fragment key={rowId}>
                  <tr className={isExpanded || country?.some(c => c.value === el.country) ? 'expanded' : ''} onClick={() => toggleRow(rowId)} style={{ cursor: 'pointer' }}>
                    <td className="name">{el.country}</td>
                    <td className="count">{setCount(el)}</td>
                    <td className="info">{isExpanded || country?.some(c => c.value === el.country) ? '▼ Hide' : '▶ Show'} </td>
                  </tr>
                  {/* Hidden details row */}
                  {(isExpanded || country?.some(c => c.value === el.country)) && (
                    <tr className="subrow">
                      <td colSpan="3">
                        <div className="subrow-content">
                          {['Consumer Protection', 'Cybercrime', 'Electronic Transactions', 'Indirect Taxation', 'Privacy and Data Protection'].map(law => (
                            <div key={law}>
                              <span className="icon">{generateIcon(el[law])}</span> <span className="label">{law}</span>{' '}
                              {values.document_links[el.code][law] &&
                                values.document_links[el.code][law].map(link => (
                                  <a href={link[0]} key={link} title={link[1]} target="_blank" rel="noreferrer">
                                    <img className="download_icon" src="https://storage.unctad.org/2026-cyberlaw_tracker/assets/img/document.png" alt="Download document" />
                                  </a>
                                ))}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

export default ChartTable;
