// Define a color mapping function based on value (special cases dealt with by getColor)
function getColorFromValue(value, region_data, type) {
  if (type !== 'Overview') {
    if (value === null || value === undefined || Number.isNaN(value) || !type) {
      return '#DED9D5';
    }
    if (region_data[type] === 'Legislation') {
      return '#009EDB';
    }
    if (region_data[type] === 'Draft Legislation') {
      return '#FBAF17';
    }
    if (region_data[type] === 'No Legislation') {
      return '#ED1847';
    }
    return '#DED9D5';
  }
  // Return grey if value is null, NaN, or undefined
  if (value === null || value === undefined || Number.isNaN(value) || !type) {
    return '#DED9D5';
  }
  if (value === 5) {
    return '#004987';
  }
  if (value === 4) {
    return '#0077B8';
  }
  if (value === 3) {
    return '#009EDB';
  }
  if (value === 2) {
    return '#C5DFEF';
  }
  if (value === 1) {
    return '#E3EDF6';
  }
  if (value === 0) {
    return '#ED1847';
  }
  return '#DED9D5';
}

// Define a color mapping function based on value **and code**
const getColor = (region_data, code, data, type, china_areas) => {
  const value = (region_data) ? region_data.value : null;
  // First check if this code is special
  if (code === 'C00002') { // AksaiChin
    const kashmirData = data.find(item => item.code === 'C00007'); // Find kashmir in data
    const kashmirValue = kashmirData ? kashmirData.value : null; // Get kashmir's value, default to null
    const chinaData = data.find(item => item.code === '156'); // Find china in data
    const chinaValue = chinaData ? chinaData.value : null; // Get china's value, default to null
    return {
      pattern: {
        backgroundColor: getColorFromValue(kashmirValue, kashmirData, type),
        color: getColorFromValue(chinaValue, chinaData, type),
        height: 10 / 100000, // Height of the pattern
        path: {
          d: 'M 0 10 L 10 0 M -1 1 L 1 -1 M 9 11 L 11 9',
          strokeWidth: 2.5 * Math.sqrt(2),
        },
        width: 10 // Width of the pattern
      }
    };
  }
  if (code === 'C00003') { // ArunachalPradesh = India
    const indiaData = data.find(item => item.code === '356');
    const indiaValue = indiaData ? indiaData.value : null;
    return getColorFromValue(indiaValue, indiaData, type);
  }
  if (code === '412') { // Kosovo = Serbia
    const serbiaData = data.find(item => item.code === '688');
    const serbiaValue = serbiaData ? serbiaData.value : null;
    return getColorFromValue(serbiaValue, serbiaData, type);
  }
  if (china_areas.includes(code)) { // Macao, HongKong, China, Taiwan = China
    const chinaData = data.find(item => item.code === '156');
    const chinaValue = chinaData ? chinaData.value : null;
    return getColorFromValue(chinaValue, chinaData, type);
  }

  return getColorFromValue(value, region_data, type);
};

export default getColor;
