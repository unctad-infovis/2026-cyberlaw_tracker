// Legislation-status colour scale, keyed on the selected indicator type
const getColorFromValue = (value, region_data, type) => {
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
};

export default getColorFromValue;
