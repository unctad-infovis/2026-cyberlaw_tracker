import React, {
  useEffect, useCallback, useRef, useMemo
} from 'react';
import PropTypes from 'prop-types';

// https://www.highcharts.com/
import Highcharts from 'highcharts';
import 'highcharts/modules/map';
import 'highcharts/modules/accessibility';
import 'highcharts/modules/exporting';
import 'highcharts/modules/export-data';
import 'highcharts/modules/pattern-fill';

// Load map helpers.
import processTopoObjectPolygons from '../helpers/map/ProcessTopoObjectPolygons.js';
import processTopoObject from '../helpers/map/ProcessTopoObject.js';
import createMaplineSeries from '../helpers/map/CreateMaplineSeries.js';
import getColor from '../helpers/map/GetColor.js';
import getValue from '../helpers/map/GetValue.js';
// import getColorAxis from '../helpers/map/GetColorAxis.js';

// https://www.npmjs.com/package/uuid4
// import { v4 as uuidv4 } from 'uuid';

function ChartMap({
  country = null, hover_country = null, setCountry, setHoverCountry, table_collapsed, type, values
}) {
  const chartMapRef = useRef(null);
  const chinaAreas = useMemo(() => ['156', '158', '344', '446'], []);

  useEffect(() => {
    const container = document.querySelector('.map_container');
    if (!container) return;

    container.style.width = (table_collapsed === 'collapsed') ? 'calc(100% - 40px)' : 'calc(100% - 400px)';
  }, [table_collapsed]);

  useEffect(() => {
    if (chartMapRef.current?.renderTo) {
      if (hover_country !== null) {
        const point = chartMapRef.current.series[0].data.filter(p => p.name === hover_country.label);
        if (point.length > 0) {
          chartMapRef.current.tooltip.refresh(point);
        } else {
          chartMapRef.current.tooltip.hide(50);
        }
      } else {
        chartMapRef.current.tooltip.hide(50);
      }
    }
  }, [hover_country, type, values]);

  useEffect(() => {
    if (chartMapRef.current?.renderTo) {
      const series = chartMapRef.current.series.find(
        s => s.name === 'economies_color'
      );
      if (!series || !series.points?.length) return;

      series.points.forEach(point => {
        const code = point.id;
        const newColor = getColor(point.region_data, code, values[1], type, chinaAreas);

        point.update(
          { color: newColor },
          false // do not redraw yet
        );
      });

      chartMapRef.current.redraw();
    }
  }, [chinaAreas, type, values]);

  const createMap = useCallback((data, topology) => {
    // Prepare a mapping of code -> labelen, labelfr from topology
    const labelMap = topology.objects.economies.geometries.reduce((mapLabel, geometry) => {
      const { code, labelen, labelfr } = geometry.properties; // Extract properties from geometry
      mapLabel[code] = { labelen, labelfr }; // Map code to labelen and labelfr
      return mapLabel;
    }, {});
    // Manually insert European Union label
    labelMap['918'] = {
      labelen: 'European Union',
      labelfr: 'Union européenne'
    };

    Highcharts.setOptions({
      lang: {
        decimalPoint: '.',
        downloadCSV: 'Download CSV data',
        thousandsSep: ' '
      }
    });
    Highcharts.SVGRenderer.prototype.symbols.download = (x, y, w, h) => {
      const path = [
        // Arrow stem
        'M', x + w * 0.5, y,
        'L', x + w * 0.5, y + h * 0.7,
        // Arrow head
        'M', x + w * 0.3, y + h * 0.5,
        'L', x + w * 0.5, y + h * 0.7,
        'L', x + w * 0.7, y + h * 0.5,
        // Box
        'M', x, y + h * 0.9,
        'L', x, y + h,
        'L', x + w, y + h,
        'L', x + w, y + h * 0.9
      ];
      return path;
    };
    chartMapRef.current = Highcharts.mapChart('map_container', {
      caption: {
        enabled: false,
      },
      chart: {
        backgroundColor: 'transparent',
        height: Math.max((document.getElementById('map_container').offsetWidth * 7) / 16, 450),
        type: 'map'
      },
      credits: {
        enabled: false
      },
      exporting: {
        buttons: {
          contextButton: {
            menuItems: ['viewFullscreen', 'separator', 'downloadPNG', 'downloadPDF', 'separator', 'downloadCSV'],
            symbol: 'download',
            symbolFill: '#000',
            y: 10
          }
        },
        enabled: false,
        filename: '2026-cyberlaw_tracker'
      },
      legend: {
        enabled: false
      },
      mapNavigation: {
        buttonOptions: {
          x: 0,
          verticalAlign: 'bottom'
        },
        enableButtons: true,
        enabled: false
      },
      plotOptions: {
        mapline: {
          lineWidth: 0.33,
          tooltip: {
            enabled: false
          }
        },
        series: {
          point: {
            events: {
            }
          }
        }
      },
      responsive: {
        rules: [{
          chartOptions: {
            title: {
              style: {
                fontSize: '26px',
                lineHeight: '30px'
              }
            },
            exporting: {
              enabled: false
            }
          },
          condition: {
            maxWidth: 500
          }
        }]
      },
      series: [
        {
          // The colored layer series.
          affectsMapView: true,
          data: processTopoObjectPolygons(topology, 'economies-color').map(region => {
            const { code } = region.properties; // Store region code
            const region_data = getValue(code, data, region, chinaAreas);
            const value = (region_data) ? region_data.value : null;
            let labelen = code;
            if (labelMap[code]) {
              labelen = labelMap[code].labelen;
            }
            return {
              borderWidth: 0,
              color: getColor(region_data, code, data, type, chinaAreas),
              geometry: region.geometry,
              id: code,
              events: {
                click() {
                  const hovered = this;
                  if (country && country.label === hovered.name) {
                    setCountry({ label: null, value: null });
                  } else {
                    setCountry({ label: hovered.name, value: hovered.name });
                  }
                  return true;
                },
                mouseOver() {
                  const hovered = this;
                  setHoverCountry({ label: hovered.name, value: hovered.name });
                  if (hovered.id === 'C00003') {
                    return false;
                  }
                  if (chinaAreas.includes(hovered.id)) {
                    const { chart } = hovered.series;
                    chinaAreas.forEach((area) => {
                      chart.get(area)?.setState('hover');
                    });
                  }
                  return true;
                },
                mouseOut: () => {
                  const { chart } = chartMapRef.current.series[0];
                  chinaAreas.forEach((area) => {
                    chart.get(area)?.setState('');
                  });
                  setHoverCountry(null);
                }
              },
              region_data,
              name: labelen,
              value
            };
          }),
          enableMouseTracking: true,
          name: 'economies_color',
          states: {
            hover: {
              borderColor: '#fff',
              borderWidth: 2
            },
            inactive: {
              enabled: false
            }
          },
          type: 'map',
          visible: true
        },
        {
          // The helper layer series for tooltips.
          affectsMapView: false,
          data: processTopoObjectPolygons(topology, 'economies').map(region => ({
            borderWidth: 0,
            geometry: region.geometry
          })),
          enableMouseTracking: false,
          name: 'economies',
          states: {
            inactive: {
              enabled: false
            }
          },
          type: 'map',
          visible: false
        },
        // Using the function to create mapline series
        createMaplineSeries('dash_borders', processTopoObject(topology, 'dashed-borders'), 'Dash'),
        createMaplineSeries('dot_borders', processTopoObject(topology, 'dotted-borders'), 'Dot'),
        createMaplineSeries('dash_dot_borders', processTopoObject(topology, 'plain-borders'), 'DashDot'),
        createMaplineSeries('solid_borders', processTopoObject(topology, 'plain-borders'), 'Solid'),
      ],
      subtitle: {
        text: null,
      },
      tooltip: {
        useHTML: true,
        enabled: true,
        formatter() {
          const point = this;
          return `
            <div class="tooltip">
              <h5>${point.name}</h5>
              <div class="main">Legislation in ${point.value} areas</div>
              <div>Electronic Transactions: ${point.region_data['Electronic Transactions']}</div>
              <div>Consumer Protection: ${point.region_data['Consumer Protection']}</div>
              <div>Privacy and Data Protection: ${point.region_data['Privacy and Data Protection']}</div>
              <div>Cybercrime: ${point.region_data.Cybercrime}</div>
              <div>Indirect Taxation: ${point.region_data['Indirect Taxation']}</div>
            `;
        },
        style: {
          color: '#000',
          fontFamily: 'Inter, Helvetica, Arial, sans-serif',
          fontSize: '13px',
          fontWeight: 300,
        }
      },
      title: {
        text: null,
      }
    });
    return () => {
      if (chartMapRef.current) {
        chartMapRef.current.destroy(); // Cleanup on unmount
        chartMapRef.current = null;
      }
    };
  }, [chartMapRef, chinaAreas, country, setHoverCountry, setCountry, type]);

  useEffect(() => {
    const [topology, data] = values;

    // Extract the transformation values from the TopoJSON
    const { scale, translate } = topology.transform;

    // Extract and transform the point coordinates for 'economies-point'
    const coordinatesMap = topology.objects['economies-point'].geometries.reduce((mapCoordinates, geometry) => {
      const [x, y] = geometry.coordinates; // Original projected coordinates

      // Apply inverse transformation (reverse scaling and translation)
      const lon = x * scale[0] + translate[0];
      const lat = y * scale[1] + translate[1];

      const economyCode = geometry.properties.code;
      mapCoordinates[economyCode] = { lon, lat }; // Map code to coordinates
      return mapCoordinates;
    }, {});
    coordinatesMap['918'] = {
      lon: 69042 * scale[0] + translate[0],
      lat: 64101 * scale[1] + translate[1]
    };

    if (!chartMapRef.current?.renderTo) {
      createMap(data, topology);
    }
  }, [createMap, values]);

  return (
    <div className="map_container">
      <div id="map_container" ref={chartMapRef} />
    </div>
  );
}

export default ChartMap;

ChartMap.propTypes = {
  country: PropTypes.oneOfType([
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired
    }),
    PropTypes.oneOf([null])
  ]),
  hover_country: PropTypes.oneOfType([
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired
    }),
    PropTypes.oneOf([null])
  ]),
  setCountry: PropTypes.func.isRequired,
  setHoverCountry: PropTypes.func.isRequired,
  table_collapsed: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  values: PropTypes.arrayOf(PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.object
  ])).isRequired
};
