import React from 'react';
import { fontSizeMd } from '../themetokenchk';

interface Props {
  description?: React.ReactNode;
  [key: string]: any;
}

export default function EmptyState({
  description = 'Không có kết quả tìm kiếm',
}: Props) {
  return (
    <div
      style={{
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 10,
        fontSize: fontSizeMd,
        color: '#7E6B3F',
      }}
    >
      {description}
    </div>
  );
}


