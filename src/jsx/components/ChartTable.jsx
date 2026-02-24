import React, {
  useRef, useState, useEffect
} from 'react';
import PropTypes from 'prop-types';
// import Highcharts from 'highcharts';
import Tooltip from '../helpers/swarm/Tooltip.jsx';

function ChartTable({
  /* hover_country = null, */ country = null, /* setHoverCountry, setCountry, */ table_collapsed, /* type, */ values
}) {
  const chartTableRef = useRef(null);
  const tooltipRef = useRef(null);
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
      setTableData([...values[1].filter(el => el.country === country.label)]);
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

  const generateIcon = (value) => {
    if (value === 'No Data') {
      return <span className="no_data" />;
    }
    if (value === 'No Legislation') {
      return <span className="no_legislation" />;
    }
    if (value === 'Draft Legislation') {
      return <span className="draft_legislation" />;
    }
    if (value === 'Legislation') {
      return <span className="legislation" />;
    }
    return <span />;
  };

  return (
    <div ref={chartTableRef} className="table_container">
      <table style={{ width: `${containerSize.width}px` }} cellPadding="0" cellSpacing="0">
        <thead>
          <tr>
            <th className="name">Country</th>
            <th className="count">Count</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {tableData && tableData.map(el => {
            const rowId = el.country; // stable ID
            const isExpanded = !!expandedRows[rowId];
            return (
              <React.Fragment key={rowId}>
                {/* Main row */}
                <tr
                  className={((isExpanded || (country && country.label === el.country))) ? 'expanded' : ''}
                  onClick={() => toggleRow(rowId)}
                  style={{ cursor: 'pointer', }}
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
                      <div>
                        <span className="label">Electronic Transactions:</span>
                        {' '}
                        <span className="icon">{generateIcon(el['Electronic Transactions'])}</span>
                      </div>
                      <div>
                        <span className="label">Consumer Protection:</span>
                        {' '}
                        <span className="icon">{generateIcon(el['Consumer Protection'])}</span>
                      </div>
                      <div>
                        <span className="label">Privacy and Data Protection:</span>
                        {' '}
                        <span className="icon">{generateIcon(el['Privacy and Data Protection'])}</span>
                      </div>
                      <div>
                        <span className="label">Cybercrime:</span>
                        {' '}
                        <span className="icon">{generateIcon(el.Cybercrime)}</span>
                      </div>
                      <div>
                        <span className="label">Indirect Taxation:</span>
                        {' '}
                        <span className="icon">{generateIcon(el['Indirect Taxation'])}</span>
                      </div>
                    </div>
                  </td>
                </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      <Tooltip ref={tooltipRef} />
    </div>
  );
}

ChartTable.propTypes = {
  country: PropTypes.oneOfType([
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired
    }),
    PropTypes.oneOf([null])
  ]),
  // hover_country: PropTypes.oneOfType([
  //   PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired }),
  //   PropTypes.oneOf([null]),
  // ]),
  // setCountry: PropTypes.func.isRequired,
  // setHoverCountry: PropTypes.func.isRequired,
  table_collapsed: PropTypes.string.isRequired,
  // type: PropTypes.string.isRequired,
  values: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.object, PropTypes.array])).isRequired
};

export default ChartTable;
