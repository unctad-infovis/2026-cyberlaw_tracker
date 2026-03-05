import React, {
  useRef, useState, useEffect
} from 'react';
import PropTypes from 'prop-types';
import generateIcon from '../helpers/map/GenerateIcon.jsx';
import roundNr from '../helpers/RoundNr.js';
// import Highcharts from 'highcharts';

function ChartTable({
  /* hover_country = null, */ country = null, /* setHoverCountry, setCountry, */ table_collapsed, type, values
}) {
  const chartTableRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [tableData, setTableData] = useState(false);

  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (rowId) => {
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
  }, [table_collapsed]);

  useEffect(() => {
    if (country) {
      setTableData(
        values[1].filter(el => country.some(c => c.label === el.country))
      );
    } else {
      setTableData(values[1]);
    }
  }, [country, values]);

  const setCount = (el) => {
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
              {values && ['Consumer Protection', 'Cybercrime', 'Electronic Transactions', 'Indirect Taxation', 'Privacy and Data Protection'].map((law_name) => (
                <tr key={law_name}>
                  <td>{law_name}</td>
                  <td>
                    <div>
                      <span className="bar" style={{ width: `${values.legislationStats[law_name].Legislation.World}%` }}>
                        <span className="bar_value">
                          <span className="bar_number">{roundNr(values.legislationStats[law_name].Legislation.World, 0)}</span>
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
            {values && ['World', 'Africa', 'Asia and Oceania', 'Developed countries', 'Developing countries', 'Landlocked developing countries', 'Latin America and Caribbean', 'Least developed countries', 'Small island developing states'].map((region) => (
              <tr key={region}>
                <td>{region}</td>
                <td>
                  <div>
                    <span className="bar" style={{ width: `${values.legislationStats[type].Legislation[region]}%` }}>
                      <span className="bar_value">
                        <span className="bar_number">{roundNr(values.legislationStats[type].Legislation[region], 0)}</span>
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
      <br />
      <table style={{ width: `${containerSize.width}px` }} cellPadding="0" cellSpacing="0">
        <thead>
          <tr>
            <th className="name" colSpan="2">Region</th>
            <th className="info" colSpan="1">Details</th>
          </tr>
        </thead>
        <tbody>
          {type === 'Overview' && ['Africa', 'Asia and Oceania', 'Developed countries', 'Developing countries', 'Landlocked developing countries', 'Latin America and Caribbean', 'Least developed countries', 'Small island developing states'].map((region) => {
            const rowId = region;
            const isExpanded = !!expandedRows[rowId];
            return (
              <React.Fragment key={rowId}>
                <tr
                  className={((isExpanded || (country && country.label === region))) ? 'expanded' : ''}
                  onClick={() => toggleRow(rowId)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="name" colSpan="2">{region}</td>
                  <td className="info" colSpan="1">
                    {(isExpanded || (country && country.label === region)) ? '▼ Hide' : '▶ Show'}
                    {' '}
                  </td>
                </tr>
                {/* Hidden details row */}
                {(isExpanded || (country && country.label === region)) && (
                  <tr className="subrow">
                    <td colSpan="3">
                      <div className="subrow-content">
                        {['Consumer Protection', 'Cybercrime', 'Electronic Transactions', 'Indirect Taxation', 'Privacy and Data Protection'].map((law_name) => (
                          <div key={law_name}>
                            <span className="label">{law_name}</span>
                            {': '}
                            <span className="label">
                              {roundNr(values.legislationStats[law_name].Legislation[region], 0)}
                              %
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
          {type !== 'Overview' && ['Africa', 'Asia and Oceania', 'Developed countries', 'Developing countries', 'Landlocked developing countries', 'Latin America and Caribbean', 'Least developed countries', 'Small island developing states'].map((region) => {
            const rowId = region;
            const isExpanded = !!expandedRows[rowId];
            return (
              <React.Fragment key={rowId}>
                <tr
                  className={((isExpanded || (country && country.label === region))) ? 'expanded' : ''}
                  onClick={() => toggleRow(rowId)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="name" colSpan="2">{region}</td>
                  <td className="info" colSpan="1">
                    {(isExpanded || (country && country.label === region)) ? '▼ Hide' : '▶ Show'}
                    {' '}
                  </td>
                </tr>
                {/* Hidden details row */}
                {(isExpanded || (country && country.label === region)) && (
                  <tr className="subrow">
                    <td colSpan="3">
                      <div className="subrow-content">
                        {['Legislation', 'Draft Legislation', 'No Legislation', 'No Data'].map((answer) => (
                          <div key={answer}>
                            <span className="label">{answer}</span>
                            {': '}
                            <span className="label">
                              {roundNr(values.legislationStats[type][answer][region], 0)}
                              %
                            </span>
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
        <br />
        <thead>
          <tr>
            <th className="name">Country</th>
            <th>Count</th>
            <th className="info">Details</th>
          </tr>
        </thead>
        <tbody>
          {tableData && tableData.map(el => {
            const rowId = el.country;
            const isExpanded = !!expandedRows[rowId];
            return (
              <React.Fragment key={rowId}>
                <tr
                  className={((isExpanded || (country && country.label === el.country))) ? 'expanded' : ''}
                  onClick={() => toggleRow(rowId)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="name">{el.country}</td>
                  <td className="count">{setCount(el)}</td>
                  <td className="info">
                    {(isExpanded || (country && country.label === el.country)) ? '▼ Hide' : '▶ Show'}
                    {' '}
                  </td>
                </tr>
                {/* Hidden details row */}
                {(isExpanded || (country && country.label === el.country)) && (
                  <tr className="subrow">
                    <td colSpan="3">
                      <div className="subrow-content">
                        {['Consumer Protection', 'Cybercrime', 'Electronic Transactions', 'Indirect Taxation', 'Privacy and Data Protection'].map((law) => (
                          <div key={law}>
                            <span className="icon">{generateIcon(el[law])}</span>
                            {' '}
                            <span className="label">{law}</span>
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

ChartTable.propTypes = {
  country: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired
      })
    ),
    PropTypes.oneOf([null])
  ]),
  // hover_country: PropTypes.oneOfType([
  //   PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired }),
  //   PropTypes.oneOf([null]),
  // ]),
  // setCountry: PropTypes.func.isRequired,
  // setHoverCountry: PropTypes.func.isRequired,
  table_collapsed: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  values: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.object, PropTypes.array])).isRequired
};

export default ChartTable;
