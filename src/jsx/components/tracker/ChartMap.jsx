import Highcharts from 'highcharts';

import { useCallback, useEffect, useMemo, useRef } from 'react';

// https://www.highcharts.com/
import 'highcharts/modules/accessibility';
import 'highcharts/modules/exporting';
import 'highcharts/modules/export-data';
import 'highcharts/modules/map';
import 'highcharts/modules/pattern-fill';

import { renderToString } from 'react-dom/server';

// Load helpers.
import generateIcon from './helpers/GenerateIcon.jsx';
import createMaplineSeries from '@unctad-infovis/map-tools/CreateMaplineSeries.js';
import getColor from '@unctad-infovis/map-tools/GetColor.js';
import getValue from '@unctad-infovis/map-tools/GetValue.js';
import processTopoObject from '@unctad-infovis/map-tools/ProcessTopoObject.js';
import processTopoObjectPolygons from '@unctad-infovis/map-tools/ProcessTopoObjectPolygons.js';
import getColorFromValue from './map/GetColorFromValue.js';
import getRegionData from './map/GetRegionData.js';

function ChartMap({ hover_country = null, table_collapsed, type, values }) {
  const chartMapRef = useRef(null);
  const chinaAreas = useMemo(() => ['156', '158', '344', '446'], []);

  useEffect(() => {
    const container = document.querySelector('.map_container');
    if (!container) return;

    container.style.width = table_collapsed === 'collapsed' ? 'calc(100% - 40px)' : 'calc(100% - 400px)';
  }, [table_collapsed]);

  useEffect(() => {
    if (chartMapRef.current?.renderTo) {
      if (hover_country && hover_country.length > 0) {
        const point = chartMapRef.current.series[0].data.filter(p => hover_country.some(c => c.label === p.name));

        if (point.length > 0) {
          chartMapRef.current.tooltip.refresh(point);
        } else {
          chartMapRef.current.tooltip.hide(50);
        }
      } else {
        chartMapRef.current.tooltip.hide(50);
      }
    }
  }, [hover_country]);

  useEffect(() => {
    if (chartMapRef.current?.renderTo) {
      const series = chartMapRef.current.series.find(s => s.name === 'economies_color');
      if (!series?.points?.length) return;

      series.points.forEach(point => {
        if (point.region_data) {
          point.update(
            { color: getColor(point.region_data, values.data, chinaAreas, (value, region_data) => getColorFromValue(value, region_data, type)) },
            false // do not redraw yet
          );
        }
      });

      chartMapRef.current.redraw();
    }
  }, [chinaAreas, type, values]);

  const createMap = useCallback(
    (data, topology) => {
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
          'M',
          x + w * 0.5,
          y,
          'L',
          x + w * 0.5,
          y + h * 0.7,
          // Arrow head
          'M',
          x + w * 0.3,
          y + h * 0.5,
          'L',
          x + w * 0.5,
          y + h * 0.7,
          'L',
          x + w * 0.7,
          y + h * 0.5,
          // Box
          'M',
          x,
          y + h * 0.9,
          'L',
          x,
          y + h,
          'L',
          x + w,
          y + h,
          'L',
          x + w,
          y + h * 0.9
        ];
        return path;
      };
      chartMapRef.current = Highcharts.mapChart('map_container', {
        caption: {
          enabled: false
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
        mapView: {
          maxZoom: 4
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
              events: {}
            }
          }
        },
        responsive: {
          rules: [
            {
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
            }
          ]
        },
        series: [
          {
            // The colored layer series.
            affectsMapView: true,
            mapData: processTopoObjectPolygons(topology, 'economies-color'),
            data: topology.objects.economies.geometries.map(region => {
              const found = data.find(d => d.code === region.properties.code);
              region.properties = found ? { ...region.properties, ...found } : region.properties;
              return {
                borderWidth: 0,
                code: region.properties.code,
                color: getColor(region.properties, data, chinaAreas, (value, region_data) => getColorFromValue(value, region_data, type)),
                events: {
                  click() {
                    return true;
                  },
                  mouseOver() {
                    if (this.id === 'C00003') {
                      return false;
                    }
                    if (chinaAreas.includes(this.id)) {
                      const { chart } = this.series;
                      chinaAreas.forEach(area => {
                        chart.get(area)?.setState('hover');
                      });
                    }
                    return true;
                  },
                  mouseOut: () => {
                    const { chart } = chartMapRef.current.series[0];
                    chinaAreas.forEach(area => {
                      chart.get(area)?.setState('');
                    });
                  }
                },
                region_data: getRegionData(region.properties, data, chinaAreas),
                id: region.properties.code,
                name: region.properties.labelen,
                value: getValue(region.properties, data, chinaAreas)
              };
            }),
            enableMouseTracking: true,
            joinBy: ['code', 'code'],
            name: 'economies_color',
            nullColor: '#ded9d5',
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
          // Using the function to create mapline series
          createMaplineSeries('dash_borders', processTopoObject(topology, 'dashed-borders'), 'Dash'),
          createMaplineSeries('dot_borders', processTopoObject(topology, 'dotted-borders'), 'Dot'),
          createMaplineSeries('dash_dot_borders', processTopoObject(topology, 'plain-borders'), 'DashDot'),
          createMaplineSeries('solid_borders', processTopoObject(topology, 'plain-borders'), 'Solid')
        ],
        subtitle: {
          text: null
        },
        tooltip: {
          useHTML: true,
          enabled: true,
          formatter() {
            return `
            <div class="map_tooltip">
              <h5>${this.name}</h5>
              <div class="main">Legislation in ${this.value} ${this.value === 1 ? 'area' : 'areas'}</div>
              <div><span class="icon">${renderToString(generateIcon(this.region_data['Electronic Transactions']))}</span> Electronic Transactions</div>
              <div><span class="icon">${renderToString(generateIcon(this.region_data['Consumer Protection']))}</span> Consumer Protection</div>
              <div><span class="icon">${renderToString(generateIcon(this.region_data['Privacy and Data Protection']))}</span> Privacy and Data Protection</div>
              <div><span class="icon">${renderToString(generateIcon(this.region_data.Cybercrime))}</span> Cybercrime</div>
              <div><span class="icon">${renderToString(generateIcon(this.region_data['Indirect Taxation']))}</span> Indirect Taxation</div>
            </div>`;
          },
          style: {
            color: '#000',
            fontFamily: 'Inter, Helvetica, Arial, sans-serif',
            fontSize: '13px',
            fontWeight: 300
          }
        },
        title: {
          text: null
        }
      });
      return () => {
        if (chartMapRef.current) {
          chartMapRef.current.destroy(); // Cleanup on unmount
          chartMapRef.current = null;
        }
      };
    },
    [chinaAreas, type]
  );

  useEffect(() => {
    if (!values.topology) return;
    const { data, topology } = values;

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
