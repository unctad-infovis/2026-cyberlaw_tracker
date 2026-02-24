// Define a color mapping function based on value **and code**
const getValue = (code, data, region, china_areas) => {
  const match = data.find(row => row.code === region.properties.code);

  // First check if this code is special
  if (code === 'C00002') { // AksaiChin
    return null;
  }
  if (code === 'C00003') { // ArunachalPradesh = India
    const indiaData = data.find(item => item.code === '356');
    return indiaData || null;
  }
  if (code === '412') { // Kosovo = Serbia
    const serbiaData = data.find(item => item.code === '688');
    return serbiaData || null;
  }
  if (china_areas.includes(code)) { // Macao, HongKong, China, Taiwan = China
    const chinaData = data.find(item => item.code === '156');
    return chinaData || null;
  }
  return match || null;
};

export default getValue;
