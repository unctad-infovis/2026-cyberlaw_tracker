import React, {
} from 'react';

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

export default generateIcon;
